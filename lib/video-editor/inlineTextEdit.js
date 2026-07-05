/**
 * Position/style helpers for HTML textarea overlay on Konva text nodes.
 */

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

	return {
		position: "absolute",
		left: node.x() * stageScale,
		top: node.y() * stageScale,
		width: Math.max(40, nodeW * stageScale),
		minHeight: Math.max(fontSize * lineHeight * 1.5, nodeH * stageScale),
		fontSize,
		fontFamily: data.fontFamily ?? "DM Sans",
		fontWeight: data.fontWeight ?? 400,
		color: data.fill ?? "#ffffff",
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
