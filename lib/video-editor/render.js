import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { preloadProjectImages } from "./imageCache";
import { waitForExportMedia } from "./exportMedia";
import { getTotalDuration, resolveTime } from "./timeline";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

export const EXPORT_FORMATS = [
	{ value: "mp4", label: "MP4 video" },
	{ value: "gif", label: "GIF animation" },
];

const GIF_MAX_WIDTH = 480;
const GIF_FPS = 12;
const DEFAULT_FPS = 30;

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function nextPaint() {
	return new Promise((resolve) => {
		requestAnimationFrame(resolve);
	});
}

function throwIfAborted(signal) {
	if (signal?.aborted) {
		throw new DOMException("Export cancelled", "AbortError");
	}
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

function evenSize(n) {
	const v = Math.max(2, Math.round(n));
	return v % 2 === 0 ? v : v + 1;
}

/** Export at project canvas size (not display scale × 2). */
function getExportPixelRatio(stage, project) {
	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const stageW = stage.width() || 1;
	return canvasW / stageW;
}

function getExportDimensions(stage, project, pixelRatio) {
	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const canvasH = project.canvas?.height ?? CANVAS_HEIGHT;
	if (canvasW > 0 && canvasH > 0) {
		return { width: evenSize(canvasW), height: evenSize(canvasH) };
	}
	return {
		width: evenSize(stage.width() * pixelRatio),
		height: evenSize(stage.height() * pixelRatio),
	};
}

function bitrateForSize(width, height, fps) {
	const pixels = width * height;
	const base = pixels >= 1_500_000 ? 8_000_000 : pixels >= 500_000 ? 5_000_000 : 3_500_000;
	return Math.round(base * Math.min(1.25, fps / 24));
}

async function waitForEncoderDrain(encoder, maxQueue = 4) {
	while (encoder.encodeQueueSize > maxQueue) {
		await new Promise((resolve) => {
			const prev = encoder.ondequeue;
			encoder.ondequeue = () => {
				encoder.ondequeue = prev;
				resolve();
			};
		});
	}
}

/**
 * Offline capture loop — as fast as the browser can seek + paint + encode.
 * No real-time pacing (that was the multi-minute hang for 30s videos).
 */
async function renderFrameLoop(
	stageRef,
	project,
	onTimeUpdate,
	{
		start,
		end,
		fps,
		pixelRatio,
		onFrame,
		onProgress,
		signal,
		recordCanvas: externalCanvas,
	},
) {
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	const { width: w, height: h } = getExportDimensions(stage, project, pixelRatio);
	const recordCanvas = externalCanvas ?? document.createElement("canvas");
	recordCanvas.width = w;
	recordCanvas.height = h;
	const ctx = recordCanvas.getContext("2d", { alpha: false });

	const frameCount = Math.max(1, Math.ceil((end - start) * fps));
	const totalFrames = frameCount + 1;

	for (let i = 0; i <= frameCount; i += 1) {
		throwIfAborted(signal);

		const elapsed = start + i / fps;
		const t = Math.min(elapsed, end - 0.001);
		const { scene, localTime } = resolveTime(project.scenes, t);

		onTimeUpdate(t, scene?.id, localTime);

		// Let React apply playhead + layer visibility, then seek media.
		await Promise.resolve();
		await waitForExportMedia(localTime, signal);
		await nextPaint();

		stage.batchDraw();
		const frameCanvas = stage.toCanvas({ pixelRatio, x: 0, y: 0, width: stage.width(), height: stage.height() });
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, w, h);
		ctx.drawImage(frameCanvas, 0, 0, w, h);

		await onFrame({ canvas: recordCanvas, ctx, index: i, time: t, totalFrames });

		onProgress?.({
			phase: "encoding",
			frame: i + 1,
			totalFrames,
			progress: (i + 1) / totalFrames,
			time: t,
		});

		// Yield occasionally so the UI can paint progress without forcing real-time.
		if (i % 8 === 0) await sleep(0);
	}

	onTimeUpdate(0, project.scenes[0]?.id, 0);
	stage.batchDraw();

	return { width: w, height: h, frameCount: totalFrames };
}

/** Preload images so Konva can draw them during export frames. */
export { preloadProjectImages } from "./imageCache";

/**
 * Render project to MP4 (WebCodecs) or WebM/MP4 (MediaRecorder fallback).
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @param {(p: { phase: string, progress: number, frame?: number, totalFrames?: number }) => void} [options.onProgress]
 */
export async function renderProjectToVideo(
	stageRef,
	project,
	onTimeUpdate,
	{
		startTime = 0,
		endTime,
		fps = DEFAULT_FPS,
		preferMp4 = true,
		signal,
		onProgress,
	} = {},
) {
	const { start, end } = normalizeRange(project, startTime, endTime);
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	onProgress?.({ phase: "preparing", progress: 0 });
	await preloadProjectImages(project);
	throwIfAborted(signal);

	if (preferMp4 && typeof VideoEncoder !== "undefined") {
		try {
			return await renderProjectToMp4WebCodecs(stageRef, project, onTimeUpdate, {
				startTime: start,
				endTime: end,
				fps,
				signal,
				onProgress,
			});
		} catch (err) {
			if (err?.name === "AbortError") throw err;
			// Fall through to MediaRecorder
		}
	}

	throwIfAborted(signal);
	onProgress?.({ phase: "encoding", progress: 0 });

	const pixelRatio = getExportPixelRatio(stage, project);
	const { width, height } = getExportDimensions(stage, project, pixelRatio);
	const recordCanvas = document.createElement("canvas");
	recordCanvas.width = width;
	recordCanvas.height = height;

	const stream = recordCanvas.captureStream(0);
	const mimeType = pickMp4MimeType();
	const recorder = new MediaRecorder(stream, {
		mimeType,
		videoBitsPerSecond: bitrateForSize(width, height, fps),
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
			pixelRatio,
			recordCanvas,
			signal,
			onProgress,
			onFrame: async () => {
				const track = stream.getVideoTracks()[0];
				if (track?.requestFrame) track.requestFrame();
			},
		});
	} finally {
		recorder.stop();
	}

	onProgress?.({ phase: "finalizing", progress: 1 });
	return done;
}

/** MP4 via WebCodecs + mp4-muxer (Chrome, Edge, Safari 17+). */
async function renderProjectToMp4WebCodecs(
	stageRef,
	project,
	onTimeUpdate,
	{ startTime, endTime, fps = DEFAULT_FPS, signal, onProgress },
) {
	const { start, end } = normalizeRange(project, startTime, endTime);
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	const pixelRatio = getExportPixelRatio(stage, project);
	const { width, height } = getExportDimensions(stage, project, pixelRatio);

	const muxer = new Muxer({
		target: new ArrayBufferTarget(),
		video: { codec: "avc", width, height },
		fastStart: "in-memory",
	});

	let encoderError = null;
	const encoder = new VideoEncoder({
		output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
		error: (e) => {
			encoderError = e;
		},
	});

	encoder.configure({
		codec: "avc1.42001f",
		width,
		height,
		bitrate: bitrateForSize(width, height, fps),
		framerate: fps,
	});

	onProgress?.({ phase: "encoding", progress: 0 });

	try {
		await renderFrameLoop(stageRef, project, onTimeUpdate, {
			start,
			end,
			fps,
			pixelRatio,
			signal,
			onProgress,
			onFrame: async ({ canvas, index }) => {
				throwIfAborted(signal);
				if (encoderError) throw encoderError;
				await waitForEncoderDrain(encoder);
				const timestampUs = Math.round((index / fps) * 1_000_000);
				const frame = new VideoFrame(canvas, {
					timestamp: timestampUs,
					duration: Math.round(1_000_000 / fps),
				});
				try {
					encoder.encode(frame, { keyFrame: index % Math.max(1, fps) === 0 });
				} finally {
					frame.close();
				}
			},
		});

		throwIfAborted(signal);
		onProgress?.({ phase: "finalizing", progress: 0.98 });
		await encoder.flush();
		if (encoderError) throw encoderError;
	} finally {
		try {
			encoder.close();
		} catch {
			/* already closed */
		}
	}

	muxer.finalize();
	onProgress?.({ phase: "done", progress: 1 });

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
	{ startTime = 0, endTime, fps = GIF_FPS, signal, onProgress } = {},
) {
	const { start, end, duration } = normalizeRange(project, startTime, endTime);
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	if (duration > 15) {
		throw new Error("GIF export is limited to 15 seconds. Shorten the range.");
	}

	onProgress?.({ phase: "preparing", progress: 0 });
	await preloadProjectImages(project);
	throwIfAborted(signal);

	const srcRatio = stage.width() / stage.height();
	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const outW = Math.min(GIF_MAX_WIDTH, evenSize(canvasW));
	const outH = evenSize(outW / srcRatio);
	const pixelRatio = outW / stage.width();

	const gif = GIFEncoder();
	const delayMs = Math.round(1000 / fps);

	onProgress?.({ phase: "encoding", progress: 0 });

	await renderFrameLoop(stageRef, project, onTimeUpdate, {
		start,
		end,
		fps,
		pixelRatio,
		signal,
		onProgress,
		onFrame: async ({ ctx }) => {
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
	onProgress?.({ phase: "done", progress: 1 });

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

/**
 * Unified export entry — MP4 or GIF.
 * @param {object} [options]
 * @param {'mp4'|'gif'} [options.format]
 * @param {AbortSignal} [options.signal]
 * @param {(p: object) => void} [options.onProgress]
 */
export async function renderProjectExport(
	stageRef,
	project,
	onTimeUpdate,
	{ format = "mp4", startTime = 0, endTime, signal, onProgress, fps } = {},
) {
	if (format === "gif") {
		return renderProjectToGif(stageRef, project, onTimeUpdate, {
			startTime,
			endTime,
			signal,
			onProgress,
			fps,
		});
	}
	return renderProjectToVideo(stageRef, project, onTimeUpdate, {
		startTime,
		endTime,
		preferMp4: format === "mp4",
		signal,
		onProgress,
		fps,
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
