import { getFramePresetById, DEFAULT_FRAME_PRESET_ID, EDITOR_DEFAULT_WIDTH, EDITOR_DEFAULT_HEIGHT } from "../dimensions";
import { LAYER_ANIMATION_PRESETS, SCENE_TRANSITION_TYPES, SCENE_ENTER_ANIMATION_PRESETS } from "../animations";
import { STOCK_IMAGES } from "../stockImages";
import { STOCK_VIDEOS } from "../stockVideos";
import { STOCK_AUDIO } from "../stockAudio";
import { EDITOR_ICONS } from "../icons";

const VALID_ANIM = new Set(LAYER_ANIMATION_PRESETS.map((p) => p.id));
const VALID_TRANSITION = new Set(SCENE_TRANSITION_TYPES.map((p) => p.id));
const VALID_ENTER = new Set(SCENE_ENTER_ANIMATION_PRESETS.map((p) => p.id));
const STOCK_IMAGE_IDS = new Set(STOCK_IMAGES.map((i) => i.id));
const STOCK_VIDEO_IDS = new Set(STOCK_VIDEOS.map((v) => v.id));
const STOCK_AUDIO_IDS = new Set(STOCK_AUDIO.map((a) => a.id));

const DATA_FIELDS_BY_TYPE = {
	text: [
		"content",
		"fontFamily",
		"fontSize",
		"fontWeight",
		"fill",
		"align",
		"letterSpacing",
		"lineHeight",
		"shadowColor",
		"shadowBlur",
	],
	image: ["stockImageId", "src", "objectFit", "objectPosition", "borderRadius"],
	video: ["stockVideoId", "src", "label", "muted", "volume"],
	audio: ["stockAudioId", "src", "label"],
	shape: ["shape", "fill", "stroke", "strokeWidth", "cornerRadius"],
	icon: ["icon", "fill", "fontSize"],
};

function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}

function normalizeFontWeight(w) {
	if (w === "bold" || w === "700") return 700;
	if (w === "normal" || w === "400") return 400;
	const n = Number(w);
	return Number.isFinite(n) ? n : 700;
}

function normalizeGradientStops(stops) {
	if (!Array.isArray(stops) || stops.length === 0) return null;
	return stops.map((s, i, arr) => {
		let offset = Number(s.offset);
		if (!Number.isFinite(offset)) offset = i / Math.max(1, arr.length - 1);
		if (offset > 1) offset = offset / 100;
		return { offset: clamp(offset, 0, 1), color: s.color ?? "#18181b" };
	});
}

function normalizeCanvasBackground(bg) {
	if (!bg) return null;
	if (bg.type === "gradient" && bg.gradient) {
		const stops = normalizeGradientStops(bg.gradient.stops);
		if (!stops) return { type: "solid", fill: "#1c1917" };
		return {
			type: "gradient",
			gradient: {
				type: bg.gradient.type === "radial" ? "radial" : "linear",
				angle: bg.gradient.angle ?? 180,
				stops,
			},
		};
	}
	return {
		type: "solid",
		fill: bg.fill ?? "#1c1917",
	};
}

function pickValidId(id, validSet, fallback) {
	return id && validSet.has(id) ? id : fallback;
}

function pickIcon(icon) {
	if (icon && EDITOR_ICONS.includes(icon)) return icon;
	const pool = ["☕", "✨", "🔔", "📱", "⚡", "🎉", "⭐", "📂", "📁", "🚀"];
	return pool[Math.floor(Math.random() * pool.length)];
}

function pickStockImage(tags = []) {
	const q = tags.join(" ").toLowerCase();
	const match =
		STOCK_IMAGES.find((i) => i.tags.some((t) => q.includes(t))) ??
		STOCK_IMAGES.find((i) => i.id.includes("coffee")) ??
		STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
	return match.id;
}

/** Hoist misplaced fields into data and fix common AI mistakes */
function normalizeLayerSpec(raw = {}) {
	const type = raw.type ?? raw.layerType ?? "text";
	const data = { ...(raw.data ?? {}) };

	for (const key of DATA_FIELDS_BY_TYPE[type] ?? []) {
		if (raw[key] != null && data[key] == null) data[key] = raw[key];
	}

	if (type === "text") {
		data.content = data.content ?? raw.label ?? "Title";
		data.fontWeight = normalizeFontWeight(data.fontWeight);
		data.align = data.align ?? "center";
	}
	if (type === "image") {
		data.stockImageId = pickValidId(
			data.stockImageId,
			STOCK_IMAGE_IDS,
			pickStockImage(["coffee", "cafe", "workspace"]),
		);
	}
	if (type === "video") {
		data.stockVideoId = pickValidId(data.stockVideoId, STOCK_VIDEO_IDS, STOCK_VIDEOS[0]?.id);
	}
	if (type === "audio") {
		data.stockAudioId = pickValidId(data.stockAudioId, STOCK_AUDIO_IDS, STOCK_AUDIO[0]?.id);
	}
	if (type === "icon") {
		data.icon = pickIcon(data.icon);
	}
	if (type === "shape") {
		data.shape = data.shape ?? "rect";
	}

	const anim = raw.animation ?? {};
	const preset = anim.preset && VALID_ANIM.has(anim.preset) ? anim.preset : "fade_in";

	return {
		type,
		x: Number(raw.x) || 0,
		y: Number(raw.y) || 0,
		width: Math.max(20, Number(raw.width) || 200),
		height: Math.max(20, Number(raw.height) || 80),
		rotation: Number(raw.rotation) || 0,
		opacity: raw.opacity ?? 1,
		startTime: Math.max(0, Number(raw.startTime) || 0),
		clipDuration: raw.clipDuration != null ? Number(raw.clipDuration) : undefined,
		visible: raw.visible !== false,
		animation: {
			preset,
			duration: clamp(Number(anim.duration) || 0.6, 0.1, 3),
		},
		data,
	};
}

/**
 * AI often uses center coordinates for text/icons — convert to top-left.
 */
function fixCenterOrigin(layer, designW, designH) {
	if (!["text", "icon"].includes(layer.type)) return layer;

	let { x, y, width, height } = layer;
	const cx = designW / 2;
	const cy = designH / 2;

	if (Math.abs(x - cx) <= designW * 0.12) x = x - width / 2;
	if (Math.abs(y - cy) <= designH * 0.12) y = y - height / 2;

	return { ...layer, x, y, width, height };
}

function clampLayerToCanvas(layer, dstW, dstH) {
	return {
		...layer,
		x: clamp(Math.round(layer.x), 0, dstW - 20),
		y: clamp(Math.round(layer.y), 0, dstH - 20),
		width: clamp(Math.round(layer.width), 20, dstW - layer.x),
		height: clamp(Math.round(layer.height), 20, dstH - layer.y),
	};
}

function scaleTypography(layer, scale) {
	if (scale === 1 || !layer.data) return layer;
	if (layer.type === "text" && layer.data.fontSize) {
		return {
			...layer,
			data: {
				...layer.data,
				fontSize: clamp(Math.round(layer.data.fontSize * scale), 18, 52),
			},
		};
	}
	if (layer.type === "icon" && layer.data.fontSize) {
		return {
			...layer,
			data: {
				...layer.data,
				fontSize: clamp(Math.round(layer.data.fontSize * scale), 24, 72),
			},
		};
	}
	return layer;
}

function scaleLayerGeometry(layer, scaleX, scaleY, dstW, dstH) {
	const scaled = {
		...layer,
		x: Math.round(layer.x * scaleX),
		y: Math.round(layer.y * scaleY),
		width: Math.round(layer.width * scaleX),
		height: Math.round(layer.height * scaleY),
	};

	scaled.x = clamp(scaled.x, -dstW * 0.1, dstW - 20);
	scaled.y = clamp(scaled.y, -dstH * 0.1, dstH - 20);
	scaled.width = clamp(scaled.width, 20, dstW - scaled.x);
	scaled.height = clamp(scaled.height, 20, dstH - scaled.y);
	return scaled;
}

function ensureTextContrast(layer, bgIsLight) {
	if (layer.type !== "text") return layer;
	const fill = layer.data?.fill ?? "#ffffff";
	const isLightText = /^#(fff|ffffff|f{3})/i.test(fill) || fill.toLowerCase().includes("white");
	if (bgIsLight && isLightText) {
		return {
			...layer,
			data: { ...layer.data, fill: "#1c1917", shadowColor: "rgba(0,0,0,0.15)", shadowBlur: 4 },
		};
	}
	if (!bgIsLight && !isLightText && (fill.startsWith("#1") || fill.startsWith("#0"))) {
		return {
			...layer,
			data: { ...layer.data, fill: "#ffffff", shadowBlur: 8 },
		};
	}
	return layer;
}

function sceneBackgroundIsLight(scene, projectBg) {
	const bg = scene?.background ?? projectBg;
	if (!bg) return false;
	if (bg.type === "solid") {
		const f = (bg.fill ?? "").toLowerCase();
		return f === "#fff" || f === "#ffffff" || f.includes("white");
	}
	return false;
}

function usesExportSpace(layers, dstW, dstH) {
	return layers.some(
		(l) =>
			(l.x ?? 0) > dstW * 1.05 ||
			(l.y ?? 0) > dstH * 1.05 ||
			(l.width ?? 0) > dstW * 1.05 ||
			(l.height ?? 0) > dstH * 1.05,
	);
}

function normalizeScene(raw, projectBg, designW, designH, dstW, dstH) {
	const duration = clamp(Number(raw.duration) || 5, 1, 30);

	const transition = raw.transition ?? {};
	const enter = raw.enterAnimation ?? {};

	let layers = (raw.layers ?? []).map(normalizeLayerSpec);
	if (layers.length === 0) {
		layers = [
			normalizeLayerSpec({
				type: "text",
				x: dstW * 0.1,
				y: dstH * 0.4,
				width: dstW * 0.8,
				height: 80,
				data: { content: raw.name ?? "Scene", fontSize: 36, fill: "#ffffff" },
				animation: { preset: "fade_in", duration: 0.6 },
			}),
		];
	}

	const shouldScale = usesExportSpace(layers, dstW, dstH);
	const scaleX = shouldScale ? dstW / designW : 1;
	const scaleY = shouldScale ? dstH / designH : 1;
	const spaceW = shouldScale ? designW : dstW;
	const spaceH = shouldScale ? designH : dstH;

	const bgLight = sceneBackgroundIsLight(raw, projectBg);

	layers = layers
		.map((l) => fixCenterOrigin(l, spaceW, spaceH))
		.map((l) =>
			shouldScale ? scaleLayerGeometry(l, scaleX, scaleY, dstW, dstH) : clampLayerToCanvas(l, dstW, dstH),
		)
		.map((l) => scaleTypography(l, shouldScale ? (scaleX + scaleY) / 2 : 1))
		.map((l) => ensureTextContrast(l, bgLight));

	return {
		name: raw.name ?? "Scene",
		duration,
		transition: {
			type: pickValidId(transition.type, VALID_TRANSITION, "crossfade"),
			duration: clamp(Number(transition.duration) || 0.5, 0.1, 2),
		},
		enterAnimation: {
			preset: pickValidId(enter.preset, VALID_ENTER, "fade_in"),
			duration: clamp(Number(enter.duration) || 0.6, 0.1, 2),
		},
		layers,
	};
}

/**
 * Normalize raw LLM project JSON before mapping to editor state.
 * Fixes export-resolution coords, center-origin mistakes, invalid ids, gradient stops.
 */
export function sanitizeAiProject(rawProject) {
	if (!rawProject) return null;

	const presetId = rawProject.canvas?.presetId ?? DEFAULT_FRAME_PRESET_ID;
	const preset = getFramePresetById(presetId) ?? getFramePresetById(DEFAULT_FRAME_PRESET_ID);
	const designW = preset.width;
	const designH = preset.height;
	const dstW = EDITOR_DEFAULT_WIDTH;
	const dstH = EDITOR_DEFAULT_HEIGHT;

	const canvasBg = normalizeCanvasBackground(rawProject.canvas?.background);

	const scenes = (rawProject.scenes ?? []).map((s) =>
		normalizeScene(s, canvasBg, designW, designH, dstW, dstH),
	);

	const totalDuration = scenes.reduce((n, s) => n + s.duration, 0);
	if (totalDuration < 3 && scenes.length > 0) {
		const perScene = Math.max(3, Math.ceil(15 / scenes.length));
		for (const s of scenes) s.duration = perScene;
	}

	return {
		name: rawProject.name ?? "AI Video",
		canvas: {
			presetId: preset.id,
			background: canvasBg ?? { type: "solid", fill: "#1c1917" },
		},
		theme: rawProject.theme ?? { mode: "dark" },
		scenes,
	};
}
