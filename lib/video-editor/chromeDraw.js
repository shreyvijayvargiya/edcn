/** Shared Konva / layout helpers for layer chrome (border + clip). */

export const BORDER_STYLES = [
	{ value: "solid", label: "Solid" },
	{ value: "dashed", label: "Dashed" },
	{ value: "dotted", label: "Dotted" },
];

export function borderDashForStyle(style) {
	switch (style) {
		case "dashed":
			return [10, 6];
		case "dotted":
			return [2, 4];
		default:
			return [];
	}
}

/** Rounded-rect clip path for Konva Group */
export function clipRoundedRect(ctx, width, height, radius) {
	const r = Math.min(radius, width / 2, height / 2);
	ctx.beginPath();
	ctx.moveTo(r, 0);
	ctx.lineTo(width - r, 0);
	ctx.quadraticCurveTo(width, 0, width, r);
	ctx.lineTo(width, height - r);
	ctx.quadraticCurveTo(width, height, width - r, height);
	ctx.lineTo(r, height);
	ctx.quadraticCurveTo(0, height, 0, height - r);
	ctx.lineTo(0, r);
	ctx.quadraticCurveTo(0, 0, r, 0);
	ctx.closePath();
}
