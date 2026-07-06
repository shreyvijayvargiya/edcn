import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { preloadProjectImages } from "./imageCache";
import { getTotalDuration, resolveTime } from "./timeline";

export const EXPORT_FORMATS = [
	{ value: "mp4", label: "MP4 video" },
	{ value: "gif", label: "GIF animation" },
];

const GIF_MAX_WIDTH = 480;
const GIF_FPS = 12;

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function nextFrame() {
	return new Promise((resolve) => {
		requestAnimationFrame(() => requestAnimationFrame(resolve));
	});
}

function normalizeRange(project, startTime, endTime) {
	const total = getTotalDuration(project.scenes);
	const start = Math.max(0, startTime ?? 0);
	const end = Math.min(endTime ?? total, total);
	if (end - start < 0.1) {
		throw new Error("Export range must be at least 0.1 seconds.");
	}
	return { start, end, total, duration: end - start };
}

function pickMp4MimeType() {
	const candidates = [
		"video/mp4;codecs=avc1",
		"video/mp4",
		"video/webm;codecs=vp9",
		"video/webm",
	];
	return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

function extensionForMime(mime) {
	return mime.includes("mp4") ? "mp4" : "webm";
}

/** Preload images so Konva can draw them during export frames. */
export { preloadProjectImages } from "./imageCache";

async function renderFrameLoop(
	stageRef,
	project,
	onTimeUpdate,
	{ start, end, fps, pixelRatio, onFrame, recordCanvas: externalCanvas },
) {
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	const w = Math.round(stage.width() * pixelRatio);
	const h = Math.round(stage.height() * pixelRatio);
	const recordCanvas = externalCanvas ?? document.createElement("canvas");
	recordCanvas.width = w;
	recordCanvas.height = h;
	const ctx = recordCanvas.getContext("2d");

	const frameMs = 1000 / fps;
	const frameCount = Math.ceil((end - start) * fps);
	const loopStart = performance.now();

	for (let i = 0; i <= frameCount; i += 1) {
		const elapsed = start + i / fps;
		const t = Math.min(elapsed, end - 0.001);
		const { scene, localTime } = resolveTime(project.scenes, t);

		onTimeUpdate(t, scene?.id, localTime);
		await nextFrame();
		await nextFrame();

		stage.batchDraw();
		const frameCanvas = stage.toCanvas({ pixelRatio });
		ctx.clearRect(0, 0, w, h);
		ctx.drawImage(frameCanvas, 0, 0, w, h);

		await onFrame({ canvas: recordCanvas, ctx, index: i, time: t });

		const target = loopStart + i * frameMs;
		const wait = target - performance.now();
		if (wait > 0) await sleep(wait);
	}

	onTimeUpdate(0, project.scenes[0]?.id, 0);
	stage.batchDraw();

	return { width: w, height: h };
}

/**
 * Render project to WebM/MP4 (MediaRecorder) for full timeline or a range.
 */
export async function renderProjectToVideo(
	stageRef,
	project,
	onTimeUpdate,
	{ startTime = 0, endTime, fps = 30, preferMp4 = true } = {},
) {
	const { start, end } = normalizeRange(project, startTime, endTime);
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	await preloadProjectImages(project);

	if (preferMp4 && typeof VideoEncoder !== "undefined") {
		try {
			return await renderProjectToMp4WebCodecs(stageRef, project, onTimeUpdate, {
				startTime: start,
				endTime: end,
				fps,
			});
		} catch {
			// Fall through to MediaRecorder
		}
	}

	const recordCanvas = document.createElement("canvas");
	const stream = recordCanvas.captureStream(fps);
	const mimeType = preferMp4 ? pickMp4MimeType() : pickMp4MimeType();

	const recorder = new MediaRecorder(stream, {
		mimeType,
		videoBitsPerSecond: 4_000_000,
	});

	const chunks = [];
	recorder.ondataavailable = (e) => {
		if (e.data.size > 0) chunks.push(e.data);
	};

	const done = new Promise((resolve, reject) => {
		recorder.onstop = () =>
			resolve({
				blob: new Blob(chunks, { type: mimeType }),
				ext: extensionForMime(mimeType),
			});
		recorder.onerror = reject;
	});

	recorder.start(100);

	try {
		await renderFrameLoop(stageRef, project, onTimeUpdate, {
			start,
			end,
			fps,
			pixelRatio: 2,
			recordCanvas,
			onFrame: async () => {
				const track = stream.getVideoTracks()[0];
				if (track?.requestFrame) track.requestFrame();
			},
		});
	} finally {
		recorder.stop();
	}

	return done;
}

/** MP4 via WebCodecs + mp4-muxer (Chrome, Edge). */
async function renderProjectToMp4WebCodecs(
	stageRef,
	project,
	onTimeUpdate,
	{ startTime, endTime, fps = 30 },
) {
	const { start, end } = normalizeRange(project, startTime, endTime);
	const pixelRatio = 2;
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	const width = stage.width() * pixelRatio;
	const height = stage.height() * pixelRatio;

	const muxer = new Muxer({
		target: new ArrayBufferTarget(),
		video: { codec: "avc", width, height },
		fastStart: "in-memory",
	});

	const encoder = new VideoEncoder({
		output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
		error: (e) => {
			throw e;
		},
	});

	encoder.configure({
		codec: "avc1.42001f",
		width,
		height,
		bitrate: 4_000_000,
	});

	try {
		await renderFrameLoop(stageRef, project, onTimeUpdate, {
			start,
			end,
			fps,
			pixelRatio,
			onFrame: async ({ canvas, index }) => {
				const timestampUs = Math.round((index / fps) * 1_000_000);
				const frame = new VideoFrame(canvas, { timestamp: timestampUs });
				encoder.encode(frame, { keyFrame: index % fps === 0 });
				frame.close();
			},
		});

		await encoder.flush();
	} finally {
		encoder.close();
	}

	muxer.finalize();

	const buffer = muxer.target.buffer;
	return {
		blob: new Blob([buffer], { type: "video/mp4" }),
		ext: "mp4",
	};
}

/**
 * Render a time range to animated GIF.
 */
export async function renderProjectToGif(
	stageRef,
	project,
	onTimeUpdate,
	{ startTime = 0, endTime, fps = GIF_FPS } = {},
) {
	const { start, end, duration } = normalizeRange(project, startTime, endTime);
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	if (duration > 15) {
		throw new Error("GIF export is limited to 15 seconds. Shorten the range.");
	}

	await preloadProjectImages(project);

	const srcRatio = stage.width() / stage.height();
	const outW = Math.min(GIF_MAX_WIDTH, Math.round(stage.width() * 2));
	const outH = Math.round(outW / srcRatio);
	const pixelRatio = outW / stage.width();

	const gif = GIFEncoder();
	const delayMs = Math.round(1000 / fps);

	await renderFrameLoop(stageRef, project, onTimeUpdate, {
		start,
		end,
		fps,
		pixelRatio,
		onFrame: async ({ ctx, index }) => {
			const { data, width, height } = ctx.getImageData(0, 0, outW, outH);
			const palette = quantize(data, 256);
			const indexBuf = applyPalette(data, palette);
			gif.writeFrame(indexBuf, width, height, {
				palette,
				delay: delayMs,
			});
		},
	});

	gif.finish();

	return {
		blob: new Blob([gif.bytes()], { type: "image/gif" }),
		ext: "gif",
	};
}

/** @deprecated Use renderProjectToVideo */
export async function renderProjectToWebm(stageRef, project, onTimeUpdate, opts) {
	const result = await renderProjectToVideo(stageRef, project, onTimeUpdate, {
		...opts,
		preferMp4: false,
	});
	return result.blob;
}

export async function renderProjectExport(
	stageRef,
	project,
	onTimeUpdate,
	{ format = "mp4", startTime = 0, endTime } = {},
) {
	if (format === "gif") {
		return renderProjectToGif(stageRef, project, onTimeUpdate, {
			startTime,
			endTime,
		});
	}
	return renderProjectToVideo(stageRef, project, onTimeUpdate, {
		startTime,
		endTime,
		preferMp4: format === "mp4",
	});
}

export function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function exportFilename(projectName, ext) {
	const base = (projectName || "video").replace(/[^\w\-]+/g, "_");
	return `${base}.${ext}`;
}
