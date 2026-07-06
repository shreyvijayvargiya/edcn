/**
 * Position/style helpers for HTML textarea overlay on Konva text nodes.
 */

function parseColor(color) {
	if (!color || color === "transparent") return null;

	if (color.startsWith("#")) {
		let hex = color.slice(1);
		if (hex.length === 3) {
			hex = hex
				.split("")
				.map((c) => c + c)
				.join("");
		}
		if (hex.length !== 6) return null;
		return {
			r: parseInt(hex.slice(0, 2), 16),
			g: parseInt(hex.slice(2, 4), 16),
			b: parseInt(hex.slice(4, 6), 16),
			a: 1,
		};
	}

	const match = color.match(/rgba?\(([^)]+)\)/i);
	if (!match) return null;

	const parts = match[1].split(",").map((s) => parseFloat(s.trim()));
	if (parts.length < 3) return null;

	return {
		r: parts[0],
		g: parts[1],
		b: parts[2],
		a: parts[3] ?? 1,
	};
}

function relativeLuminance({ r, g, b }) {
	const channel = (c) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Pick an edit surface that contrasts with the layer text color. */
export function getInlineEditColors(fill) {
	const textColor = fill && fill !== "transparent" ? fill : "#ffffff";
	const parsed = parseColor(textColor);
	const useDarkSurface =
		!parsed || parsed.a < 0.2 || relativeLuminance(parsed) > 0.55;

	return {
		color: textColor,
		backgroundColor: useDarkSurface
			? "rgba(15, 23, 42, 0.88)"
			: "rgba(255, 255, 255, 0.94)",
		caretColor: textColor,
	};
}

function extractStrokeColor(webkitTextStroke) {
	if (!webkitTextStroke) return null;
	const match = webkitTextStroke.match(
		/#[0-9a-f]{3,8}|rgba?\([^)]+\)|\bwhite\b|\bblack\b/i,
	);
	if (!match) return null;
	const token = match[0].toLowerCase();
	if (token === "white") return "#ffffff";
	if (token === "black") return "#000000";
	return match[0];
}

/** Resolve the visible color from a preset preview style object. */
export function getEffectivePreviewColor(preview = {}) {
	if (preview.WebkitTextFillColor === "transparent") {
		if (preview.background?.includes("gradient")) {
			return "#d97706";
		}
		if (preview.WebkitTextStroke) {
			return extractStrokeColor(preview.WebkitTextStroke) ?? "#ffffff";
		}
	}

	if (preview.color && preview.color !== "transparent") {
		return preview.color;
	}

	if (preview.WebkitTextStroke) {
		return extractStrokeColor(preview.WebkitTextStroke) ?? "#ffffff";
	}

	return "#18181b";
}

function isLightPreviewColor(color) {
	const parsed = parseColor(color);
	return !parsed || parsed.a < 0.2 || relativeLuminance(parsed) > 0.55;
}

/** Tile background class for left-panel text preset cards. */
export function getTextPresetTileClassName(preview = {}, subPreview = null) {
	const needsDarkSurface = [preview, subPreview]
		.filter(Boolean)
		.some((style) => isLightPreviewColor(getEffectivePreviewColor(style)));

	return needsDarkSurface
		? "bg-slate-900 hover:bg-slate-800"
		: "bg-muted/30 hover:bg-primary/5";
}

export function getInlineTextareaStyle(layer, node, stageScale) {
	if (!node || !layer?.data) return null;

	const data = layer.data;
	const scaleX = typeof node.scaleX === "function" ? node.scaleX() : 1;
	const scaleY = typeof node.scaleY === "function" ? node.scaleY() : 1;
	const nodeW = (typeof node.width === "function" ? node.width() : layer.width) * scaleX;
	const nodeH =
		(typeof node.height === "function" ? node.height() : layer.height) * scaleY;

	const fontSize = (data.fontSize ?? 36) * stageScale;
	const lineHeight = data.lineHeight ?? 1.2;
	const editColors = getInlineEditColors(data.fill);

	return {
		position: "absolute",
		left: node.x() * stageScale,
		top: node.y() * stageScale,
		width: Math.max(40, nodeW * stageScale),
		minHeight: Math.max(fontSize * lineHeight * 1.5, nodeH * stageScale),
		fontSize,
		fontFamily: data.fontFamily ?? "DM Sans",
		fontWeight: data.fontWeight ?? 400,
		color: editColors.color,
		backgroundColor: editColors.backgroundColor,
		caretColor: editColors.caretColor,
		textAlign: data.align ?? "left",
		letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : undefined,
		lineHeight,
		transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
		transformOrigin: "top left",
		zIndex: 30,
	};
}

/** Estimate layer height from wrapped text after edit */
export function estimateTextLayerHeight(content, layer, stageScale = 1) {
	const data = layer.data ?? {};
	const fontSize = data.fontSize ?? 36;
	const lineHeight = data.lineHeight ?? 1.2;
	const width = layer.width || 280;
	const lines = String(content || "").split("\n");
	let totalLines = 0;
	const avgCharWidth = fontSize * 0.55;
	const charsPerLine = Math.max(1, Math.floor(width / avgCharWidth));

	for (const line of lines) {
		if (!line) {
			totalLines += 1;
			continue;
		}
		totalLines += Math.max(1, Math.ceil(line.length / charsPerLine));
	}

	return Math.max(24, Math.ceil(totalLines * fontSize * lineHeight) + 8);
}
