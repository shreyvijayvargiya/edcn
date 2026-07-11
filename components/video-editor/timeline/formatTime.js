export function formatPlayheadTime(seconds) {
	const t = Math.max(0, seconds ?? 0);
	return `${t.toFixed(1)}s`;
}

export function formatClock(seconds) {
	const s = Math.max(0, Math.floor(seconds));
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${String(sec).padStart(2, "0")}`;
}
