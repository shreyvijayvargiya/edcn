/** Layer enter-animation presets (flat list) */
export const LAYER_ANIMATION_PRESETS = [
	{ id: "none", label: "None", description: "No animation" },
	{ id: "fade_in", label: "Fade in", description: "Opacity 0 → 100%" },
	{ id: "fade_out_in", label: "Fade out & in", description: "Flash then appear" },
	{ id: "slide_up", label: "Slide up", description: "Move up into place" },
	{ id: "slide_down", label: "Slide down", description: "Move down into place" },
	{ id: "slide_left", label: "Slide left", description: "Enter from the right" },
	{ id: "slide_right", label: "Slide right", description: "Enter from the left" },
	{ id: "pop", label: "Pop", description: "Scale bounce in" },
	{ id: "bounce", label: "Bounce", description: "Elastic overshoot" },
	{ id: "zoom_in", label: "Zoom in", description: "Scale up from center" },
	{ id: "zoom_out", label: "Zoom out", description: "Scale down into place" },
	{ id: "spin", label: "Spin", description: "Rotate while appearing" },
	{ id: "typewriter", label: "Typewriter", description: "Text reveals char by char" },
];

export const LAYER_ANIMATION_GROUPS = [
	{
		label: "Basic",
		options: LAYER_ANIMATION_PRESETS.filter((p) =>
			["none", "fade_in", "fade_out_in"].includes(p.id),
		),
	},
	{
		label: "Slide",
		options: LAYER_ANIMATION_PRESETS.filter((p) => p.id.startsWith("slide_")),
	},
	{
		label: "Scale & motion",
		options: LAYER_ANIMATION_PRESETS.filter((p) =>
			["pop", "bounce", "zoom_in", "zoom_out", "spin"].includes(p.id),
		),
	},
	{
		label: "Text",
		options: LAYER_ANIMATION_PRESETS.filter((p) => p.id === "typewriter"),
	},
];

/** Scene transition presets (between scenes) */
export const SCENE_TRANSITION_TYPES = [
	{ id: "none", label: "None", description: "Hard cut" },
	{ id: "crossfade", label: "Crossfade", description: "Smooth opacity blend" },
	{ id: "dip_to_black", label: "Dip to black", description: "Fade through black" },
	{ id: "fade_white", label: "Fade to white", description: "Fade through white" },
	{ id: "slide_up", label: "Slide up", description: "Scene slides upward" },
	{ id: "slide_down", label: "Slide down", description: "Scene slides downward" },
	{ id: "slide_left", label: "Slide left", description: "Scene slides left" },
	{ id: "slide_right", label: "Slide right", description: "Scene slides right" },
	{ id: "zoom_in", label: "Zoom in", description: "Zoom into next scene" },
	{ id: "zoom_out", label: "Zoom out", description: "Zoom out to next scene" },
	{ id: "wipe_left", label: "Wipe left", description: "Horizontal wipe reveal" },
];

export const SCENE_TRANSITION_GROUPS = [
	{
		label: "Cut",
		options: SCENE_TRANSITION_TYPES.filter((p) => p.id === "none"),
	},
	{
		label: "Fade",
		options: SCENE_TRANSITION_TYPES.filter((p) =>
			["crossfade", "dip_to_black", "fade_white"].includes(p.id),
		),
	},
	{
		label: "Slide",
		options: SCENE_TRANSITION_TYPES.filter((p) => p.id.startsWith("slide_")),
	},
	{
		label: "Zoom & wipe",
		options: SCENE_TRANSITION_TYPES.filter((p) =>
			["zoom_in", "zoom_out", "wipe_left"].includes(p.id),
		),
	},
];

/** Scene enter animation (whole scene at start) */
export const SCENE_ENTER_ANIMATION_PRESETS = [
	{ id: "none", label: "None", description: "No scene intro" },
	{ id: "fade_in", label: "Fade in", description: "Whole scene fades in" },
	{ id: "slide_up", label: "Slide up", description: "Scene rises into view" },
	{ id: "slide_down", label: "Slide down", description: "Scene drops into view" },
	{ id: "zoom_in", label: "Zoom in", description: "Scene scales up" },
	{ id: "pop", label: "Pop", description: "Scene pops in" },
];

export const SCENE_ENTER_ANIMATION_GROUPS = [
	{ label: "Scene intro", options: SCENE_ENTER_ANIMATION_PRESETS },
];

export const DEFAULT_LAYER_ANIMATION = {
	preset: "none",
	duration: 0.6,
};

export const DEFAULT_SCENE_TRANSITION = {
	type: "none",
	duration: 0.5,
};

export const DEFAULT_SCENE_ENTER_ANIMATION = {
	preset: "none",
	duration: 0.6,
};

export const MIN_ANIMATION_DURATION = 0.1;
export const MAX_ANIMATION_DURATION = 3;
export const MIN_TRANSITION_DURATION = 0.1;
export const MAX_TRANSITION_DURATION = 2;

export function findPresetLabel(presets, id) {
	return presets.find((p) => p.id === id)?.label ?? id;
}

export function easeOutBack(t) {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function easeOutCubic(t) {
	return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t) {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function animProgress(localTime, startTime, duration) {
	const rel = localTime - (startTime || 0);
	if (rel < 0) return 0;
	const dur = Math.max(MIN_ANIMATION_DURATION, duration);
	return Math.min(1, rel / dur);
}

export function getLayerAnimationProgress(layer, localTime) {
	const preset = layer.animation?.preset ?? "none";
	if (preset === "none") return 1;
	return animProgress(
		localTime,
		layer.startTime || 0,
		layer.animation?.duration ?? DEFAULT_LAYER_ANIMATION.duration,
	);
}

function baseAnimState(layer, overrides = {}) {
	return {
		opacityMult: 1,
		offsetX: 0,
		offsetY: 0,
		scaleX: 1,
		scaleY: 1,
		rotationOffset: 0,
		displayText: layer.data?.content,
		clipWidth: null,
		...overrides,
	};
}

export function computeLayerAnimationState(layer, localTime) {
	const progress = getLayerAnimationProgress(layer, localTime);
	const preset = layer.animation?.preset ?? "none";

	if (preset === "none" || progress >= 1) {
		return baseAnimState(layer);
	}

	const eased = easeOutCubic(progress);
	const inv = 1 - eased;

	switch (preset) {
		case "fade_in":
			return baseAnimState(layer, { opacityMult: eased });
		case "fade_out_in": {
			const flash = progress < 0.35 ? 1 - progress / 0.35 : (progress - 0.35) / 0.65;
			return baseAnimState(layer, { opacityMult: Math.max(0, Math.min(1, flash)) });
		}
		case "slide_up":
			return baseAnimState(layer, { opacityMult: eased, offsetY: inv * 56 });
		case "slide_down":
			return baseAnimState(layer, { opacityMult: eased, offsetY: -inv * 56 });
		case "slide_left":
			return baseAnimState(layer, { opacityMult: eased, offsetX: inv * 72 });
		case "slide_right":
			return baseAnimState(layer, { opacityMult: eased, offsetX: -inv * 72 });
		case "pop": {
			const s = 0.5 + 0.5 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: Math.min(1, progress * 1.15),
				scaleX: s,
				scaleY: s,
			});
		}
		case "bounce": {
			const s = 0.4 + 0.6 * easeOutBack(progress);
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "zoom_in": {
			const s = 0.35 + 0.65 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "zoom_out": {
			const s = 1.35 - 0.35 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "spin":
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: inv * -120,
				scaleX: 0.85 + 0.15 * eased,
				scaleY: 0.85 + 0.15 * eased,
			});
		case "typewriter": {
			const content = layer.data?.content ?? "";
			const chars = Math.max(0, Math.floor(content.length * eased));
			return baseAnimState(layer, { displayText: content.slice(0, chars) });
		}
		default:
			return baseAnimState(layer);
	}
}

function sceneEnterProgress(scene, localTime) {
	const preset = scene.enterAnimation?.preset ?? "none";
	if (preset === "none") return 1;
	const dur = scene.enterAnimation?.duration ?? DEFAULT_SCENE_ENTER_ANIMATION.duration;
	if (localTime >= dur) return 1;
	return animProgress(localTime, 0, dur);
}

function applySceneEnterTransform(state, scene, localTime, canvasW, canvasH) {
	const preset = scene.enterAnimation?.preset ?? "none";
	if (preset === "none") return state;

	const progress = sceneEnterProgress(scene, localTime);
	if (progress >= 1) return state;

	const eased = easeOutCubic(progress);
	const inv = 1 - eased;
	const next = { ...state };

	switch (preset) {
		case "fade_in":
			next.contentOpacity *= eased;
			break;
		case "slide_up":
			next.contentOpacity *= eased;
			next.offsetY += inv * canvasH * 0.12;
			break;
		case "slide_down":
			next.contentOpacity *= eased;
			next.offsetY -= inv * canvasH * 0.12;
			break;
		case "zoom_in":
			next.contentOpacity *= eased;
			next.contentScale *= 0.7 + 0.3 * eased;
			break;
		case "pop":
			next.contentOpacity *= Math.min(1, progress * 1.1);
			next.contentScale *= 0.55 + 0.45 * easeOutBack(progress);
			break;
		default:
			break;
	}
	return next;
}

/**
 * Scene-level visual state for preview/render.
 */
export function computeSceneTransitionState(scene, localTime, canvasW = 360, canvasH = 640) {
	const type = scene.transition?.type ?? "none";
	const dur = Math.max(
		MIN_TRANSITION_DURATION,
		scene.transition?.duration ?? DEFAULT_SCENE_TRANSITION.duration,
	);
	const sceneDur = scene.duration || 5;

	let state = {
		contentOpacity: 1,
		contentScale: 1,
		offsetX: 0,
		offsetY: 0,
		blackOverlay: 0,
		whiteOverlay: 0,
		clipRect: null,
	};

	if (type !== "none" && dur > 0) {
		// Enter (start of scene)
		if (localTime < dur) {
			const t = easeOutCubic(localTime / dur);
			const inv = 1 - t;
			switch (type) {
				case "crossfade":
					state.contentOpacity = t;
					break;
				case "dip_to_black":
					state.blackOverlay = inv;
					break;
				case "fade_white":
					state.whiteOverlay = inv;
					break;
				case "slide_up":
					state.contentOpacity = t;
					state.offsetY = inv * canvasH * 0.15;
					break;
				case "slide_down":
					state.contentOpacity = t;
					state.offsetY = -inv * canvasH * 0.15;
					break;
				case "slide_left":
					state.contentOpacity = t;
					state.offsetX = inv * canvasW * 0.2;
					break;
				case "slide_right":
					state.contentOpacity = t;
					state.offsetX = -inv * canvasW * 0.2;
					break;
				case "zoom_in":
					state.contentOpacity = t;
					state.contentScale = 0.75 + 0.25 * t;
					break;
				case "zoom_out":
					state.contentOpacity = t;
					state.contentScale = 1.25 - 0.25 * t;
					break;
				case "wipe_left":
					state.clipRect = { x: 0, y: 0, width: canvasW * t, height: canvasH };
					break;
				default:
					break;
			}
		}

		// Exit (end of scene)
		if (localTime > sceneDur - dur) {
			const t = easeOutCubic((localTime - (sceneDur - dur)) / dur);
			const inv = 1 - t;
			switch (type) {
				case "crossfade":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					break;
				case "dip_to_black":
					state.blackOverlay = Math.max(state.blackOverlay, t);
					break;
				case "fade_white":
					state.whiteOverlay = Math.max(state.whiteOverlay, t);
					break;
				case "slide_up":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetY -= t * canvasH * 0.15;
					break;
				case "slide_down":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetY += t * canvasH * 0.15;
					break;
				case "slide_left":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetX -= t * canvasW * 0.2;
					break;
				case "slide_right":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetX += t * canvasW * 0.2;
					break;
				case "zoom_in":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.contentScale *= 1 + t * 0.2;
					break;
				case "zoom_out":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.contentScale *= 1 - t * 0.2;
					break;
				case "wipe_left":
					state.clipRect = { x: 0, y: 0, width: canvasW * inv, height: canvasH };
					break;
				default:
					break;
			}
		}
	}

	return applySceneEnterTransform(state, scene, localTime, canvasW, canvasH);
}

export function layerAnimProps(layer, anim) {
	const cx = layer.width / 2;
	const cy = layer.height / 2;
	const sx = anim.scaleX ?? 1;
	const sy = anim.scaleY ?? 1;
	return {
		x: layer.x + (anim.offsetX ?? 0) + (sx !== 1 ? cx * (1 - sx) : 0),
		y: layer.y + (anim.offsetY ?? 0) + (sy !== 1 ? cy * (1 - sy) : 0),
		scaleX: sx,
		scaleY: sy,
		rotation: (layer.rotation ?? 0) + (anim.rotationOffset ?? 0),
		opacity: (layer.opacity ?? 1) * (anim.opacityMult ?? 1),
	};
}

export function shapeAnimProps(layer, anim) {
	const isCentered = layer.data?.shape === "circle" || layer.data?.shape === "ellipse";
	if (isCentered) {
		const cx = layer.x + layer.width / 2;
		const cy = layer.y + layer.height / 2;
		const sx = anim.scaleX ?? 1;
		const sy = anim.scaleY ?? 1;
		return {
			x: cx + (anim.offsetX ?? 0),
			y: cy + (anim.offsetY ?? 0),
			scaleX: sx,
			scaleY: sy,
			rotation: (layer.rotation ?? 0) + (anim.rotationOffset ?? 0),
			opacity: (layer.opacity ?? 1) * (anim.opacityMult ?? 1),
		};
	}
	return layerAnimProps(layer, anim);
}
