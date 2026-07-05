import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SCENE_DURATION } from "./constants";
import { DEFAULT_CANVAS_BACKGROUND } from "./gradients";
import { DEFAULT_FRAME_PRESET_ID, EDITOR_DEFAULT_WIDTH, EDITOR_DEFAULT_HEIGHT } from "./dimensions";
import { DEFAULT_LAYER_ANIMATION, DEFAULT_SCENE_TRANSITION, DEFAULT_SCENE_ENTER_ANIMATION } from "./animations";
import { uid } from "./utils";

/** Shared timeline fields for every layer */
function timelineFields(sceneDuration = DEFAULT_SCENE_DURATION) {
	return {
		startTime: 0,
		clipDuration: sceneDuration,
	};
}

export function createTextLayer(overrides = {}) {
	return {
		id: uid("layer"),
		type: "text",
		...timelineFields(),
		x: 40,
		y: CANVAS_HEIGHT / 2 - 40,
		width: CANVAS_WIDTH - 80,
		height: 80,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		animation: { ...DEFAULT_LAYER_ANIMATION },
		data: {
			content: "Your text here",
			fontFamily: "DM Sans",
			fontSize: 36,
			fontWeight: 700,
			fill: "#ffffff",
			align: "center",
			letterSpacing: 0,
			lineHeight: 1.2,
			shadowColor: "rgba(0,0,0,0.4)",
			shadowBlur: 8,
			shadowOffsetX: 0,
			shadowOffsetY: 2,
			stroke: "",
			strokeWidth: 0,
		},
		...overrides,
	};
}

export function createImageLayer(src = "", overrides = {}) {
	return {
		id: uid("layer"),
		type: "image",
		...timelineFields(),
		x: 40,
		y: 120,
		width: CANVAS_WIDTH - 80,
		height: 200,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		animation: { ...DEFAULT_LAYER_ANIMATION },
		data: {
			src,
			borderRadius: 8,
			shadowBlur: 12,
			shadowColor: "rgba(0,0,0,0.25)",
			filter: "none",
		},
		...overrides,
	};
}

export function createVideoLayer(overrides = {}) {
	return {
		id: uid("layer"),
		type: "video",
		...timelineFields(),
		x: 0,
		y: 0,
		width: CANVAS_WIDTH,
		height: CANVAS_HEIGHT,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		animation: { ...DEFAULT_LAYER_ANIMATION },
		data: { src: "", label: "Video clip", muted: false, volume: 1 },
		...overrides,
	};
}

export function createAudioLayer(overrides = {}) {
	return {
		id: uid("layer"),
		type: "audio",
		...timelineFields(),
		x: 20,
		y: CANVAS_HEIGHT - 60,
		width: CANVAS_WIDTH - 40,
		height: 40,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		animation: { ...DEFAULT_LAYER_ANIMATION },
		data: { src: "", label: "Audio track" },
		...overrides,
	};
}

export function createShapeLayer(shape = "rect", overrides = {}) {
	const base = {
		id: uid("layer"),
		type: "shape",
		...timelineFields(),
		x: 80,
		y: 200,
		width: 200,
		height: 120,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		animation: { ...DEFAULT_LAYER_ANIMATION },
		data: {
			shape,
			fill: "#ea580c",
			stroke: "#18181b",
			strokeWidth: 2,
			cornerRadius: 0,
		},
	};
	if (shape === "circle" || shape === "ellipse") {
		base.width = 140;
		base.height = 140;
	}
	return { ...base, ...overrides };
}

export function createIconLayer(overrides = {}) {
	return {
		id: uid("layer"),
		type: "icon",
		...timelineFields(),
		x: CANVAS_WIDTH / 2 - 30,
		y: 80,
		width: 60,
		height: 60,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		animation: { ...DEFAULT_LAYER_ANIMATION },
		data: { icon: "★", fill: "#fbbf24", fontSize: 48 },
		...overrides,
	};
}

export function createScene(overrides = {}) {
	const duration = overrides.duration ?? DEFAULT_SCENE_DURATION;
	return {
		id: uid("scene"),
		name: "Scene 1",
		duration,
		transition: { ...DEFAULT_SCENE_TRANSITION },
		enterAnimation: { ...DEFAULT_SCENE_ENTER_ANIMATION },
		layers: [createTextLayer({ clipDuration: duration })],
		...overrides,
	};
}

export function createDefaultProject() {
	return {
		id: uid("project"),
		name: "Untitled video",
		version: 1,
		canvas: {
			width: EDITOR_DEFAULT_WIDTH,
			height: EDITOR_DEFAULT_HEIGHT,
			presetId: DEFAULT_FRAME_PRESET_ID,
			background: { ...DEFAULT_CANVAS_BACKGROUND },
		},
		scenes: [
			createScene({
				name: "Scene 1",
				layers: [
					createShapeLayer("rect", {
						x: 0,
						y: 0,
						width: CANVAS_WIDTH,
						height: CANVAS_HEIGHT,
						data: {
							shape: "rect",
							fill: "#18181b",
							stroke: "",
							strokeWidth: 0,
							cornerRadius: 0,
						},
					}),
					createTextLayer({
						y: CANVAS_HEIGHT / 2 - 50,
						data: {
							content: "Your title here",
							fontFamily: "DM Sans",
							fontSize: 32,
							fontWeight: 700,
							fill: "#ffffff",
							align: "center",
							letterSpacing: 0,
							lineHeight: 1.2,
							shadowColor: "rgba(0,0,0,0.5)",
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowOffsetY: 2,
							stroke: "",
							strokeWidth: 0,
						},
					}),
				],
			}),
		],
		createdAt: new Date().toISOString(),
	};
}

export const LAYER_FACTORIES = {
	text: () => createTextLayer(),
	image: () => createImageLayer(),
	video: () => createVideoLayer(),
	audio: () => createAudioLayer(),
	shape: () => createShapeLayer("rect"),
	icon: () => createIconLayer(),
};
