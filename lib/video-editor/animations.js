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
	// Text
	{ id: "typewriter", label: "Typewriter", description: "Characters appear one by one" },
	{ id: "word_reveal", label: "Word reveal", description: "Words appear sequentially" },
	{ id: "line_reveal", label: "Line reveal", description: "Each line fades in" },
	{ id: "scramble", label: "Scramble", description: "Random chars resolve to text" },
	{ id: "tracking_in", label: "Tracking in", description: "Letter-spacing tightens in" },
	{ id: "blur_in", label: "Blur in", description: "Soft zoom into focus" },
	{ id: "flip_in", label: "Flip in", description: "Vertical flip reveal" },
	{ id: "glitch", label: "Glitch", description: "Digital jitter then lock" },
	{ id: "neon_flicker", label: "Neon flicker", description: "Flickering neon sign" },
	// Image / video
	{ id: "ken_burns", label: "Ken Burns", description: "Slow zoom & pan in" },
	{ id: "reveal_wipe", label: "Reveal wipe", description: "Horizontal wipe reveal" },
	{ id: "blur_focus", label: "Blur to focus", description: "Deblur with fade" },
	{ id: "flash", label: "Flash", description: "Camera flash effect" },
	{ id: "cinematic", label: "Cinematic", description: "Film-style zoom intro" },
	// Shape
	{ id: "draw_in", label: "Draw in", description: "Grow from zero scale" },
	{ id: "rotate_in", label: "Rotate in", description: "Spin into place" },
	{ id: "elastic_in", label: "Elastic", description: "Spring overshoot scale" },
	{ id: "pulse_in", label: "Pulse in", description: "Pulsing scale entrance" },
	{ id: "morph_in", label: "Morph in", description: "Squash & stretch in" },
	// Icon
	{ id: "stamp", label: "Stamp", description: "Stamp down with bounce" },
	{ id: "wiggle", label: "Wiggle", description: "Wiggle then settle" },
	{ id: "drop_in", label: "Drop in", description: "Drop from above" },
	{ id: "spin_pop", label: "Spin pop", description: "Spin with pop finish" },
	{ id: "float_in", label: "Float in", description: "Float up gently" },
];

const COMMON_IDS = [
	"none",
	"fade_in",
	"fade_out_in",
	"slide_up",
	"slide_down",
	"slide_left",
	"slide_right",
	"pop",
	"bounce",
	"zoom_in",
	"zoom_out",
	"spin",
];

const TEXT_IDS = [
	"typewriter",
	"word_reveal",
	"line_reveal",
	"scramble",
	"tracking_in",
	"blur_in",
	"flip_in",
	"glitch",
	"neon_flicker",
];

const IMAGE_IDS = ["ken_burns", "reveal_wipe", "blur_focus", "flash", "flip_in", "blur_in"];

const VIDEO_IDS = ["cinematic", "ken_burns", "reveal_wipe", "blur_focus", "flash", "fade_in"];

const SHAPE_IDS = ["draw_in", "rotate_in", "elastic_in", "pulse_in", "morph_in", "pop", "bounce"];

const ICON_IDS = ["stamp", "wiggle", "drop_in", "spin_pop", "float_in", "pop", "bounce"];

function presetsByIds(ids) {
	return ids.map((id) => LAYER_ANIMATION_PRESETS.find((p) => p.id === id)).filter(Boolean);
}

function buildGroups(ids, groupLabels) {
	const presets = presetsByIds(ids);
	const groups = [];
	if (groupLabels.basic) {
		groups.push({
			label: groupLabels.basic,
			options: presets.filter((p) =>
				["none", "fade_in", "fade_out_in"].includes(p.id),
			),
		});
	}
	if (groupLabels.slide) {
		groups.push({
			label: groupLabels.slide,
			options: presets.filter((p) => p.id.startsWith("slide_")),
		});
	}
	if (groupLabels.motion) {
		groups.push({
			label: groupLabels.motion,
			options: presets.filter((p) =>
				["pop", "bounce", "zoom_in", "zoom_out", "spin"].includes(p.id),
			),
		});
	}
	const used = new Set(groups.flatMap((g) => g.options.map((o) => o.id)));
	const specific = presets.filter((p) => !used.has(p.id));
	if (specific.length > 0 && groupLabels.specific) {
		groups.push({ label: groupLabels.specific, options: specific });
	}
	return groups.filter((g) => g.options.length > 0);
}

/** @deprecated use getLayerAnimationGroups */
export const LAYER_ANIMATION_GROUPS = buildGroups(
	[...COMMON_IDS, ...TEXT_IDS],
	{ basic: "Basic", slide: "Slide", motion: "Scale & motion", specific: "Text" },
);

/** Animation dropdown groups tailored to layer type */
export function getLayerAnimationGroups(layerType) {
	switch (layerType) {
		case "text":
			return buildGroups([...COMMON_IDS, ...TEXT_IDS], {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
				specific: "Text effects",
			});
		case "image":
			return buildGroups([...new Set([...COMMON_IDS, ...IMAGE_IDS])], {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
				specific: "Photo & image",
			});
		case "video":
			return buildGroups([...new Set([...COMMON_IDS, ...VIDEO_IDS])], {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
				specific: "Video & cinematic",
			});
		case "shape":
			return buildGroups([...new Set([...COMMON_IDS, ...SHAPE_IDS])], {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
				specific: "Shape effects",
			});
		case "icon":
			return buildGroups([...new Set([...COMMON_IDS, ...ICON_IDS])], {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
				specific: "Icon effects",
			});
		case "audio":
			return buildGroups(COMMON_IDS, {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
			});
		default:
			return buildGroups(COMMON_IDS, {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
			});
	}
}

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

export function easeOutElastic(t) {
	if (t === 0 || t === 1) return t;
	return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";

function scrambleChar(i) {
	return SCRAMBLE_CHARS[Math.abs(Math.floor(Math.sin(i * 127.1) * 43758.5453)) % SCRAMBLE_CHARS.length];
}

function wordRevealText(content, progress) {
	const parts = content.split(/(\s+)/);
	const wordIndices = parts
		.map((p, i) => (p.trim() ? i : -1))
		.filter((i) => i >= 0);
	const showCount = Math.ceil(wordIndices.length * progress);
	const cutoff = wordIndices[showCount - 1] ?? -1;
	return parts.map((p, i) => (i <= cutoff ? p : "")).join("");
}

function lineRevealText(content, progress) {
	const lines = content.split("\n");
	const n = Math.max(1, Math.ceil(lines.length * progress));
	return lines.slice(0, n).join("\n");
}

function scrambleText(content, progress) {
	return content
		.split("")
		.map((char, i) => {
			if (char === "\n" || char === " ") return char;
			const threshold = (i + 1) / Math.max(content.length, 1);
			return progress >= threshold ? char : scrambleChar(i);
		})
		.join("");
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
		letterSpacingExtra: 0,
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
		case "word_reveal": {
			const content = layer.data?.content ?? "";
			return baseAnimState(layer, {
				displayText: wordRevealText(content, eased),
				opacityMult: eased,
			});
		}
		case "line_reveal": {
			const content = layer.data?.content ?? "";
			return baseAnimState(layer, {
				displayText: lineRevealText(content, eased),
				opacityMult: eased,
				offsetY: inv * 20,
			});
		}
		case "scramble": {
			const content = layer.data?.content ?? "";
			return baseAnimState(layer, {
				displayText: scrambleText(content, eased),
				opacityMult: 0.5 + eased * 0.5,
			});
		}
		case "tracking_in":
			return baseAnimState(layer, {
				opacityMult: eased,
				letterSpacingExtra: inv * 24,
			});
		case "blur_in": {
			const s = 1.18 - 0.18 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "flip_in": {
			const sy = Math.max(0.02, eased);
			return baseAnimState(layer, { opacityMult: eased, scaleY: sy });
		}
		case "glitch":
			return baseAnimState(layer, {
				opacityMult: progress < 0.55 ? 0.55 + Math.sin(progress * 90) * 0.25 : eased,
				offsetX: progress < 0.7 ? Math.sin(progress * 120) * 10 * inv : 0,
				offsetY: progress < 0.7 ? Math.cos(progress * 95) * 6 * inv : 0,
			});
		case "neon_flicker": {
			const flicker =
				progress < 0.55
					? 0.35 + Math.abs(Math.sin(progress * 48)) * 0.65
					: 0.85 + eased * 0.15;
			return baseAnimState(layer, { opacityMult: flicker });
		}
		case "ken_burns":
			return baseAnimState(layer, {
				opacityMult: eased,
				scaleX: 1 + 0.14 * inv,
				scaleY: 1 + 0.14 * inv,
				offsetX: inv * -16,
				offsetY: inv * -12,
			});
		case "cinematic":
			return baseAnimState(layer, {
				opacityMult: eased,
				scaleX: 1 + 0.2 * inv,
				scaleY: 1 + 0.2 * inv,
				offsetX: inv * -20,
				offsetY: inv * -8,
			});
		case "reveal_wipe": {
			const sx = Math.max(0.02, eased);
			return baseAnimState(layer, {
				opacityMult: eased,
				scaleX: sx,
				scaleY: 1,
				offsetX: -(layer.width / 2) * (1 - sx),
			});
		}
		case "blur_focus": {
			const s = 1.12 - 0.12 * eased;
			return baseAnimState(layer, {
				opacityMult: 0.35 + eased * 0.65,
				scaleX: s,
				scaleY: s,
			});
		}
		case "flash": {
			const flash = progress < 0.25 ? 1 : 0.4 + eased * 0.6;
			return baseAnimState(layer, { opacityMult: flash });
		}
		case "draw_in": {
			const s = eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "rotate_in":
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: inv * -180,
				scaleX: 0.5 + 0.5 * eased,
				scaleY: 0.5 + 0.5 * eased,
			});
		case "elastic_in": {
			const s = easeOutElastic(progress);
			return baseAnimState(layer, { opacityMult: Math.min(1, progress * 1.2), scaleX: s, scaleY: s });
		}
		case "pulse_in": {
			const pulse = 0.6 + 0.4 * Math.sin(progress * Math.PI);
			return baseAnimState(layer, { opacityMult: eased, scaleX: pulse, scaleY: pulse });
		}
		case "morph_in": {
			const sx = 0.2 + 0.8 * eased;
			const sy = 1.4 - 0.4 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: sx, scaleY: sy });
		}
		case "stamp": {
			const s = 0.4 + 0.6 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: Math.min(1, progress * 1.3),
				scaleX: s * 1.15,
				scaleY: s * 0.9,
			});
		}
		case "wiggle":
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: progress < 0.75 ? Math.sin(progress * 28) * 18 * inv : 0,
				scaleX: 0.85 + 0.15 * eased,
				scaleY: 0.85 + 0.15 * eased,
			});
		case "drop_in": {
			const s = 0.5 + 0.5 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: eased,
				offsetY: inv * -90,
				scaleX: s,
				scaleY: s,
			});
		}
		case "spin_pop": {
			const s = 0.35 + 0.65 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: inv * -360,
				scaleX: s,
				scaleY: s,
			});
		}
		case "float_in":
			return baseAnimState(layer, {
				opacityMult: eased,
				offsetY: inv * 40,
				scaleX: 0.92 + 0.08 * eased,
				scaleY: 0.92 + 0.08 * eased,
			});
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

export function layerAnimProps(layer, anim, effective = null) {
	const lx = effective?.x ?? layer.x;
	const ly = effective?.y ?? layer.y;
	const rot = effective?.rotation ?? layer.rotation ?? 0;
	const op = effective?.opacity ?? layer.opacity ?? 1;
	const scaleKf = effective?.scale ?? 1;
	const cx = layer.width / 2;
	const cy = layer.height / 2;
	const sx = (anim.scaleX ?? 1) * scaleKf;
	const sy = (anim.scaleY ?? 1) * scaleKf;
	return {
		x: lx + (anim.offsetX ?? 0) + (sx !== 1 ? cx * (1 - sx) : 0),
		y: ly + (anim.offsetY ?? 0) + (sy !== 1 ? cy * (1 - sy) : 0),
		scaleX: sx,
		scaleY: sy,
		rotation: rot + (anim.rotationOffset ?? 0),
		opacity: op * (anim.opacityMult ?? 1),
	};
}

export function shapeAnimProps(layer, anim, effective = null) {
	const isCentered = layer.data?.shape === "circle" || layer.data?.shape === "ellipse";
	const rot = effective?.rotation ?? layer.rotation ?? 0;
	const op = effective?.opacity ?? layer.opacity ?? 1;
	const scaleKf = effective?.scale ?? 1;
	const sx = (anim.scaleX ?? 1) * scaleKf;
	const sy = (anim.scaleY ?? 1) * scaleKf;
	if (isCentered) {
		const cx = (effective?.x ?? layer.x) + layer.width / 2;
		const cy = (effective?.y ?? layer.y) + layer.height / 2;
		return {
			x: cx + (anim.offsetX ?? 0),
			y: cy + (anim.offsetY ?? 0),
			scaleX: sx,
			scaleY: sy,
			rotation: rot + (anim.rotationOffset ?? 0),
			opacity: op * (anim.opacityMult ?? 1),
		};
	}
	return layerAnimProps(layer, anim, effective);
}
