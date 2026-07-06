/** Quick-apply canvas background gradients for the property panel */

export const BACKGROUND_GRADIENT_PRESETS = [
	{
		id: "midnight-ocean",
		label: "Midnight Ocean",
		gradient: {
			type: "linear",
			angle: 180,
			stops: [
				{ offset: 0, color: "#1a1a2e" },
				{ offset: 0.5, color: "#16213e" },
				{ offset: 1, color: "#0f3460" },
			],
		},
	},
	{
		id: "sunset-blaze",
		label: "Sunset Blaze",
		gradient: {
			type: "linear",
			angle: 135,
			stops: [
				{ offset: 0, color: "#ff6b6b" },
				{ offset: 0.5, color: "#feca57" },
				{ offset: 1, color: "#ff9ff3" },
			],
		},
	},
	{
		id: "aurora",
		label: "Aurora",
		gradient: {
			type: "linear",
			angle: 160,
			stops: [
				{ offset: 0, color: "#0f0c29" },
				{ offset: 0.5, color: "#302b63" },
				{ offset: 1, color: "#24243e" },
			],
		},
	},
	{
		id: "electric-violet",
		label: "Electric Violet",
		gradient: {
			type: "linear",
			angle: 135,
			stops: [
				{ offset: 0, color: "#4776e6" },
				{ offset: 1, color: "#8e54e9" },
			],
		},
	},
	{
		id: "forest-mist",
		label: "Forest Mist",
		gradient: {
			type: "linear",
			angle: 180,
			stops: [
				{ offset: 0, color: "#134e5e" },
				{ offset: 1, color: "#71b280" },
			],
		},
	},
	{
		id: "peach-dream",
		label: "Peach Dream",
		gradient: {
			type: "linear",
			angle: 120,
			stops: [
				{ offset: 0, color: "#ffecd2" },
				{ offset: 1, color: "#fcb69f" },
			],
		},
	},
	{
		id: "cosmic-purple",
		label: "Cosmic Purple",
		gradient: {
			type: "radial",
			stops: [
				{ offset: 0, color: "#667eea" },
				{ offset: 1, color: "#764ba2" },
			],
		},
	},
	{
		id: "rose-gold",
		label: "Rose Gold",
		gradient: {
			type: "linear",
			angle: 45,
			stops: [
				{ offset: 0, color: "#f093fb" },
				{ offset: 1, color: "#f5576c" },
			],
		},
	},
	{
		id: "deep-space",
		label: "Deep Space",
		gradient: {
			type: "radial",
			stops: [
				{ offset: 0, color: "#0c0c0c" },
				{ offset: 0.5, color: "#1a1a2e" },
				{ offset: 1, color: "#16213e" },
			],
		},
	},
	{
		id: "mint-fresh",
		label: "Mint Fresh",
		gradient: {
			type: "linear",
			angle: 90,
			stops: [
				{ offset: 0, color: "#11998e" },
				{ offset: 1, color: "#38ef7d" },
			],
		},
	},
	{
		id: "warm-flame",
		label: "Warm Flame",
		gradient: {
			type: "linear",
			angle: 180,
			stops: [
				{ offset: 0, color: "#ff416c" },
				{ offset: 1, color: "#ff4b2b" },
			],
		},
	},
	{
		id: "cool-sky",
		label: "Cool Sky",
		gradient: {
			type: "linear",
			angle: 180,
			stops: [
				{ offset: 0, color: "#2980b9" },
				{ offset: 1, color: "#6dd5fa" },
			],
		},
	},
	{
		id: "candy-pop",
		label: "Candy Pop",
		gradient: {
			type: "linear",
			angle: 135,
			stops: [
				{ offset: 0, color: "#fc466b" },
				{ offset: 1, color: "#3f5efb" },
			],
		},
	},
	{
		id: "dark-luxe",
		label: "Dark Luxe",
		gradient: {
			type: "linear",
			angle: 135,
			stops: [
				{ offset: 0, color: "#232526" },
				{ offset: 1, color: "#414345" },
			],
		},
	},
	{
		id: "lemon-twist",
		label: "Lemon Twist",
		gradient: {
			type: "linear",
			angle: 45,
			stops: [
				{ offset: 0, color: "#f7971e" },
				{ offset: 1, color: "#ffd200" },
			],
		},
	},
	{
		id: "lavender-haze",
		label: "Lavender Haze",
		gradient: {
			type: "linear",
			angle: 180,
			stops: [
				{ offset: 0, color: "#c471ed" },
				{ offset: 1, color: "#f64f59" },
			],
		},
	},
	{
		id: "emerald-glow",
		label: "Emerald Glow",
		gradient: {
			type: "radial",
			stops: [
				{ offset: 0, color: "#38ef7d" },
				{ offset: 0.6, color: "#11998e" },
				{ offset: 1, color: "#0f5132" },
			],
		},
	},
	{
		id: "neon-nights",
		label: "Neon Nights",
		gradient: {
			type: "linear",
			angle: 135,
			stops: [
				{ offset: 0, color: "#fc00ff" },
				{ offset: 1, color: "#00dbde" },
			],
		},
	},
	{
		id: "soft-pastel",
		label: "Soft Pastel",
		gradient: {
			type: "linear",
			angle: 180,
			stops: [
				{ offset: 0, color: "#a8edea" },
				{ offset: 1, color: "#fed6e3" },
			],
		},
	},
	{
		id: "steel-blue",
		label: "Steel Blue",
		gradient: {
			type: "linear",
			angle: 180,
			stops: [
				{ offset: 0, color: "#141e30" },
				{ offset: 1, color: "#243b55" },
			],
		},
	},
];

function stopsEqual(a, b) {
	if (!a || !b || a.length !== b.length) return false;
	return a.every(
		(s, i) => s.color === b[i].color && Math.abs(s.offset - b[i].offset) < 0.001,
	);
}

export function findBackgroundGradientPresetId(gradient) {
	if (!gradient) return null;
	return (
		BACKGROUND_GRADIENT_PRESETS.find(
			(p) =>
				p.gradient.type === gradient.type &&
				(p.gradient.angle ?? 180) === (gradient.angle ?? 180) &&
				stopsEqual(p.gradient.stops, gradient.stops),
		)?.id ?? null
	);
}

export function backgroundGradientPresetCss(preset) {
	const { gradient } = preset;
	const parts = gradient.stops
		.map((s) => `${s.color} ${s.offset * 100}%`)
		.join(", ");
	if (gradient.type === "radial") {
		return `radial-gradient(circle, ${parts})`;
	}
	return `linear-gradient(${gradient.angle ?? 180}deg, ${parts})`;
}
