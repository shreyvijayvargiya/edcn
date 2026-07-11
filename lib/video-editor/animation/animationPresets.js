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
		case "ui":
			return buildGroups([...new Set([...COMMON_IDS, ...ICON_IDS])], {
				basic: "Basic",
				slide: "Slide",
				motion: "Scale & motion",
				specific: "UI effects",
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
