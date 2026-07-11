import {
	MIN_TIMELINE_PX_PER_SEC,
	MAX_TIMELINE_PX_PER_SEC,
	DEFAULT_TIMELINE_PX_PER_SEC,
} from "./timeline";

const ZOOM_STEP = 1.12;

export function clampTimelinePxPerSec(value) {
	return Math.max(
		MIN_TIMELINE_PX_PER_SEC,
		Math.min(MAX_TIMELINE_PX_PER_SEC, Number(value) || DEFAULT_TIMELINE_PX_PER_SEC),
	);
}

export function stepTimelineZoom(current, direction) {
	if (!direction) return clampTimelinePxPerSec(current);
	const factor = direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
	return clampTimelinePxPerSec(current * factor);
}

/** Pixels/sec so `durationSec` fits inside `containerWidth`. */
export function fitTimelinePxPerSec(durationSec, containerWidth, gutter = 20) {
	if (!durationSec || durationSec <= 0) return DEFAULT_TIMELINE_PX_PER_SEC;
	const available = Math.max(120, containerWidth - gutter);
	return clampTimelinePxPerSec(available / durationSec);
}

export function timelineZoomPercent(pxPerSec) {
	return Math.round((pxPerSec / DEFAULT_TIMELINE_PX_PER_SEC) * 100);
}

/** Keep pointer position stable while changing px/sec on a scroll container. */
export function scrollLeftForZoomAnchor({
	scrollLeft,
	pointerXInViewport,
	anchorTimeSec,
	oldPxPerSec,
	newPxPerSec,
}) {
	const pointerOffset = pointerXInViewport;
	const timeAtPointer =
		anchorTimeSec ?? (scrollLeft + pointerOffset) / Math.max(oldPxPerSec, 1);
	return Math.max(0, timeAtPointer * newPxPerSec - pointerOffset);
}
