import { getTotalDuration, resolveTime } from "./timeline";

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function nextFrame() {
	return new Promise((resolve) => {
		requestAnimationFrame(() => requestAnimationFrame(resolve));
	});
}

/**
 * Render project preview to WebM by stepping the Konva stage frame-by-frame.
 */
export async function renderProjectToWebm(stageRef, project, onTimeUpdate, onPlayingChange) {
	const stage = stageRef?.current;
	if (!stage) throw new Error("Canvas not ready");

	const total = getTotalDuration(project.scenes);
	if (total <= 0) throw new Error("Project has no duration");

	const pixelRatio = 2;
	const w = stage.width() * pixelRatio;
	const h = stage.height() * pixelRatio;

	const recordCanvas = document.createElement("canvas");
	recordCanvas.width = w;
	recordCanvas.height = h;
	const ctx = recordCanvas.getContext("2d");

	const stream = recordCanvas.captureStream(30);
	const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
		? "video/webm;codecs=vp9"
		: "video/webm";

	const recorder = new MediaRecorder(stream, {
		mimeType,
		videoBitsPerSecond: 4_000_000,
	});

	const chunks = [];
	recorder.ondataavailable = (e) => {
		if (e.data.size > 0) chunks.push(e.data);
	};

	const done = new Promise((resolve, reject) => {
		recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
		recorder.onerror = reject;
	});

	onPlayingChange(true);
	recorder.start(100);

	const fps = 30;
	const frameMs = 1000 / fps;
	const start = performance.now();

	for (let frame = 0; frame <= Math.ceil(total * fps); frame += 1) {
		const elapsed = frame / fps;
		const t = Math.min(elapsed, total - 0.001);
		const { scene, localTime } = resolveTime(project.scenes, t);

		onTimeUpdate(t, scene?.id, localTime);
		await nextFrame();

		stage.batchDraw();
		const frameCanvas = stage.toCanvas({ pixelRatio });
		ctx.clearRect(0, 0, w, h);
		ctx.drawImage(frameCanvas, 0, 0, w, h);

		const track = stream.getVideoTracks()[0];
		if (track?.requestFrame) track.requestFrame();

		const target = start + frame * frameMs;
		const wait = target - performance.now();
		if (wait > 0) await sleep(wait);
	}

	onTimeUpdate(0, project.scenes[0]?.id, 0);
	onPlayingChange(false);
	stage.batchDraw();
	recorder.stop();

	return done;
}

export function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
