import { MIN_ANIMATION_DURATION } from "./animationPresets";

export function easeLinear(t) {
	return t;
}

export function easeInQuad(t) {
	return t * t;
}

export function easeOutQuad(t) {
	return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t) {
	return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function easeOutBack(t) {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function easeInBack(t) {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return c3 * t * t * t - c1 * t * t;
}

export function easeOutCubic(t) {
	return 1 - (1 - t) ** 3;
}

export function easeInCubic(t) {
	return t * t * t;
}

export function easeInOutCubic(t) {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeOutElastic(t) {
	if (t === 0 || t === 1) return t;
	return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

/** Critically-damped spring approximation (0→1). */
export function easeSpring(t, stiffness = 120, damping = 14) {
	if (t <= 0) return 0;
	if (t >= 1) return 1;
	const w = Math.sqrt(Math.max(1, stiffness));
	const zeta = Math.min(0.99, damping / (2 * Math.sqrt(Math.max(1, stiffness))));
	const wd = w * Math.sqrt(1 - zeta * zeta);
	const envelope = Math.exp(-zeta * w * t * 2.2);
	return 1 - envelope * Math.cos(wd * t * 2.2);
}

export const EASING_FUNCTIONS = {
	linear: easeLinear,
	easeInQuad,
	easeOutQuad,
	easeInOutQuad,
	easeInCubic,
	easeOutCubic,
	easeInOutCubic,
	easeInBack,
	easeOutBack,
	easeOutElastic,
	spring: (t) => easeSpring(t),
};

export const EASING_OPTIONS = [
	{ id: "linear", label: "Linear" },
	{ id: "easeInQuad", label: "Ease in" },
	{ id: "easeOutQuad", label: "Ease out" },
	{ id: "easeInOutQuad", label: "Ease in-out" },
	{ id: "easeInCubic", label: "Cubic in" },
	{ id: "easeOutCubic", label: "Cubic out" },
	{ id: "easeInOutCubic", label: "Cubic in-out" },
	{ id: "easeInBack", label: "Back in" },
	{ id: "easeOutBack", label: "Back out" },
	{ id: "easeOutElastic", label: "Elastic" },
	{ id: "spring", label: "Spring" },
];

export function applyEasing(id, t) {
	const fn = EASING_FUNCTIONS[id] ?? easeOutCubic;
	return fn(Math.max(0, Math.min(1, t)));
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

/** Exit progress 0→1 over the last `duration` seconds of the clip. */
export function exitAnimProgress(localTime, layer, duration) {
	const start = layer.startTime || 0;
	const clipDur = layer.clipDuration ?? 5;
	const exitDur = Math.max(MIN_ANIMATION_DURATION, duration);
	const exitStart = start + Math.max(0, clipDur - exitDur);
	const rel = localTime - exitStart;
	if (rel < 0) return 0;
	return Math.min(1, rel / exitDur);
}
