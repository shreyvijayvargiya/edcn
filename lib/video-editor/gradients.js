/** Build Konva linear/radial gradient props for a Rect fill */

export const DEFAULT_CANVAS_BACKGROUND = {
	type: "solid",
	fill: "#18181b",
	gradient: {
		type: "linear",
		angle: 180,
		stops: [
			{ offset: 0, color: "#1a1a2e" },
			{ offset: 0.5, color: "#16213e" },
			{ offset: 1, color: "#0f3460" },
		],
	},
};

function angleToPoints(angleDeg, width, height) {
	const rad = ((angleDeg - 90) * Math.PI) / 180;
	const cx = width / 2;
	const cy = height / 2;
	const len = Math.sqrt(width * width + height * height) / 2;
	return {
		start: { x: cx - Math.cos(rad) * len, y: cy - Math.sin(rad) * len },
		end: { x: cx + Math.cos(rad) * len, y: cy + Math.sin(rad) * len },
	};
}

export function buildBackgroundFill(canvasBg, width, height) {
	if (!canvasBg || canvasBg.type === "solid") {
		return { fill: canvasBg?.fill ?? "#18181b" };
	}

	const { gradient } = canvasBg;
	const stops = gradient?.stops ?? DEFAULT_CANVAS_BACKGROUND.gradient.stops;
	const flatStops = stops.flatMap((s) => [s.offset, s.color]);

	if (gradient?.type === "radial") {
		return {
			fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
			fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
			fillRadialGradientStartRadius: 0,
			fillRadialGradientEndRadius: Math.max(width, height) / 2,
			fillRadialGradientColorStops: flatStops,
		};
	}

	const { start, end } = angleToPoints(gradient?.angle ?? 180, width, height);
	return {
		fillLinearGradientStartPoint: start,
		fillLinearGradientEndPoint: end,
		fillLinearGradientColorStops: flatStops,
	};
}

export function gradientCssPreview(canvasBg) {
	if (!canvasBg || canvasBg.type === "solid") {
		return canvasBg?.fill ?? "#18181b";
	}
	const stops = canvasBg.gradient?.stops ?? [];
	const parts = stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ");
	if (canvasBg.gradient?.type === "radial") {
		return `radial-gradient(circle, ${parts})`;
	}
	const angle = canvasBg.gradient?.angle ?? 180;
	return `linear-gradient(${angle}deg, ${parts})`;
}
