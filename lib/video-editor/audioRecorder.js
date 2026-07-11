/** Browser microphone recording + speech recognition helpers (frontend only). */

export function getSpeechRecognitionCtor() {
	if (typeof window === "undefined") return null;
	return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function pickRecorderMimeType() {
	const candidates = [
		"audio/webm;codecs=opus",
		"audio/webm",
		"audio/mp4",
		"audio/ogg;codecs=opus",
	];
	for (const type of candidates) {
		if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
			return type;
		}
	}
	return "";
}

export function createSpeechRecognizer({ onResult, onError }) {
	const Ctor = getSpeechRecognitionCtor();
	if (!Ctor) return null;

	const recognition = new Ctor();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";

	recognition.onresult = (event) => {
		let interim = "";
		let final = "";
		for (let i = event.resultIndex; i < event.results.length; i += 1) {
			const chunk = event.results[i][0]?.transcript ?? "";
			if (event.results[i].isFinal) final += chunk;
			else interim += chunk;
		}
		onResult?.({ final, interim });
	};

	recognition.onerror = (event) => {
		onError?.(event.error ?? "speech-recognition-error");
	};

	return recognition;
}

/**
 * Start mic capture with analyser for waveform visualization.
 * Returns cleanup + stop that resolves to { blob, mimeType }.
 */
export async function startMicCapture() {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const audioContext = new AudioContext();
	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = 256;
	analyser.smoothingTimeConstant = 0.82;
	source.connect(analyser);

	const mimeType = pickRecorderMimeType();
	const recorder = mimeType
		? new MediaRecorder(stream, { mimeType })
		: new MediaRecorder(stream);
	const chunks = [];

	recorder.ondataavailable = (e) => {
		if (e.data?.size > 0) chunks.push(e.data);
	};

	const started = new Promise((resolve, reject) => {
		recorder.onstart = () => resolve();
		recorder.onerror = () => reject(new Error("Recording failed"));
	});

	recorder.start(250);
	await started;

	const stop = () =>
		new Promise((resolve, reject) => {
			recorder.onstop = () => {
				const type = recorder.mimeType || mimeType || "audio/webm";
				const blob = new Blob(chunks, { type });
				resolve({ blob, mimeType: type });
			};
			recorder.onerror = () => reject(new Error("Recording failed"));
			if (recorder.state !== "inactive") recorder.stop();
		});

	const cleanup = () => {
		stream.getTracks().forEach((t) => t.stop());
		source.disconnect();
		analyser.disconnect();
		audioContext.close().catch(() => {});
	};

	return { analyser, stop, cleanup, stream };
}

export function buildRecordingLabel(transcript, index = 1) {
	const trimmed = transcript?.trim();
	if (trimmed) {
		const words = trimmed.split(/\s+/).slice(0, 5).join(" ");
		return words.length > 42 ? `${words.slice(0, 42)}…` : words;
	}
	return `Recording ${index}`;
}
