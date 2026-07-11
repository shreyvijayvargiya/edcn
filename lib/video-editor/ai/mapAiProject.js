import {
	createDefaultProject,
	createTextLayer,
	createImageLayer,
	createVideoLayer,
	createAudioLayer,
	createShapeLayer,
	createIconLayer,
	createCaptionLayer,
	createScene,
} from "../defaults";
import { normalizeProject } from "../timeline";
import { STOCK_IMAGES, stockImageSrcUrl } from "../stockImages";
import { STOCK_VIDEOS } from "../stockVideos";
import { STOCK_AUDIO } from "../stockAudio";
import { DEFAULT_FRAME_PRESET_ID, EDITOR_DEFAULT_WIDTH, EDITOR_DEFAULT_HEIGHT } from "../dimensions";
import { DEFAULT_CANVAS_BACKGROUND } from "../gradients";
import { DEFAULT_LAYER_ANIMATION, DEFAULT_SCENE_TRANSITION, DEFAULT_SCENE_ENTER_ANIMATION } from "../animations";
import { DEFAULT_MEDIA_LAYER_STYLE } from "../mediaLayerStyle";
import {
	applyCaptionStylePreset,
	defaultCaptionData,
	estimateWordTimings,
} from "../captions";
import { sanitizeAiProject } from "./sanitizeAiProject";
import { mergeAiWithExisting, applyPreservedIds } from "./mergeAiProject";
import { uid } from "../utils";

function stockImageSrc(id) {
	const item = STOCK_IMAGES.find((i) => i.id === id);
	return item ? stockImageSrcUrl(item) : "";
}

function stockVideoSrc(id) {
	return STOCK_VIDEOS.find((v) => v.id === id)?.src ?? "";
}

function stockAudioSrc(id) {
	return STOCK_AUDIO.find((a) => a.id === id)?.src ?? "";
}

function mergeAnimation(raw) {
	if (!raw) return { ...DEFAULT_LAYER_ANIMATION };
	return {
		preset: raw.preset ?? DEFAULT_LAYER_ANIMATION.preset,
		duration: Number(raw.duration) || DEFAULT_LAYER_ANIMATION.duration,
		exitPreset: raw.exitPreset ?? DEFAULT_LAYER_ANIMATION.exitPreset,
		exitDuration: Number(raw.exitDuration) || DEFAULT_LAYER_ANIMATION.exitDuration,
		loop: raw.loop ?? DEFAULT_LAYER_ANIMATION.loop,
		loopCount: Number(raw.loopCount) || 0,
	};
}

function buildLayer(layerSpec, sceneDuration) {
	const type = layerSpec.type;
	const base = {
		startTime: layerSpec.startTime ?? 0,
		clipDuration: layerSpec.clipDuration ?? sceneDuration,
		x: layerSpec.x ?? 0,
		y: layerSpec.y ?? 0,
		width: layerSpec.width ?? 200,
		height: layerSpec.height ?? 80,
		rotation: layerSpec.rotation ?? 0,
		opacity: layerSpec.opacity ?? 1,
		visible: layerSpec.visible !== false,
		locked: false,
		animation: mergeAnimation(layerSpec.animation),
	};

	const data = { ...(layerSpec.data ?? {}) };

	switch (type) {
		case "text": {
			const defaults = createTextLayer();
			return createTextLayer({
				...base,
				data: { ...defaults.data, ...data },
			});
		}
		case "image": {
			const src = data.src || stockImageSrc(data.stockImageId) || stockImageSrc("coffee-desk");
			const defaults = createImageLayer(src);
			return createImageLayer(src, {
				...base,
				data: {
					...defaults.data,
					...DEFAULT_MEDIA_LAYER_STYLE,
					...data,
					src,
				},
			});
		}
		case "video": {
			const src = data.src || stockVideoSrc(data.stockVideoId) || "/sample-video-1.mp4";
			const defaults = createVideoLayer();
			return createVideoLayer({
				...base,
				data: {
					...defaults.data,
					...DEFAULT_MEDIA_LAYER_STYLE,
					...data,
					src,
					muted: data.muted ?? true,
				},
			});
		}
		case "audio": {
			const src = data.src || stockAudioSrc(data.stockAudioId) || "";
			return createAudioLayer({
				...base,
				data: { src, label: data.label ?? "Audio" },
			});
		}
		case "shape":
			return createShapeLayer(data.shape ?? "rect", {
				...base,
				data: {
					shape: data.shape ?? "rect",
					fill: data.fill ?? "#ea580c",
					stroke: data.stroke ?? "",
					strokeWidth: data.strokeWidth ?? 0,
					cornerRadius: data.cornerRadius ?? 0,
				},
			});
		case "icon": {
			const defaults = createIconLayer();
			return createIconLayer({
				...base,
				data: { ...defaults.data, ...data },
			});
		}
		case "caption": {
			const styleId = data.styleId ?? "tiktok";
			const text = data.content || data.text || wordsToFallback(data.words);
			const words =
				Array.isArray(data.words) && data.words.length
					? data.words
					: estimateWordTimings(text || "Captions", base.clipDuration ?? 5);
			return createCaptionLayer({
				...base,
				data: {
					...applyCaptionStylePreset(defaultCaptionData(), styleId),
					...data,
					words,
					karaoke: data.karaoke !== false,
				},
			});
		}
		default:
			return createTextLayer({ ...base, data: { content: "Layer" } });
	}
}

function wordsToFallback(words) {
	if (!Array.isArray(words)) return "";
	return words.map((w) => w.text || w).filter(Boolean).join(" ");
}

function buildCanvas(canvasSpec = {}) {
	const presetId = canvasSpec.presetId ?? DEFAULT_FRAME_PRESET_ID;
	const background = canvasSpec.background ?? DEFAULT_CANVAS_BACKGROUND;
	return {
		width: EDITOR_DEFAULT_WIDTH,
		height: EDITOR_DEFAULT_HEIGHT,
		presetId,
		background:
			background.type === "gradient" && background.gradient
				? { type: "gradient", gradient: background.gradient }
				: {
						type: "solid",
						fill: background.fill ?? DEFAULT_CANVAS_BACKGROUND.fill,
					},
	};
}

/**
 * Map AI JSON project spec → editor project (normalized).
 */
export function mapAiProjectToEditor(aiProject, { themeMode, mergeWith } = {}) {
	let sanitized = sanitizeAiProject(aiProject);
	if (!sanitized?.scenes?.length) {
		return { project: createDefaultProject(), themeMode: themeMode ?? null };
	}

	if (mergeWith) {
		sanitized = mergeAiWithExisting(sanitized, mergeWith);
	}

	const scenes = sanitized.scenes.map((sceneSpec, i) => {
		const duration = Math.max(0.5, Number(sceneSpec.duration) || 5);
		const layers = (sceneSpec.layers ?? []).map((l) => buildLayer(l, duration));
		const scene = createScene({
			name: sceneSpec.name ?? `Scene ${i + 1}`,
			duration,
			transition: { ...DEFAULT_SCENE_TRANSITION, ...(sceneSpec.transition ?? {}) },
			enterAnimation: { ...DEFAULT_SCENE_ENTER_ANIMATION, ...(sceneSpec.enterAnimation ?? {}) },
			layers: layers.length > 0 ? layers : [createTextLayer({ clipDuration: duration })],
		});
		return applyPreservedIds(scene, sceneSpec);
	});

	const project = normalizeProject({
		id: mergeWith?.id ?? uid("project"),
		name: sanitized.name ?? mergeWith?.name ?? "AI Video",
		version: mergeWith?.version ?? 1,
		canvas: buildCanvas(sanitized.canvas),
		scenes,
		createdAt: mergeWith?.createdAt ?? new Date().toISOString(),
	});

	const resolvedTheme =
		sanitized.theme?.mode === "dark" || sanitized.theme?.mode === "light"
			? sanitized.theme.mode
			: themeMode ?? null;

	return { project, themeMode: resolvedTheme, themeNotes: sanitized.theme?.notes ?? null };
}

export function extractJsonFromModelText(text) {
	if (!text) return null;
	const trimmed = text.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		/* try code block */
	}
	const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fence) {
		try {
			return JSON.parse(fence[1].trim());
		} catch {
			return null;
		}
	}
	const start = trimmed.indexOf("{");
	const end = trimmed.lastIndexOf("}");
	if (start >= 0 && end > start) {
		try {
			return JSON.parse(trimmed.slice(start, end + 1));
		} catch {
			return null;
		}
	}
	return null;
}
