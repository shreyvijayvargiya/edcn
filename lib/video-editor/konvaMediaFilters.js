/**
 * Konva pixel filters for media effects — client-only (imports konva).
 */

import Konva from "konva";
import { gradePresetValues } from "./mediaEffects";

function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex) {
	const h = String(hex || "#00ff00").replace("#", "");
	const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
	const n = parseInt(full.slice(0, 6), 16);
	if (Number.isNaN(n)) return { r: 0, g: 255, b: 0 };
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function applyLutPreset(data, lutId, intensity) {
	if (!lutId || intensity <= 0) return;
	const t = clamp(intensity, 0, 1);
	for (let i = 0; i < data.length; i += 4) {
		let r = data[i];
		let g = data[i + 1];
		let b = data[i + 2];
		let nr = r;
		let ng = g;
		let nb = b;

		if (lutId === "cinematic") {
			nr = r * 0.92 + 8;
			ng = g * 0.95;
			nb = b * 1.06 + 6;
		} else if (lutId === "warm") {
			nr = r * 1.08 + 10;
			ng = g * 1.02;
			nb = b * 0.9;
		} else if (lutId === "cool") {
			nr = r * 0.92;
			ng = g * 1.0;
			nb = b * 1.1 + 12;
		} else if (lutId === "vintage") {
			nr = r * 1.05 + 18;
			ng = g * 0.98 + 8;
			nb = b * 0.82;
		} else if (lutId === "teal_orange") {
			const lum = 0.299 * r + 0.587 * g + 0.114 * b;
			nr = r * 1.12 + (255 - lum) * 0.04;
			ng = g * 0.98;
			nb = b * 1.08 + lum * 0.05;
		}

		data[i] = clamp(r + (nr - r) * t, 0, 255);
		data[i + 1] = clamp(g + (ng - g) * t, 0, 255);
		data[i + 2] = clamp(b + (nb - b) * t, 0, 255);
	}
}

export function chromaKeyFilter(imageData) {
	const conf = this.getAttr("_chromaKey") || {};
	if (!conf.enabled) return;
	const key = hexToRgb(conf.keyColor);
	const similarity = clamp(conf.similarity ?? 0.32, 0.01, 1);
	const smoothness = clamp(conf.smoothness ?? 0.12, 0, 0.5);
	const spill = clamp(conf.spill ?? 0.15, 0, 1);
	const thresh = similarity * 441.67;
	const soft = smoothness * 441.67;
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const dist = Math.sqrt((r - key.r) ** 2 + (g - key.g) ** 2 + (b - key.b) ** 2);
		let alpha = 1;
		if (dist < thresh) alpha = 0;
		else if (dist < thresh + soft) alpha = (dist - thresh) / Math.max(soft, 0.001);

		if (alpha < 1 && spill > 0 && g > r && g > b) {
			const maxGB = Math.max(g, b);
			data[i + 1] = clamp(g - (g - maxGB) * spill * (1 - alpha), 0, 255);
		}
		data[i + 3] = Math.round(data[i + 3] * clamp(alpha, 0, 1));
	}
}

export function cropFeatherFilter(imageData) {
	const conf = this.getAttr("_cropFeather") || {};
	if (!conf.enabled || !(conf.amount > 0)) return;
	const w = imageData.width;
	const h = imageData.height;
	const amount = clamp(conf.amount, 0, 1);
	const fx = Math.max(1, w * amount * 0.45);
	const fy = Math.max(1, h * amount * 0.45);
	const data = imageData.data;

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const dx = Math.min(x, w - 1 - x) / fx;
			const dy = Math.min(y, h - 1 - y) / fy;
			const edge = clamp(Math.min(dx, dy), 0, 1);
			const i = (y * w + x) * 4;
			data[i + 3] = Math.round(data[i + 3] * edge);
		}
	}
}

export function lutFilter(imageData) {
	const conf = this.getAttr("_lut") || {};
	if (!conf.id) return;
	applyLutPreset(imageData.data, conf.id, conf.intensity ?? 1);
}

export function buildKonvaFilterConfig(effects) {
	const filters = [];
	const attrs = {
		blurRadius: 0,
		brightness: 0,
		contrast: 0,
		saturation: 0,
		hue: 0,
		_chromaKey: null,
		_cropFeather: null,
		_lut: null,
	};

	if (!effects?.enabled) {
		return { filters, attrs, needsCache: false };
	}

	const grade = effects.colorGrade ?? {};
	const preset = gradePresetValues(grade.preset);
	const brightness = clamp((grade.brightness ?? 0) + preset.brightness, -1, 1);
	const contrast = clamp((grade.contrast ?? 0) + preset.contrast, -100, 100);
	const saturation = clamp((grade.saturation ?? 0) + preset.saturation, -2, 2);
	const hue = clamp((grade.hue ?? 0) + preset.hue, -180, 180);

	if (Math.abs(brightness) > 0.001) {
		filters.push(Konva.Filters.Brighten);
		attrs.brightness = brightness;
	}
	if (Math.abs(contrast) > 0.01) {
		filters.push(Konva.Filters.Contrast);
		attrs.contrast = contrast;
	}
	if (Math.abs(saturation) > 0.001 || Math.abs(hue) > 0.01) {
		filters.push(Konva.Filters.HSL);
		attrs.saturation = saturation;
		attrs.hue = hue;
	}
	if (preset.lut && (grade.lutIntensity ?? 1) > 0) {
		filters.push(lutFilter);
		attrs._lut = { id: preset.lut, intensity: grade.lutIntensity ?? 1 };
	}
	if (effects.blur?.enabled && (effects.blur.radius ?? 0) > 0) {
		filters.push(Konva.Filters.Blur);
		attrs.blurRadius = clamp(effects.blur.radius, 0, 40);
	}
	if (effects.chromaKey?.enabled) {
		filters.push(chromaKeyFilter);
		attrs._chromaKey = { ...effects.chromaKey };
	}
	if (effects.cropFeather?.enabled && (effects.cropFeather.amount ?? 0) > 0) {
		filters.push(cropFeatherFilter);
		attrs._cropFeather = { ...effects.cropFeather };
	}

	return { filters, attrs, needsCache: filters.length > 0 };
}
