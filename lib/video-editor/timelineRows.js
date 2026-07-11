/** Helpers for timeline track rows and drag-drop from the left panel. */

export const TIMELINE_DRAG_MIME = "application/x-edcn-layer";

export function setTimelineDragData(dataTransfer, payload) {
	dataTransfer.setData(TIMELINE_DRAG_MIME, JSON.stringify(payload));
	dataTransfer.effectAllowed = "copy";
}

export function readTimelineDragData(dataTransfer) {
	const raw = dataTransfer.getData(TIMELINE_DRAG_MIME);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function nextTimelineRow(layers) {
	if (!layers?.length) return 0;
	return Math.max(0, ...layers.map((l) => l.timelineRow ?? 0)) + 1;
}

/** Remap timelineRow values to 0..n-1 while preserving relative order. */
export function compactTimelineRows(layers) {
	if (!layers?.length) return;
	const unique = [...new Set(layers.map((l) => l.timelineRow ?? 0))].sort((a, b) => a - b);
	const map = new Map(unique.map((row, i) => [row, i]));
	for (const layer of layers) {
		layer.timelineRow = map.get(layer.timelineRow ?? 0) ?? 0;
	}
}

export function groupLayersByRow(layers) {
	const map = new Map();
	for (const layer of layers || []) {
		const row = layer.timelineRow ?? 0;
		if (!map.has(row)) map.set(row, []);
		map.get(row).push(layer);
	}
	return [...map.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([rowIndex, clips]) => ({
			rowIndex,
			rowId: `row-${rowIndex}`,
			clips: clips.sort((a, b) => (a.startTime || 0) - (b.startTime || 0)),
		}));
}

/** Snap clip start to neighbor ends/starts on the same row. */
export function snapClipStartTime(startTime, clipDuration, rowClips, excludeId, thresholdSec = 0.2) {
	let best = Math.max(0, startTime);

	for (const other of rowClips) {
		if (other.id === excludeId) continue;
		const oStart = other.startTime || 0;
		const oEnd = oStart + (other.clipDuration ?? 5);

		if (Math.abs(best - oEnd) <= thresholdSec) {
			best = oEnd;
		}
		const myEnd = best + clipDuration;
		if (Math.abs(myEnd - oStart) <= thresholdSec) {
			best = Math.max(0, oStart - clipDuration);
		}
	}

	return Math.max(0, best);
}

/** Place a new clip right after the last clip on a row, or at time 0. */
export function appendClipStartTime(rowClips, defaultDuration = 5) {
	if (!rowClips?.length) return 0;
	let end = 0;
	for (const clip of rowClips) {
		const clipEnd = (clip.startTime || 0) + (clip.clipDuration ?? defaultDuration);
		end = Math.max(end, clipEnd);
	}
	return end;
}

export function findDropTarget(
	rows,
	pxPerSec,
	scrollLeft,
	clientX,
	clientY,
	containerRect,
	rowHeight = 36,
	excludeLayerId = null,
) {
	const x = clientX - containerRect.left + scrollLeft;
	const y = clientY - containerRect.top;
	const time = Math.max(0, x / pxPerSec);

	const rowIndex = Math.max(0, Math.floor(y / rowHeight));
	const existing = rows.find((r) => r.rowIndex === rowIndex);
	const clips = (existing?.clips ?? []).filter((c) => c.id !== excludeLayerId);

	if (!clips.length) {
		return { rowIndex, startTime: time, afterClipId: null };
	}

	const sorted = [...clips].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
	const first = sorted[0];
	const firstStart = first.startTime || 0;

	if (time <= firstStart + 0.1) {
		return { rowIndex, startTime: 0, afterClipId: null };
	}

	for (let i = 0; i < sorted.length; i++) {
		const clip = sorted[i];
		const clipStart = clip.startTime || 0;
		const clipEnd = clipStart + (clip.clipDuration ?? 5);
		const next = sorted[i + 1];
		const nextStart = next ? next.startTime || 0 : Infinity;

		if (time >= clipStart && time < clipEnd) {
			const mid = (clipStart + clipEnd) / 2;
			if (time >= mid) {
				return { rowIndex, startTime: clipEnd, afterClipId: clip.id };
			}
			if (i === 0) return { rowIndex, startTime: 0, afterClipId: null };
			const prev = sorted[i - 1];
			const prevEnd = (prev.startTime || 0) + (prev.clipDuration ?? 5);
			return { rowIndex, startTime: prevEnd, afterClipId: prev.id };
		}

		if (time >= clipEnd - 0.15 && time < nextStart - 0.05) {
			return { rowIndex, startTime: clipEnd, afterClipId: clip.id };
		}
	}

	const last = sorted[sorted.length - 1];
	const lastEnd = (last.startTime || 0) + (last.clipDuration ?? 5);
	return { rowIndex, startTime: lastEnd, afterClipId: last.id };
}

/** Resolve drop row + snapped start time for a clip being moved or added. */
export function resolveClipDrop(
	rows,
	pxPerSec,
	scrollLeft,
	clientX,
	clientY,
	containerRect,
	clipDuration,
	excludeLayerId = null,
	rowHeight = 36,
) {
	const raw = findDropTarget(
		rows,
		pxPerSec,
		scrollLeft,
		clientX,
		clientY,
		containerRect,
		rowHeight,
		excludeLayerId,
	);
	const row = rows.find((r) => r.rowIndex === raw.rowIndex);
	const clips = (row?.clips ?? []).filter((c) => c.id !== excludeLayerId);
	const startTime = snapClipStartTime(raw.startTime, clipDuration, clips, excludeLayerId);
	return { ...raw, startTime };
}
