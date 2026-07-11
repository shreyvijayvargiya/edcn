import { MIN_ANIMATION_DURATION } from "./animationPresets";

export function easeOutBack(t) {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function easeOutCubic(t) {
	return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t) {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeOutElastic(t) {
	if (t === 0 || t === 1) return t;
	return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";

export function scrambleChar(i) {
	return SCRAMBLE_CHARS[Math.abs(Math.floor(Math.sin(i * 127.1) * 43758.5453)) % SCRAMBLE_CHARS.length];
}

export function wordRevealText(content, progress) {
	const parts = content.split(/(\s+)/);
	const wordIndices = parts
		.map((p, i) => (p.trim() ? i : -1))
		.filter((i) => i >= 0);
	const showCount = Math.ceil(wordIndices.length * progress);
	const cutoff = wordIndices[showCount - 1] ?? -1;
	return parts.map((p, i) => (i <= cutoff ? p : "")).join("");
}

export function lineRevealText(content, progress) {
	const lines = content.split("\n");
	const n = Math.max(1, Math.ceil(lines.length * progress));
	return lines.slice(0, n).join("\n");
}

export function scrambleText(content, progress) {
	return content
		.split("")
		.map((char, i) => {
			if (char === "\n" || char === " ") return char;
			const threshold = (i + 1) / Math.max(content.length, 1);
			return progress >= threshold ? char : scrambleChar(i);
		})
		.join("");
}

export function animProgress(localTime, startTime, duration) {
	const rel = localTime - (startTime || 0);
	if (rel < 0) return 0;
	const dur = Math.max(MIN_ANIMATION_DURATION, duration);
	return Math.min(1, rel / dur);
}
