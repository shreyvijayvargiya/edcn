/**
 * Demo annotations: click highlights + zoom-to-click on video layers.
 */

export const DEFAULT_DEMO_ANNOTATIONS = {
	enabled: false,
	cursorHighlight: true,
	zoomToClick: true,
	zoomScale: 1.35,
	zoomDuration: 0.55,
	markers: [],
};

export function createDemoMarker(time, x, y, type = "click") {
	return {
		id: `dm-${Math.random().toString(36).slice(2, 9)}`,
		time,
		x,
		y,
		type,
	};
}

/**
 * Compute overlay + optional zoom transform at clip-relative time.
 * x/y are normalized 0–1 within the video layer bounds.
 */
export function computeDemoAnnotationState(data, relTime) {
	const ann = data?.demoAnnotations;
	if (!ann?.enabled || !ann.markers?.length) {
		return { rings: [], zoom: null };
	}

	const rings = [];
	let zoom = null;
	const zoomDur = Math.max(0.2, ann.zoomDuration ?? 0.55);
	const zoomScale = ann.zoomScale ?? 1.35;

	for (const m of ann.markers) {
		const age = relTime - (m.time ?? 0);
		if (ann.cursorHighlight && age >= 0 && age <= 0.9) {
			rings.push({
				id: m.id,
				x: m.x,
				y: m.y,
				progress: age / 0.9,
			});
		}
		if (ann.zoomToClick && age >= 0 && age <= zoomDur) {
			const t = age / zoomDur;
			const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
			const scale = 1 + (zoomScale - 1) * Math.sin(ease * Math.PI);
			zoom = {
				scale,
				focusX: m.x,
				focusY: m.y,
			};
		}
	}

	return { rings, zoom };
}
