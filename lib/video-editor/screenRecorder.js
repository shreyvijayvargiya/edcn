/**
 * Screen / window / tab capture with system audio, mic mix, and optional webcam PIP.
 */

import { pickRecorderMimeType } from "./audioRecorder";

export function pickVideoRecorderMimeType() {
	const candidates = [
		"video/webm;codecs=vp9,opus",
		"video/webm;codecs=vp8,opus",
		"video/webm;codecs=vp9",
		"video/webm;codecs=vp8",
		"video/webm",
		"video/mp4",
	];
	for (const type of candidates) {
		if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
			return type;
		}
	}
	return "";
}

/**
 * @param {"screen"|"window"|"tab"} prefer — hint only; browser still shows the picker
 */
export async function startDisplayCapture({
	prefer = "screen",
	systemAudio = true,
} = {}) {
	const displaySurface =
		prefer === "tab" ? "browser" : prefer === "window" ? "window" : "monitor";

	const stream = await navigator.mediaDevices.getDisplayMedia({
		video: {
			displaySurface,
			frameRate: { ideal: 30 },
			width: { ideal: 1920 },
			height: { ideal: 1080 },
			cursor: "always",
		},
		audio: systemAudio
			? {
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
				}
			: false,
		preferCurrentTab: prefer === "tab",
		selfBrowserSurface: "include",
		systemAudio: systemAudio ? "include" : "exclude",
	});

	return stream;
}

export async function startWebcamCapture({
	width = 640,
	height = 480,
	facingMode = "user",
} = {}) {
	return navigator.mediaDevices.getUserMedia({
		video: {
			width: { ideal: width },
			height: { ideal: height },
			facingMode,
		},
		audio: false,
	});
}

export async function startMicStream() {
	return navigator.mediaDevices.getUserMedia({
		audio: {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true,
		},
		video: false,
	});
}

function mixAudioTracks(audioContext, streams) {
	const dest = audioContext.createMediaStreamDestination();
	const sources = [];
	for (const stream of streams) {
		if (!stream?.getAudioTracks?.().length) continue;
		const src = audioContext.createMediaStreamSource(stream);
		src.connect(dest);
		sources.push(src);
	}
	return { dest, sources };
}

/**
 * Composite display + optional webcam PIP onto a canvas, mix audio, record.
 * Click markers can be stamped during recording via `addClickMarker`.
 */
export async function startScreenRecording({
	prefer = "screen",
	systemAudio = true,
	micAudio = true,
	webcamPip = false,
	pipSize = 0.22,
	pipPadding = 16,
	onAnalyser,
} = {}) {
	const displayStream = await startDisplayCapture({ prefer, systemAudio });
	let micStream = null;
	let webcamStream = null;
	let audioContext = null;

	try {
		if (micAudio) {
			try {
				micStream = await startMicStream();
			} catch {
				/* mic optional */
			}
		}
		if (webcamPip) {
			try {
				webcamStream = await startWebcamCapture();
			} catch {
				/* webcam optional */
			}
		}

		const displayVideo = document.createElement("video");
		displayVideo.srcObject = displayStream;
		displayVideo.muted = true;
		displayVideo.playsInline = true;
		await displayVideo.play();

		let webcamVideo = null;
		if (webcamStream) {
			webcamVideo = document.createElement("video");
			webcamVideo.srcObject = webcamStream;
			webcamVideo.muted = true;
			webcamVideo.playsInline = true;
			await webcamVideo.play();
		}

		const trackSettings = displayStream.getVideoTracks()[0]?.getSettings?.() ?? {};
		const canvasW = trackSettings.width || displayVideo.videoWidth || 1280;
		const canvasH = trackSettings.height || displayVideo.videoHeight || 720;
		const canvas = document.createElement("canvas");
		canvas.width = canvasW;
		canvas.height = canvasH;
		const ctx = canvas.getContext("2d");

		const clickMarkers = [];
		let running = true;
		let rafId = 0;

		const draw = () => {
			if (!running) return;
			ctx.fillStyle = "#0a0a0a";
			ctx.fillRect(0, 0, canvasW, canvasH);
			if (displayVideo.readyState >= 2) {
				ctx.drawImage(displayVideo, 0, 0, canvasW, canvasH);
			}

			// Click ripple overlays (relative 0–1 coords)
			const now = performance.now();
			for (const m of clickMarkers) {
				const age = (now - m.at) / 1000;
				if (age > 0.85) continue;
				const r = 12 + age * 48;
				const alpha = Math.max(0, 1 - age / 0.85);
				ctx.beginPath();
				ctx.arc(m.x * canvasW, m.y * canvasH, r, 0, Math.PI * 2);
				ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
				ctx.lineWidth = 3;
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(m.x * canvasW, m.y * canvasH, 6, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 80, 0, ${alpha})`;
				ctx.fill();
			}

			if (webcamVideo?.readyState >= 2) {
				const pipW = canvasW * pipSize;
				const pipH = (webcamVideo.videoHeight / webcamVideo.videoWidth) * pipW || pipW;
				const px = canvasW - pipW - pipPadding;
				const py = canvasH - pipH - pipPadding;
				ctx.save();
				ctx.beginPath();
				const radius = Math.min(pipW, pipH) / 2;
				ctx.arc(px + pipW / 2, py + pipH / 2, radius, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(webcamVideo, px, py, pipW, pipH);
				ctx.restore();
				ctx.beginPath();
				ctx.arc(px + pipW / 2, py + pipH / 2, radius, 0, Math.PI * 2);
				ctx.strokeStyle = "rgba(255,255,255,0.85)";
				ctx.lineWidth = 3;
				ctx.stroke();
			}

			rafId = requestAnimationFrame(draw);
		};
		draw();

		const canvasStream = canvas.captureStream(30);
		audioContext = new AudioContext();
		const audioStreams = [displayStream, micStream].filter(Boolean);
		const { dest, sources } = mixAudioTracks(audioContext, audioStreams);

		let analyser = null;
		if (dest.stream.getAudioTracks().length) {
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.82;
			const mixSource = audioContext.createMediaStreamSource(dest.stream);
			mixSource.connect(analyser);
			onAnalyser?.(analyser);
		}

		const composed = new MediaStream([
			...canvasStream.getVideoTracks(),
			...dest.stream.getAudioTracks(),
		]);

		// Fallback: if no mixed audio, try display audio only
		if (composed.getAudioTracks().length === 0) {
			for (const t of displayStream.getAudioTracks()) composed.addTrack(t);
		}

		const mimeType = pickVideoRecorderMimeType() || pickRecorderMimeType();
		const recorder = mimeType
			? new MediaRecorder(composed, { mimeType, videoBitsPerSecond: 4_000_000 })
			: new MediaRecorder(composed);
		const chunks = [];
		recorder.ondataavailable = (e) => {
			if (e.data?.size > 0) chunks.push(e.data);
		};

		const started = new Promise((resolve, reject) => {
			recorder.onstart = () => resolve();
			recorder.onerror = () => reject(new Error("Recording failed"));
		});
		const startedAt = performance.now();
		recorder.start(250);
		await started;

		displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
			/* user stopped sharing — caller should stop */
		});

		const addClickMarker = (nx, ny) => {
			clickMarkers.push({
				x: Math.max(0, Math.min(1, nx)),
				y: Math.max(0, Math.min(1, ny)),
				at: performance.now(),
				time: (performance.now() - startedAt) / 1000,
			});
		};

		const stop = () =>
			new Promise((resolve, reject) => {
				recorder.onstop = () => {
					running = false;
					cancelAnimationFrame(rafId);
					const type = recorder.mimeType || mimeType || "video/webm";
					const blob = new Blob(chunks, { type });
					const markers = clickMarkers.map(({ x, y, time }) => ({
						x,
						y,
						time,
						type: "click",
					}));
					resolve({ blob, mimeType: type, clickMarkers: markers, width: canvasW, height: canvasH });
				};
				recorder.onerror = () => reject(new Error("Recording failed"));
				if (recorder.state !== "inactive") recorder.stop();
			});

		const cleanup = () => {
			running = false;
			cancelAnimationFrame(rafId);
			displayStream.getTracks().forEach((t) => t.stop());
			micStream?.getTracks().forEach((t) => t.stop());
			webcamStream?.getTracks().forEach((t) => t.stop());
			displayVideo.srcObject = null;
			if (webcamVideo) webcamVideo.srcObject = null;
			sources.forEach((s) => s.disconnect());
			audioContext?.close?.().catch(() => {});
		};

		return {
			stop,
			cleanup,
			displayStream,
			webcamStream,
			addClickMarker,
			previewStream: canvasStream,
			startedAt,
		};
	} catch (err) {
		displayStream.getTracks().forEach((t) => t.stop());
		micStream?.getTracks().forEach((t) => t.stop());
		webcamStream?.getTracks().forEach((t) => t.stop());
		audioContext?.close?.().catch(() => {});
		throw err;
	}
}

export function buildScreenRecordingLabel(index = 1, prefer = "screen") {
	const kind = prefer === "tab" ? "Tab" : prefer === "window" ? "Window" : "Screen";
	return `${kind} recording ${index}`;
}
