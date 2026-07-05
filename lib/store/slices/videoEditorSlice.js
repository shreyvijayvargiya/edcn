import { createSlice } from "@reduxjs/toolkit";
import { createDefaultProject, createScene, LAYER_FACTORIES } from "../../video-editor/defaults";
import { normalizeProject, MIN_SCENE_DURATION, MIN_CLIP_DURATION } from "../../video-editor/timeline";
import { uid } from "../../video-editor/utils";

const defaultProject = createDefaultProject();

const initialState = {
	project: defaultProject,
	activeSceneId: defaultProject.scenes[0].id,
	selectedLayerId: null,
	clipboardLayer: null,
	playback: {
		isPlaying: false,
		currentTime: 0,
		previewLocalTime: 0,
		isRendering: false,
		audioUnlocked: false,
	},
	pxPerSec: 72,
};

const videoEditorSlice = createSlice({
	name: "videoEditor",
	initialState,
	reducers: {
		resetProject(state) {
			const project = createDefaultProject();
			state.project = project;
			state.activeSceneId = project.scenes[0].id;
			state.selectedLayerId = null;
			state.clipboardLayer = null;
			state.playback = { isPlaying: false, currentTime: 0, previewLocalTime: 0, isRendering: false, audioUnlocked: false };
		},
		loadProject(state, action) {
			const project = normalizeProject(action.payload);
			state.project = project;
			state.activeSceneId = project.scenes[0]?.id ?? null;
			state.selectedLayerId = null;
			state.clipboardLayer = null;
			state.playback.currentTime = 0;
			state.playback.previewLocalTime = 0;
		},
		setProjectName(state, action) {
			state.project.name = action.payload;
		},
		setActiveScene(state, action) {
			state.activeSceneId = action.payload;
			if (!state.playback.isPlaying) {
				state.selectedLayerId = null;
			}
		},
		selectLayer(state, action) {
			state.selectedLayerId = action.payload;
		},
		setPxPerSec(state, action) {
			state.pxPerSec = Math.max(40, Math.min(160, action.payload));
		},
		setCurrentTime(state, action) {
			const { globalTime, sceneId, localTime } = action.payload;
			state.playback.currentTime = globalTime;
			if (sceneId) state.activeSceneId = sceneId;
			if (localTime != null) state.playback.previewLocalTime = localTime;
		},
		setPlaying(state, action) {
			state.playback.isPlaying = action.payload;
		},
		setRendering(state, action) {
			state.playback.isRendering = action.payload;
		},
		setAudioUnlocked(state, action) {
			state.playback.audioUnlocked = action.payload ?? true;
		},
		togglePlayback(state) {
			state.playback.isPlaying = !state.playback.isPlaying;
		},
		stopPlayback(state) {
			state.playback.isPlaying = false;
			state.playback.currentTime = 0;
			state.playback.previewLocalTime = 0;
			state.activeSceneId = state.project.scenes[0]?.id ?? state.activeSceneId;
		},
		addScene(state) {
			const index = state.project.scenes.length + 1;
			const scene = createScene({ name: `Scene ${index}`, layers: [] });
			state.project.scenes.push(scene);
			state.activeSceneId = scene.id;
			state.selectedLayerId = null;
		},
		removeScene(state, action) {
			if (state.project.scenes.length <= 1) return;
			const id = action.payload;
			state.project.scenes = state.project.scenes.filter((s) => s.id !== id);
			if (state.activeSceneId === id) {
				state.activeSceneId = state.project.scenes[0].id;
			}
			state.selectedLayerId = null;
		},
		reorderScenes(state, action) {
			state.project.scenes = action.payload;
		},
		updateScene(state, action) {
			const { sceneId, changes } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			Object.assign(scene, changes);
			if (changes.duration != null) {
				const dur = Math.max(MIN_SCENE_DURATION, changes.duration);
				scene.duration = dur;
				for (const layer of scene.layers) {
					if ((layer.startTime || 0) >= dur) layer.startTime = 0;
					const maxClip = dur - (layer.startTime || 0);
					if ((layer.clipDuration ?? dur) > maxClip) {
						layer.clipDuration = Math.max(MIN_CLIP_DURATION, maxClip);
					}
				}
			}
		},
		resizeSceneDuration(state, action) {
			const { sceneId, duration } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			scene.duration = Math.max(MIN_SCENE_DURATION, duration);
			for (const layer of scene.layers) {
				const maxClip = scene.duration - (layer.startTime || 0);
				if ((layer.clipDuration ?? scene.duration) > maxClip) {
					layer.clipDuration = Math.max(MIN_CLIP_DURATION, maxClip);
				}
			}
		},
		addLayer(state, action) {
			const {
				sceneId,
				type,
				data: dataPatch,
				overrides,
				mediaDuration,
				insertAt = "end",
			} = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const factory = LAYER_FACTORIES[type];
			if (!factory) return;

			let clipDuration = scene.duration;
			let startTime = 0;

			if (
				mediaDuration != null &&
				Number.isFinite(mediaDuration) &&
				mediaDuration > 0 &&
				(type === "video" || type === "audio")
			) {
				const dur = Math.max(MIN_SCENE_DURATION, mediaDuration);
				if (scene.duration < dur) {
					scene.duration = dur;
				}
				clipDuration = dur;
				startTime = 0;
			}

			const layer = {
				...factory(),
				startTime,
				clipDuration,
				...(overrides || {}),
			};
			if (dataPatch) layer.data = { ...layer.data, ...dataPatch };
			if (insertAt === "start") {
				scene.layers.unshift(layer);
			} else {
				scene.layers.push(layer);
			}
			state.selectedLayerId = layer.id;
		},
		updateLayer(state, action) {
			const { sceneId, layerId, changes } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;
			Object.assign(layer, changes);
		},
		updateLayerTiming(state, action) {
			const { sceneId, layerId, startTime, clipDuration } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;
			const dur = scene.duration;
			if (startTime != null) {
				layer.startTime = Math.max(0, Math.min(startTime, dur - MIN_CLIP_DURATION));
			}
			if (clipDuration != null) {
				const maxClip = dur - (layer.startTime || 0);
				layer.clipDuration = Math.max(MIN_CLIP_DURATION, Math.min(clipDuration, maxClip));
			}
		},
		updateLayerData(state, action) {
			const { sceneId, layerId, data } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;
			layer.data = { ...layer.data, ...data };
		},
		deleteLayer(state, action) {
			const { sceneId, layerId } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			scene.layers = scene.layers.filter((l) => l.id !== layerId);
			if (state.selectedLayerId === layerId) {
				state.selectedLayerId = null;
			}
		},
		duplicateLayer(state, action) {
			const { sceneId, layerId } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;
			const copy = {
				...JSON.parse(JSON.stringify(layer)),
				id: uid("layer"),
				x: layer.x + 16,
				y: layer.y + 16,
				startTime: Math.min((layer.startTime || 0) + 0.5, scene.duration - MIN_CLIP_DURATION),
			};
			scene.layers.push(copy);
			state.selectedLayerId = copy.id;
		},
		/** Alt/Option+drag: duplicate in place, original stays put */
		duplicateLayerInPlace(state, action) {
			const { sceneId, layerId } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;
			const copy = {
				...JSON.parse(JSON.stringify(layer)),
				id: uid("layer"),
			};
			scene.layers.push(copy);
			state.selectedLayerId = copy.id;
		},
		copyLayer(state, action) {
			const { sceneId, layerId } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;
			state.clipboardLayer = JSON.parse(JSON.stringify(layer));
		},
		pasteLayer(state, action) {
			const { sceneId } = action.payload;
			if (!state.clipboardLayer) return;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const src = state.clipboardLayer;
			const copy = {
				...JSON.parse(JSON.stringify(src)),
				id: uid("layer"),
				x: src.x + 16,
				y: src.y + 16,
				startTime: Math.min(
					(src.startTime || 0) + 0.5,
					scene.duration - MIN_CLIP_DURATION,
				),
			};
			scene.layers.push(copy);
			state.selectedLayerId = copy.id;
		},
		reorderLayers(state, action) {
			const { sceneId, layers } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			scene.layers = layers;
		},
		toggleLayerVisibility(state, action) {
			const { sceneId, layerId } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (layer) layer.visible = !layer.visible;
		},
		moveLayerZIndex(state, action) {
			const { sceneId, layerId, direction } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const idx = scene.layers.findIndex((l) => l.id === layerId);
			if (idx === -1) return;
			const next = direction === "forward" ? idx + 1 : idx - 1;
			if (next < 0 || next >= scene.layers.length) return;
			const tmp = scene.layers[idx];
			scene.layers[idx] = scene.layers[next];
			scene.layers[next] = tmp;
		},
		updateCanvas(state, action) {
			state.project.canvas = { ...state.project.canvas, ...action.payload };
		},
		setCanvasDimensions(state, action) {
			const { width, height, presetId } = action.payload;
			const oldW = state.project.canvas.width || 360;
			const oldH = state.project.canvas.height || 640;
			if (oldW === width && oldH === height) {
				state.project.canvas.presetId = presetId;
				return;
			}
			const scaleX = width / oldW;
			const scaleY = height / oldH;
			state.project.canvas.width = width;
			state.project.canvas.height = height;
			state.project.canvas.presetId = presetId;
			for (const scene of state.project.scenes) {
				for (const layer of scene.layers) {
					layer.x = Math.round(layer.x * scaleX);
					layer.y = Math.round(layer.y * scaleY);
					layer.width = Math.max(10, Math.round(layer.width * scaleX));
					layer.height = Math.max(10, Math.round(layer.height * scaleY));
				}
			}
		},
	},
});

export const {
	resetProject,
	loadProject,
	setProjectName,
	setActiveScene,
	selectLayer,
	setPxPerSec,
	setCurrentTime,
	setPlaying,
	setRendering,
	setAudioUnlocked,
	togglePlayback,
	stopPlayback,
	addScene,
	removeScene,
	reorderScenes,
	updateScene,
	resizeSceneDuration,
	addLayer,
	updateLayer,
	updateLayerTiming,
	updateLayerData,
	deleteLayer,
	duplicateLayer,
	duplicateLayerInPlace,
	copyLayer,
	pasteLayer,
	reorderLayers,
	toggleLayerVisibility,
	moveLayerZIndex,
	updateCanvas,
	setCanvasDimensions,
} = videoEditorSlice.actions;

export default videoEditorSlice.reducer;
