/**
 * Shared border / ring / shadow fields for media + UI layers.
 * Media and UI defaults spread this, then add type-specific fields.
 */

export const DEFAULT_LAYER_CHROME = {
	borderRadius: 8,
	borderWidth: 0,
	borderColor: "#ffffff",
	borderStyle: "solid",
	ringWidth: 0,
	ringColor: "#ffffff",
	ringRadius: 8,
	ringOffset: 4,
	shadowBlur: 12,
	shadowColor: "rgba(0,0,0,0.25)",
	shadowOffsetX: 0,
	shadowOffsetY: 4,
};

/** Resolve chrome fields from layer data with defaults. */
export function resolveLayerChrome(data = {}, defaults = DEFAULT_LAYER_CHROME) {
	return {
		borderRadius: data.borderRadius ?? defaults.borderRadius,
		borderWidth: data.borderWidth ?? defaults.borderWidth,
		borderColor: data.borderColor ?? defaults.borderColor,
		borderStyle: data.borderStyle ?? defaults.borderStyle,
		ringWidth: data.ringWidth ?? defaults.ringWidth,
		ringColor: data.ringColor ?? defaults.ringColor,
		ringRadius: data.ringRadius ?? defaults.ringRadius,
		ringOffset: data.ringOffset ?? defaults.ringOffset,
		shadowBlur: data.shadowBlur ?? defaults.shadowBlur,
		shadowColor: data.shadowColor ?? defaults.shadowColor,
		shadowOffsetX: data.shadowOffsetX ?? defaults.shadowOffsetX,
		shadowOffsetY: data.shadowOffsetY ?? defaults.shadowOffsetY,
	};
}

/** Extra padding outside the box for ring stroke (Konva). */
export function konvaRingPad(chrome) {
	const ringWidth = chrome.ringWidth ?? 0;
	if (ringWidth <= 0) return 0;
	return (chrome.ringOffset ?? 0) + ringWidth / 2;
}

/** Konva shadow props, or empty object when no shadow. */
export function konvaShadowProps(chrome) {
	if ((chrome.shadowBlur ?? 0) <= 0) return {};
	return {
		shadowBlur: chrome.shadowBlur,
		shadowColor: chrome.shadowColor,
		shadowOffsetX: chrome.shadowOffsetX ?? 0,
		shadowOffsetY: chrome.shadowOffsetY ?? 0,
		shadowOpacity: 1,
	};
}

/**
 * CSS border string for DOM previews (UiComponentPreview).
 * @returns {string|undefined}
 */
export function cssBorderFromChrome(chrome) {
	if ((chrome.borderWidth ?? 0) <= 0) return undefined;
	return `${chrome.borderWidth}px ${chrome.borderStyle ?? "solid"} ${chrome.borderColor ?? "#ccc"}`;
}

/**
 * Combined CSS box-shadow: optional ring (outline) + drop shadow.
 * Ring uses stacked shadows so DOM previews match Konva ring.
 */
export function cssBoxShadowFromChrome(chrome) {
	const parts = [];
	const ringWidth = chrome.ringWidth ?? 0;
	if (ringWidth > 0) {
		const offset = chrome.ringOffset ?? 0;
		const color = chrome.ringColor ?? "#ffffff";
		if (offset > 0) {
			parts.push(`0 0 0 ${offset}px transparent`);
		}
		parts.push(`0 0 0 ${offset + ringWidth}px ${color}`);
	}
	if ((chrome.shadowBlur ?? 0) > 0) {
		parts.push(
			`${chrome.shadowOffsetX ?? 0}px ${chrome.shadowOffsetY ?? 4}px ${chrome.shadowBlur}px ${chrome.shadowColor ?? "rgba(0,0,0,0.15)"}`,
		);
	}
	return parts.length ? parts.join(", ") : undefined;
}

/** Corner radius for CSS; large values become fully pill-shaped. */
export function cssBorderRadiusFromChrome(chrome, height) {
	const br = chrome.borderRadius ?? 0;
	if (height != null && br > 50) return 999;
	return br;
}
