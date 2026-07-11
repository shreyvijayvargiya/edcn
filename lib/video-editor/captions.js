/**
 * Captions: word timing, platform styles, SRT/VTT, ASR helpers.
 */

import { uid } from "./utils";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

export const CAPTION_STYLE_PRESETS = [
	{
		id: "tiktok",
		label: "TikTok",
		description: "Bold center karaoke",
		fontFamily: "DM Sans",
		fontSize: 28,
		fontWeight: 800,
		fill: "#ffffff",
		highlightFill: "#39E508",
		stroke: "#000000",
		strokeWidth: 3,
		align: "center",
		background: "transparent",
		backgroundPad: 0,
		uppercase: false,
		wordsPerLine: 4,
		shadowColor: "rgba(0,0,0,0.65)",
		shadowBlur: 6,
	},
	{
		id: "reels",
		label: "Reels",
		description: "Instagram Reels style",
		fontFamily: "DM Sans",
		fontSize: 26,
		fontWeight: 700,
		fill: "#ffffff",
		highlightFill: "#FFFC00",
		stroke: "#18181b",
		strokeWidth: 2,
		align: "center",
		background: "rgba(0,0,0,0.45)",
		backgroundPad: 10,
		uppercase: false,
		wordsPerLine: 5,
		shadowColor: "rgba(0,0,0,0.4)",
		shadowBlur: 4,
	},
	{
		id: "shorts",
		label: "Shorts",
		description: "YouTube Shorts",
		fontFamily: "DM Sans",
		fontSize: 24,
		fontWeight: 700,
		fill: "#ffffff",
		highlightFill: "#FF0033",
		stroke: "",
		strokeWidth: 0,
		align: "center",
		background: "rgba(0,0,0,0.55)",
		backgroundPad: 12,
		uppercase: false,
		wordsPerLine: 6,
		shadowColor: "rgba(0,0,0,0.5)",
		shadowBlur: 8,
	},
	{
		id: "youtube",
		label: "YouTube",
		description: "Classic lower-third",
		fontFamily: "Arial",
		fontSize: 20,
		fontWeight: 600,
		fill: "#ffffff",
		highlightFill: "#ffffff",
		stroke: "",
		strokeWidth: 0,
		align: "center",
		background: "rgba(0,0,0,0.75)",
		backgroundPad: 8,
		uppercase: false,
		wordsPerLine: 10,
		shadowColor: "transparent",
		shadowBlur: 0,
	},
	{
		id: "podcast",
		label: "Podcast",
		description: "Clean audiogram captions",
		fontFamily: "Space Mono",
		fontSize: 18,
		fontWeight: 500,
		fill: "#f4f4f5",
		highlightFill: "#38bdf8",
		stroke: "",
		strokeWidth: 0,
		align: "center",
		background: "rgba(24,24,27,0.85)",
		backgroundPad: 14,
		uppercase: false,
		wordsPerLine: 8,
		shadowColor: "transparent",
		shadowBlur: 0,
	},
	{
		id: "neon",
		label: "Neon",
		description: "Glow karaoke",
		fontFamily: "DM Sans",
		fontSize: 30,
		fontWeight: 800,
		fill: "#e0e7ff",
		highlightFill: "#f472b6",
		stroke: "#312e81",
		strokeWidth: 2,
		align: "center",
		background: "transparent",
		backgroundPad: 0,
		uppercase: true,
		wordsPerLine: 3,
		shadowColor: "rgba(244,114,182,0.8)",
		shadowBlur: 14,
	},
];

export function getCaptionStyle(styleId) {
	return (
		CAPTION_STYLE_PRESETS.find((s) => s.id === styleId) ?? CAPTION_STYLE_PRESETS[0]
	);
}

export function createCaptionWord(text, start, end) {
	return {
		id: uid("cw"),
		text: String(text ?? "").trim(),
		start: Math.max(0, start),
		end: Math.max(start + 0.05, end),
	};
}

/** Estimate word timings from plain transcript + duration (relative to clip). */
export function estimateWordTimings(transcript, duration = 5) {
	const words = String(transcript || "")
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (words.length === 0) return [];
	const dur = Math.max(0.5, duration);
	const weights = words.map((w) => Math.max(1, w.replace(/[^a-zA-Z0-9]/g, "").length));
	const total = weights.reduce((a, b) => a + b, 0);
	let t = 0;
	return words.map((text, i) => {
		const span = (weights[i] / total) * dur;
		const start = t;
		const end = i === words.length - 1 ? dur : t + span;
		t = end;
		return createCaptionWord(text, start, end);
	});
}

export function wordsToPlainText(words = []) {
	return words.map((w) => w.text).filter(Boolean).join(" ");
}

export function defaultCaptionData(overrides = {}) {
	const style = getCaptionStyle(overrides.styleId ?? "tiktok");
	return {
		styleId: style.id,
		words: [],
		karaoke: true,
		fontFamily: style.fontFamily,
		fontSize: style.fontSize,
		fontWeight: style.fontWeight,
		fill: style.fill,
		highlightFill: style.highlightFill,
		stroke: style.stroke,
		strokeWidth: style.strokeWidth,
		align: style.align,
		background: style.background,
		backgroundPad: style.backgroundPad,
		uppercase: style.uppercase,
		wordsPerLine: style.wordsPerLine,
		shadowColor: style.shadowColor,
		shadowBlur: style.shadowBlur,
		...overrides,
	};
}

export function applyCaptionStylePreset(data, styleId) {
	const style = getCaptionStyle(styleId);
	return {
		...data,
		styleId: style.id,
		fontFamily: style.fontFamily,
		fontSize: style.fontSize,
		fontWeight: style.fontWeight,
		fill: style.fill,
		highlightFill: style.highlightFill,
		stroke: style.stroke,
		strokeWidth: style.strokeWidth,
		align: style.align,
		background: style.background,
		backgroundPad: style.backgroundPad,
		uppercase: style.uppercase,
		wordsPerLine: style.wordsPerLine,
		shadowColor: style.shadowColor,
		shadowBlur: style.shadowBlur,
	};
}

export function defaultCaptionPlacement(canvasW = CANVAS_WIDTH, canvasH = CANVAS_HEIGHT) {
	return {
		x: Math.round(canvasW * 0.08),
		y: Math.round(canvasH * 0.72),
		width: Math.round(canvasW * 0.84),
		height: Math.round(canvasH * 0.18),
	};
}

/** Active word + visible line window at clip-relative time. */
export function getCaptionDisplayState(data, relTime) {
	const words = data?.words ?? [];
	if (words.length === 0) {
		return { activeIndex: -1, lineWords: [], lineStart: 0 };
	}

	let activeIndex = -1;
	for (let i = 0; i < words.length; i++) {
		if (relTime >= words[i].start && relTime < words[i].end) {
			activeIndex = i;
			break;
		}
		if (relTime >= words[i].end) activeIndex = i;
	}

	const perLine = Math.max(1, data.wordsPerLine ?? 4);
	const focus = Math.max(0, activeIndex);
	const lineStart = Math.floor(focus / perLine) * perLine;
	const lineWords = words.slice(lineStart, lineStart + perLine);

	return { activeIndex, lineWords, lineStart };
}

function pad2(n) {
	return String(n).padStart(2, "0");
}

function formatSrtTime(seconds) {
	const s = Math.max(0, seconds);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = Math.floor(s % 60);
	const ms = Math.floor((s % 1) * 1000);
	return `${pad2(h)}:${pad2(m)}:${pad2(sec)},${String(ms).padStart(3, "0")}`;
}

function formatVttTime(seconds) {
	return formatSrtTime(seconds).replace(",", ".");
}

function parseTimecode(raw) {
	const cleaned = raw.trim().replace(",", ".");
	const parts = cleaned.split(":");
	if (parts.length < 3) return 0;
	const h = Number(parts[0]) || 0;
	const m = Number(parts[1]) || 0;
	const secParts = parts[2].split(".");
	const sec = Number(secParts[0]) || 0;
	const frac = secParts[1] ? Number(`0.${secParts[1]}`) : 0;
	return h * 3600 + m * 60 + sec + frac;
}

/** Group words into cue chunks for SRT/VTT export. */
function chunkWordsForCues(words, wordsPerLine = 6) {
	const cues = [];
	for (let i = 0; i < words.length; i += wordsPerLine) {
		const slice = words.slice(i, i + wordsPerLine);
		if (!slice.length) continue;
		cues.push({
			start: slice[0].start,
			end: slice[slice.length - 1].end,
			text: slice.map((w) => w.text).join(" "),
		});
	}
	return cues;
}

export function exportCaptionsToSrt(words, wordsPerLine = 6) {
	const cues = chunkWordsForCues(words, wordsPerLine);
	return cues
		.map(
			(c, i) =>
				`${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${c.text}\n`,
		)
		.join("\n");
}

export function exportCaptionsToVtt(words, wordsPerLine = 6) {
	const cues = chunkWordsForCues(words, wordsPerLine);
	const body = cues
		.map((c) => `${formatVttTime(c.start)} --> ${formatVttTime(c.end)}\n${c.text}\n`)
		.join("\n");
	return `WEBVTT\n\n${body}`;
}

export function parseSrtOrVtt(text) {
	const raw = String(text || "").replace(/^\uFEFF/, "").trim();
	if (!raw) return [];

	const isVtt = raw.startsWith("WEBVTT");
	const blocks = raw
		.replace(/^WEBVTT[^\n]*\n+/, "")
		.split(/\n\s*\n/)
		.map((b) => b.trim())
		.filter(Boolean);

	const words = [];
	for (const block of blocks) {
		const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
		const timeLine = lines.find((l) => l.includes("-->"));
		if (!timeLine) continue;
		const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim().split(" ")[0]);
		const start = parseTimecode(startRaw);
		const end = parseTimecode(endRaw);
		const textLines = lines.filter((l) => l !== timeLine && !/^\d+$/.test(l));
		const cueText = textLines.join(" ").replace(/<[^>]+>/g, "");
		const cueWords = estimateWordTimings(cueText, Math.max(0.2, end - start)).map((w) =>
			createCaptionWord(w.text, start + w.start, start + w.end),
		);
		words.push(...cueWords);
	}

	if (words.length === 0 && !isVtt) {
		return estimateWordTimings(raw.replace(/\d+\n/g, " ").replace(/-->/g, " "), 5);
	}
	return words;
}

export function downloadTextFile(filename, content, mime = "text/plain") {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Live ASR → accumulate final transcript chunks (no precise word clocks).
 * Pair with estimateWordTimings after stop.
 */
export function createCaptionRecognizer({ onPartial, onFinal, onError }) {
	if (typeof window === "undefined") return null;
	const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!Ctor) return null;

	const recognition = new Ctor();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.lang = navigator.language || "en-US";

	recognition.onresult = (event) => {
		let interim = "";
		let final = "";
		for (let i = event.resultIndex; i < event.results.length; i += 1) {
			const chunk = event.results[i][0]?.transcript ?? "";
			if (event.results[i].isFinal) final += chunk;
			else interim += chunk;
		}
		if (final) onFinal?.(final.trim());
		if (interim) onPartial?.(interim.trim());
	};
	recognition.onerror = (e) => onError?.(e.error);

	return recognition;
}
