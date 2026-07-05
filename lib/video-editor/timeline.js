import {
	DEFAULT_SCENE_TRANSITION,
	DEFAULT_SCENE_ENTER_ANIMATION,
} from "./animations";

/** Pixels per second on the timeline ruler */
export const PX_PER_SEC = 72;
export const MIN_SCENE_DURATION = 0.5;
export const MIN_CLIP_DURATION = 0.25;
export const TIMELINE_TRACK_HEIGHT = 36;

/** Track display order (top → bottom) */
export const TRACK_ORDER = ["video", "image", "text", "shape", "icon", "audio"];

export const TRACK_META = {
	video: { label: "Video", color: "bg-blue-500", border: "border-blue-600", text: "text-blue-950" },
	image: { label: "Image", color: "bg-amber-400", border: "border-amber-500", text: "text-amber-950" },
	text: { label: "Text", color: "bg-violet-500", border: "border-violet-600", text: "text-white" },
	shape: { label: "Shape", color: "bg-orange-500", border: "border-orange-600", text: "text-white" },
	icon: { label: "Icon", color: "bg-pink-500", border: "border-pink-600", text: "text-white" },
	audio: { label: "Audio", color: "bg-emerald-500", border: "border-emerald-600", text: "text-emerald-950" },
};

export function getTotalDuration(scenes) {
	return scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
}

export function getLayerClipDuration(layer, sceneDuration) {
	const d = layer.clipDuration ?? sceneDuration;
	return Math.max(MIN_CLIP_DURATION, Math.min(d, sceneDuration - (layer.startTime || 0)));
}

export function isLayerActiveAtTime(layer, sceneDuration, localTime) {
	if (!layer.visible) return false;
	const start = layer.startTime || 0;
	const end = start + getLayerClipDuration(layer, sceneDuration);
	return localTime >= start && localTime < end;
}

/** Map global timeline seconds → scene + local offset */
export function resolveTime(scenes, globalTime) {
	let offset = 0;
	for (let i = 0; i < scenes.length; i++) {
		const scene = scenes[i];
		const dur = scene.duration || 0;
		if (globalTime < offset + dur || i === scenes.length - 1) {
			return {
				scene,
				sceneIndex: i,
				localTime: Math.max(0, Math.min(globalTime - offset, dur - 0.001)),
				sceneStart: offset,
			};
		}
		offset += dur;
	}
	const last = scenes[scenes.length - 1];
	return {
		scene: last,
		sceneIndex: scenes.length - 1,
		localTime: 0,
		sceneStart: offset - (last?.duration || 0),
	};
}

export function formatTimecode(seconds) {
	const s = Math.max(0, seconds);
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	const ms = Math.floor((s % 1) * 10);
	return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${ms}`;
}

export function layerClipLabel(layer) {
	if (layer.type === "text") return layer.data?.content?.slice(0, 24) || "Text";
	if (layer.type === "audio" || layer.type === "video") return layer.data?.label || layer.type;
	if (layer.type === "image") return "Image";
	if (layer.type === "shape") return layer.data?.shape || "Shape";
	if (layer.type === "icon") return layer.data?.icon || "Icon";
	return layer.type;
}

export function normalizeLayer(layer, sceneDuration) {
	const startTime = layer.startTime ?? 0;
	let clipDuration = layer.clipDuration ?? sceneDuration;
	const maxDur = Math.max(MIN_CLIP_DURATION, sceneDuration - startTime);
	clipDuration = Math.min(Math.max(MIN_CLIP_DURATION, clipDuration), maxDur);
	return {
		...layer,
		startTime,
		clipDuration,
		animation: {
			preset: "none",
			duration: 0.6,
			...(layer.animation || {}),
		},
	};
}

export function normalizeProject(project) {
	return {
		...project,
		canvas: {
			width: project.canvas?.width ?? 360,
			height: project.canvas?.height ?? 640,
			presetId: project.canvas?.presetId ?? null,
			background: project.canvas?.background ?? {
				type: "solid",
				fill: "#18181b",
			},
		},
		scenes: (project.scenes || []).map((scene) => {
			const dur = Math.max(MIN_SCENE_DURATION, scene.duration || 5);
			return {
				...scene,
				duration: dur,
				transition: {
					...DEFAULT_SCENE_TRANSITION,
					...(scene.transition || {}),
				},
				enterAnimation: {
					...DEFAULT_SCENE_ENTER_ANIMATION,
					...(scene.enterAnimation || {}),
				},
				layers: (scene.layers || []).map((l) => normalizeLayer(l, dur)),
			};
		}),
	};
}
