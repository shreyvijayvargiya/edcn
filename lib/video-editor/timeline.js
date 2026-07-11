import {
	DEFAULT_SCENE_TRANSITION,
	DEFAULT_SCENE_ENTER_ANIMATION,
} from "./animations";

/** Pixels per second on the timeline ruler */
export const PX_PER_SEC = 72;
export const MIN_TIMELINE_PX_PER_SEC = 6;
export const MAX_TIMELINE_PX_PER_SEC = 200;
export const DEFAULT_TIMELINE_PX_PER_SEC = PX_PER_SEC;
export const MIN_SCENE_DURATION = 0.5;
export const MIN_CLIP_DURATION = 0.25;
export const TIMELINE_TRACK_HEIGHT = 36;

/** Track display order (top → bottom) */
export const TRACK_ORDER = ["video", "image", "text", "shape", "icon", "audio"];

export const TRACK_META = {
	video: { label: "Video", color: "bg-blue-500", border: "border-blue-600", text: "text-blue-950" },
	image: { label: "Image", color: "bg-amber-400", border: "border-amber-500", text: "text-amber-950" },
	text: { label: "Text", color: "bg-violet-500", border: "border-violet-600", text: "text-white" },
	caption: { label: "Caption", color: "bg-cyan-500", border: "border-cyan-600", text: "text-cyan-950" },
	shape: { label: "Shape", color: "bg-orange-500", border: "border-orange-600", text: "text-white" },
	icon: { label: "Icon", color: "bg-pink-500", border: "border-pink-600", text: "text-white" },
	audio: { label: "Audio", color: "bg-emerald-500", border: "border-emerald-600", text: "text-emerald-950" },
	ui: { label: "UI", color: "bg-indigo-500", border: "border-indigo-600", text: "text-white" },
};

export function getTotalDuration(scenes) {
	if (!scenes?.length) return MIN_SCENE_DURATION;
	if (scenes.length === 1) return getTimelineDuration(scenes[0]);
	return scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
}

/** End of the last clip, or scene duration — whichever is longer. */
export function getTimelineDuration(scene) {
	if (!scene) return MIN_SCENE_DURATION;
	let end = scene.duration || MIN_SCENE_DURATION;
	for (const layer of scene.layers || []) {
		const layerEnd = (layer.startTime || 0) + getLayerClipDuration(layer, end);
		end = Math.max(end, layerEnd);
	}
	return Math.max(MIN_SCENE_DURATION, end);
}

export function getPrimaryScene(project) {
	return project?.scenes?.[0] ?? null;
}

export function extendSceneDuration(scene) {
	if (!scene) return;
	const needed = getTimelineDuration(scene);
	scene.duration = Math.max(scene.duration || MIN_SCENE_DURATION, needed);
}

export function getLayerClipDuration(layer, sceneDuration) {
	const d = layer.clipDuration ?? sceneDuration ?? MIN_SCENE_DURATION;
	return Math.max(MIN_CLIP_DURATION, d);
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
	if (layer.type === "caption") {
		const words = layer.data?.words ?? [];
		if (words.length) return words.map((w) => w.text).join(" ").slice(0, 24);
		return "Captions";
	}
	if (layer.type === "audio" || layer.type === "video") return layer.data?.label || layer.type;
	if (layer.type === "image") return "Image";
	if (layer.type === "shape") return layer.data?.shape || "Shape";
	if (layer.type === "icon") return layer.data?.icon || "Icon";
	if (layer.type === "ui") return layer.data?.label?.slice(0, 20) || "UI";
	return layer.type;
}

export function normalizeLayer(layer, sceneDuration) {
	const startTime = layer.startTime ?? 0;
	let clipDuration = layer.clipDuration ?? sceneDuration;
	clipDuration = Math.max(MIN_CLIP_DURATION, clipDuration);
	return {
		...layer,
		startTime,
		clipDuration,
		timelineRow: layer.timelineRow ?? 0,
		animation: {
			preset: "none",
			duration: 0.6,
			exitPreset: "none",
			exitDuration: 0.5,
			loop: "none",
			loopCount: 0,
			...(layer.animation || {}),
		},
	};
}

export function normalizeProject(project) {
	const merged = mergeScenesToPrimary(project);
	return {
		...merged,
		canvas: {
			width: merged.canvas?.width ?? 360,
			height: merged.canvas?.height ?? 640,
			presetId: merged.canvas?.presetId ?? null,
			background: merged.canvas?.background ?? {
				type: "solid",
				fill: "#18181b",
			},
		},
		scenes: (merged.scenes || []).map((scene) => {
			const dur = Math.max(MIN_SCENE_DURATION, getTimelineDuration(scene));
			return {
				...scene,
				duration: dur,
				timelinePxPerSec: Math.max(
					MIN_TIMELINE_PX_PER_SEC,
					Math.min(
						MAX_TIMELINE_PX_PER_SEC,
						scene.timelinePxPerSec ?? DEFAULT_TIMELINE_PX_PER_SEC,
					),
				),
				background: scene.background ?? null,
				transition: {
					...DEFAULT_SCENE_TRANSITION,
					...(scene.transition || {}),
				},
				enterAnimation: {
					...DEFAULT_SCENE_ENTER_ANIMATION,
					...(scene.enterAnimation || {}),
				},
				layers: (scene.layers || []).map((l, i) =>
					normalizeLayer({ ...l, timelineRow: l.timelineRow ?? i }, dur),
				),
			};
		}),
	};
}

/** Flatten multi-scene projects into a single timeline on scene 0. */
function mergeScenesToPrimary(project) {
	const scenes = project?.scenes ?? [];
	if (scenes.length <= 1) return project;

	let offset = 0;
	const mergedLayers = [];
	for (const scene of scenes) {
		for (const layer of scene.layers || []) {
			mergedLayers.push({
				...layer,
				startTime: (layer.startTime || 0) + offset,
			});
		}
		offset += scene.duration || 0;
	}

	const primary = { ...scenes[0], layers: mergedLayers, duration: offset };
	return { ...project, scenes: [primary] };
}
