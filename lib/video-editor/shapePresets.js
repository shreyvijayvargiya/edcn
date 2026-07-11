/** Shape / object presets for the left panel */

export const SHAPE_PRESETS = [
	{
		id: "rect-orange",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#ea580c", borderRadius: 4 },
		data: { shape: "rect", fill: "#ea580c", stroke: "#18181b", strokeWidth: 2, cornerRadius: 8 },
		size: { width: 200, height: 120 },
	},
	{
		id: "rect-purple",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#7c3aed", borderRadius: 4 },
		data: { shape: "rect", fill: "#7c3aed", stroke: "", strokeWidth: 0, cornerRadius: 12 },
		size: { width: 200, height: 120 },
	},
	{
		id: "rect-blue",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#3b82f6", borderRadius: 0 },
		data: { shape: "rect", fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 3, cornerRadius: 0 },
		size: { width: 220, height: 100 },
	},
	{
		id: "rect-red",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#ef4444", borderRadius: 6 },
		data: { shape: "rect", fill: "#ef4444", stroke: "#991b1b", strokeWidth: 2, cornerRadius: 6 },
		size: { width: 180, height: 110 },
	},
	{
		id: "rect-teal",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#14b8a6", borderRadius: 16 },
		data: { shape: "rect", fill: "#14b8a6", stroke: "", strokeWidth: 0, cornerRadius: 16 },
		size: { width: 200, height: 100 },
	},
	{
		id: "rect-pink",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#f472b6", borderRadius: 0 },
		data: { shape: "rect", fill: "#f472b6", stroke: "#db2777", strokeWidth: 2, cornerRadius: 0 },
		size: { width: 160, height: 160 },
	},
	{
		id: "rect-lime",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#84cc16", borderRadius: 8 },
		data: { shape: "rect", fill: "#84cc16", stroke: "#4d7c0f", strokeWidth: 2, cornerRadius: 8 },
		size: { width: 240, height: 80 },
	},
	{
		id: "rect-slate",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#64748b", borderRadius: 4 },
		data: { shape: "rect", fill: "#64748b", stroke: "#334155", strokeWidth: 1, cornerRadius: 4 },
		size: { width: 200, height: 140 },
	},
	{
		id: "rect-cyan",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#06b6d4", borderRadius: 20 },
		data: { shape: "rect", fill: "#06b6d4", stroke: "", strokeWidth: 0, cornerRadius: 20 },
		size: { width: 190, height: 90 },
	},
	{
		id: "rect-indigo",
		label: "Rectangle",
		shape: "rect",
		preview: { bg: "#6366f1", borderRadius: 2 },
		data: { shape: "rect", fill: "#6366f1", stroke: "#4338ca", strokeWidth: 3, cornerRadius: 2 },
		size: { width: 210, height: 130 },
	},
	{
		id: "rect-dark",
		label: "Frame",
		shape: "rect",
		preview: { bg: "#18181b", borderRadius: 8 },
		data: { shape: "rect", fill: "#27272a", stroke: "#52525b", strokeWidth: 2, cornerRadius: 16 },
		size: { width: 280, height: 180 },
	},
	{
		id: "rect-white",
		label: "Card",
		shape: "rect",
		preview: { bg: "#ffffff", borderRadius: 8, border: "2px solid #e4e4e7" },
		data: { shape: "rect", fill: "#ffffff", stroke: "#e4e4e7", strokeWidth: 2, cornerRadius: 12 },
		size: { width: 240, height: 140 },
	},
	{
		id: "circle-pink",
		label: "Circle",
		shape: "circle",
		preview: { bg: "#ec4899", borderRadius: "50%" },
		data: { shape: "circle", fill: "#ec4899", stroke: "#be185d", strokeWidth: 2, cornerRadius: 0 },
		size: { width: 120, height: 120 },
	},
	{
		id: "circle-yellow",
		label: "Circle",
		shape: "circle",
		preview: { bg: "#fbbf24", borderRadius: "50%" },
		data: { shape: "circle", fill: "#fbbf24", stroke: "", strokeWidth: 0, cornerRadius: 0 },
		size: { width: 100, height: 100 },
	},
	{
		id: "ellipse-green",
		label: "Ellipse",
		shape: "ellipse",
		preview: { bg: "#22c55e", borderRadius: "50%" },
		data: { shape: "ellipse", fill: "#22c55e", stroke: "#15803d", strokeWidth: 2, cornerRadius: 0 },
		size: { width: 180, height: 100 },
	},
];

/** Shared color presets for icon + object left-panel pickers */
export const PANEL_COLOR_PRESETS = [
	"#fbbf24", "#ea580c", "#ef4444", "#ec4899", "#a855f7",
	"#3b82f6", "#06b6d4", "#22c55e", "#ffffff", "#18181b",
];

/** @deprecated Use PANEL_COLOR_PRESETS */
export const ICON_COLOR_PRESETS = PANEL_COLOR_PRESETS;
