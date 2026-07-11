/** Default CSS-like style fields for UI component layers */

import { DEFAULT_LAYER_CHROME } from "./layerChromeStyle";

export const DEFAULT_UI_LAYER_STYLE = {
	background: "#ea580c",
	secondaryBackground: "#f4f4f5",
	textColor: "#ffffff",
	mutedTextColor: "#a1a1aa",
	fontFamily: "DM Sans",
	fontSize: 16,
	fontWeight: 600,
	padding: 12,
	gap: 8,
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	...DEFAULT_LAYER_CHROME,
	borderRadius: 12,
	ringRadius: 12,
	shadowBlur: 8,
	shadowColor: "rgba(0,0,0,0.2)",
	borderFill: "transparent",
};

export const FLEX_DIRECTIONS = [
	{ value: "column", label: "Column" },
	{ value: "row", label: "Row" },
];

export const FLEX_ALIGN = [
	{ value: "flex-start", label: "Start" },
	{ value: "center", label: "Center" },
	{ value: "flex-end", label: "End" },
	{ value: "space-between", label: "Space between" },
];
