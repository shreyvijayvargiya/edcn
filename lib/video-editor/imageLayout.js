/** object-fit / object-position helpers for Konva image layers */

export {
	BORDER_STYLES,
	borderDashForStyle,
	clipRoundedRect,
} from "./chromeDraw";

export const IMAGE_OBJECT_FITS = [
	{ value: "cover", label: "Cover" },
	{ value: "contain", label: "Contain" },
	{ value: "fill", label: "Fill" },
	{ value: "none", label: "Original" },
];

export const IMAGE_OBJECT_POSITIONS = [
	{ value: "center", label: "Center" },
	{ value: "top", label: "Top" },
	{ value: "bottom", label: "Bottom" },
	{ value: "left", label: "Left" },
	{ value: "right", label: "Right" },
	{ value: "top-left", label: "Top left" },
	{ value: "top-right", label: "Top right" },
	{ value: "bottom-left", label: "Bottom left" },
	{ value: "bottom-right", label: "Bottom right" },
];

function parsePosition(position = "center") {
	const parts = position.split("-");
	if (parts.length === 1) {
		const p = parts[0];
		if (p === "top" || p === "bottom") return [p, "center"];
		if (p === "left" || p === "right") return ["center", p];
		return ["center", "center"];
	}
	return [parts[0], parts[1]];
}

function alignOffset(boxSize, contentSize, align) {
	if (align === "start" || align === "left" || align === "top") return 0;
	if (align === "end" || align === "right" || align === "bottom") {
		return boxSize - contentSize;
	}
	return (boxSize - contentSize) / 2;
}

/**
 * Compute draw rect for image inside layer box.
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function computeImageDrawRect(image, boxW, boxH, fit = "cover", position = "center") {
	if (!image?.naturalWidth || !image?.naturalHeight) {
		return { x: 0, y: 0, width: boxW, height: boxH };
	}

	const iw = image.naturalWidth;
	const ih = image.naturalHeight;
	const [vert, horiz] = parsePosition(position);

	const vertAlign =
		vert === "top" ? "top" : vert === "bottom" ? "bottom" : "center";
	const horizAlign =
		horiz === "left" ? "left" : horiz === "right" ? "right" : "center";

	if (fit === "fill") {
		return { x: 0, y: 0, width: boxW, height: boxH };
	}

	if (fit === "none") {
		return {
			x: alignOffset(boxW, iw, horizAlign),
			y: alignOffset(boxH, ih, vertAlign),
			width: iw,
			height: ih,
		};
	}

	const scale =
		fit === "contain"
			? Math.min(boxW / iw, boxH / ih)
			: Math.max(boxW / iw, boxH / ih);

	const w = iw * scale;
	const h = ih * scale;

	return {
		x: alignOffset(boxW, w, horizAlign),
		y: alignOffset(boxH, h, vertAlign),
		width: w,
		height: h,
	};
}
