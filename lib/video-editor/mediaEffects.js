/**
 * Advanced media effects schema for image/video layers (no Konva import — SSR safe).
 */

export const COLOR_GRADE_PRESETS = [
	{ id: "none", label: "None" },
	{ id: "cinematic", label: "Cinematic" },
	{ id: "warm", label: "Warm" },
	{ id: "cool", label: "Cool" },
	{ id: "bw", label: "Black & white" },
	{ id: "vintage", label: "Vintage" },
	{ id: "teal_orange", label: "Teal & orange" },
];

export const MASK_TYPES = [
	{ id: "none", label: "None" },
	{ id: "rect", label: "Rectangle" },
	{ id: "ellipse", label: "Ellipse" },
];

export const PARTICLE_PRESETS = [
	{ id: "dust", label: "Dust motes" },
	{ id: "sparks", label: "Sparks" },
	{ id: "bokeh", label: "Bokeh" },
	{ id: "snow", label: "Snow" },
];

export const DEFAULT_MEDIA_EFFECTS = {
	enabled: true,
	colorGrade: {
		preset: "none",
		brightness: 0,
		contrast: 0,
		saturation: 0,
		hue: 0,
		lutIntensity: 1,
	},
	blur: { enabled: false, radius: 0 },
	glow: { enabled: false, radius: 16, intensity: 0.55, color: "#ffffff" },
	vignette: { enabled: false, amount: 0.45, softness: 0.55, color: "#000000" },
	mask: { type: "none", feather: 0, invert: false },
	cropFeather: { enabled: false, amount: 0 },
	chromaKey: {
		enabled: false,
		keyColor: "#00ff00",
		similarity: 0.32,
		smoothness: 0.12,
		spill: 0.15,
	},
	particles: { enabled: false, preset: "dust", count: 36, seed: 1 },
};

export function resolveMediaEffects(data = {}) {
	const raw = data.effects ?? {};
	return {
		...DEFAULT_MEDIA_EFFECTS,
		...raw,
		colorGrade: { ...DEFAULT_MEDIA_EFFECTS.colorGrade, ...(raw.colorGrade ?? {}) },
		blur: { ...DEFAULT_MEDIA_EFFECTS.blur, ...(raw.blur ?? {}) },
		glow: { ...DEFAULT_MEDIA_EFFECTS.glow, ...(raw.glow ?? {}) },
		vignette: { ...DEFAULT_MEDIA_EFFECTS.vignette, ...(raw.vignette ?? {}) },
		mask: { ...DEFAULT_MEDIA_EFFECTS.mask, ...(raw.mask ?? {}) },
		cropFeather: { ...DEFAULT_MEDIA_EFFECTS.cropFeather, ...(raw.cropFeather ?? {}) },
		chromaKey: { ...DEFAULT_MEDIA_EFFECTS.chromaKey, ...(raw.chromaKey ?? {}) },
		particles: { ...DEFAULT_MEDIA_EFFECTS.particles, ...(raw.particles ?? {}) },
	};
}

function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}

/** Simple seeded PRNG (mulberry32) */
export function seededRandom(seed) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

export function gradePresetValues(preset) {
	switch (preset) {
		case "cinematic":
			return { brightness: -0.04, contrast: 12, saturation: -0.12, hue: 0, lut: "cinematic" };
		case "warm":
			return { brightness: 0.05, contrast: 6, saturation: 0.08, hue: 8, lut: "warm" };
		case "cool":
			return { brightness: 0.02, contrast: 8, saturation: -0.05, hue: -12, lut: "cool" };
		case "bw":
			return { brightness: 0.02, contrast: 18, saturation: -1, hue: 0, lut: null };
		case "vintage":
			return { brightness: 0.06, contrast: -8, saturation: -0.25, hue: 12, lut: "vintage" };
		case "teal_orange":
			return { brightness: 0, contrast: 14, saturation: 0.05, hue: -6, lut: "teal_orange" };
		default:
			return { brightness: 0, contrast: 0, saturation: 0, hue: 0, lut: null };
	}
}

export function mediaEffectsNeedPixelFilters(effects) {
	if (!effects?.enabled) return false;
	const grade = effects.colorGrade ?? {};
	const preset = gradePresetValues(grade.preset);
	const brightness = (grade.brightness ?? 0) || preset.brightness;
	const contrast = (grade.contrast ?? 0) || preset.contrast;
	const saturation = (grade.saturation ?? 0) || preset.saturation;
	const hue = (grade.hue ?? 0) || preset.hue;
	const hasGrade =
		grade.preset !== "none" ||
		Math.abs(brightness) > 0.001 ||
		Math.abs(contrast) > 0.01 ||
		Math.abs(saturation) > 0.001 ||
		Math.abs(hue) > 0.01;
	const hasBlur = effects.blur?.enabled && (effects.blur.radius ?? 0) > 0;
	const hasChroma = effects.chromaKey?.enabled;
	const hasFeather = effects.cropFeather?.enabled && (effects.cropFeather.amount ?? 0) > 0;
	const hasLut = Boolean(preset.lut) && (grade.lutIntensity ?? 1) > 0;
	return hasGrade || hasBlur || hasChroma || hasFeather || hasLut;
}

export function mediaEffectsNeedOverlay(effects) {
	if (!effects?.enabled) return false;
	return (
		(effects.vignette?.enabled && (effects.vignette.amount ?? 0) > 0) ||
		(effects.glow?.enabled && (effects.glow.intensity ?? 0) > 0) ||
		(effects.particles?.enabled && (effects.particles.count ?? 0) > 0)
	);
}

export function mediaEffectsActive(effects) {
	return (
		mediaEffectsNeedPixelFilters(effects) ||
		mediaEffectsNeedOverlay(effects) ||
		(effects?.enabled && effects?.mask?.type && effects.mask.type !== "none")
	);
}

export function buildMaskClipFunc(effects, width, height, borderRadius = 0) {
	const mask = effects?.mask;
	if (!effects?.enabled || !mask || mask.type === "none") {
		return (ctx) => clipRoundedRectLocal(ctx, width, height, borderRadius);
	}

	return (ctx) => {
		const pad = clamp(mask.feather ?? 0, 0, 0.45) * Math.min(width, height) * 0.25;
		if (mask.type === "ellipse") {
			ctx.beginPath();
			ctx.ellipse(
				width / 2,
				height / 2,
				Math.max(1, width / 2 - pad),
				Math.max(1, height / 2 - pad),
				0,
				0,
				Math.PI * 2,
			);
			ctx.closePath();
			return;
		}
		clipRoundedRectLocal(ctx, width, height, borderRadius, pad);
	};
}

function clipRoundedRectLocal(ctx, width, height, radius, inset = 0) {
	const x = inset;
	const y = inset;
	const w = Math.max(1, width - inset * 2);
	const h = Math.max(1, height - inset * 2);
	const r = Math.min(radius, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

/** Deterministic particle positions for overlay rendering */
export function buildParticleSprites(effects, width, height, timeSec = 0) {
	if (!effects?.enabled || !effects.particles?.enabled) return [];
	const count = clamp(Math.round(effects.particles.count ?? 36), 0, 120);
	const preset = effects.particles.preset ?? "dust";
	const rand = seededRandom((effects.particles.seed ?? 1) * 9973);
	const sprites = [];

	for (let i = 0; i < count; i++) {
		const baseX = rand() * width;
		const baseY = rand() * height;
		const size =
			preset === "bokeh" ? 4 + rand() * 10 : preset === "sparks" ? 1.2 + rand() * 2.2 : 1.5 + rand() * 3;
		const speed = 8 + rand() * 28;
		const phase = rand() * Math.PI * 2;
		let x = baseX;
		let y = baseY;
		let opacity = 0.25 + rand() * 0.55;
		let color = "#ffffff";

		if (preset === "dust") {
			x = (baseX + Math.sin(timeSec * 0.4 + phase) * 12) % width;
			y = (baseY + timeSec * speed * 0.15) % height;
			color = "rgba(255,255,255,0.9)";
		} else if (preset === "sparks") {
			x = (baseX + Math.cos(timeSec * 2 + phase) * 20) % width;
			y = (baseY - ((timeSec * speed) % height) + height) % height;
			color = rand() > 0.5 ? "#fbbf24" : "#fb923c";
			opacity = 0.5 + rand() * 0.5;
		} else if (preset === "bokeh") {
			x = (baseX + Math.sin(timeSec * 0.25 + phase) * 30) % width;
			y = (baseY + Math.cos(timeSec * 0.2 + phase) * 18) % height;
			color = rand() > 0.5 ? "#fdba74" : "#93c5fd";
			opacity = 0.15 + rand() * 0.35;
		} else if (preset === "snow") {
			x = (baseX + Math.sin(timeSec * 0.8 + phase) * 24 + timeSec * 6) % width;
			y = (baseY + timeSec * speed * 0.35) % height;
			color = "#f8fafc";
		}

		sprites.push({
			id: i,
			x: ((x % width) + width) % width,
			y: ((y % height) + height) % height,
			radius: size,
			opacity,
			color,
		});
	}
	return sprites;
}

export function vignetteFill(effects, width, height) {
	if (!effects?.enabled || !effects.vignette?.enabled) return null;
	const amount = clamp(effects.vignette.amount ?? 0, 0, 1);
	if (amount <= 0) return null;
	const soft = clamp(effects.vignette.softness ?? 0.5, 0.05, 1);
	const color = effects.vignette.color || "#000000";
	const inner = Math.max(0.05, 1 - amount) * soft;
	return {
		fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
		fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
		fillRadialGradientStartRadius: Math.min(width, height) * inner * 0.35,
		fillRadialGradientEndRadius: Math.hypot(width, height) * 0.55,
		fillRadialGradientColorStops: [0, "rgba(0,0,0,0)", 1, color],
		opacity: amount,
	};
}
