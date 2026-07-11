import { createSlice } from "@reduxjs/toolkit";
import { createDefaultProject, createScene, LAYER_FACTORIES } from "../../video-editor/defaults";
import { nextTimelineRow, compactTimelineRows } from "../../video-editor/timelineRows";
import { normalizeProject, MIN_SCENE_DURATION, MIN_CLIP_DURATION, extendSceneDuration, getLayerClipDuration } from "../../video-editor/timeline";
import { clampTimelinePxPerSec } from "../../video-editor/timelineZoom";
import { uid } from "../../video-editor/utils";
import { HISTORY_LIMIT, cloneEditorSnapshot } from "../historyConfig";

const defaultProject = createDefaultProject();

const initialState = {
	project: defaultProject,
	activeSceneId: defaultProject.scenes[0].id,
	selectedLayerIds: [],
	selectedLayerId: null,
	clipboardLayer: null,
	history: {
		past: [],
		future: [],
	},
	playback: {
		isPlaying: false,
		currentTime: 0,
		previewLocalTime: 0,
		isRendering: false,
		audioUnlocked: false,
		renderSnapshot: null,
		timelineScrollAnchor: null,
	},
	pxPerSec: 72,
	/** Bumps when project content changes — used to invalidate export preview cache */
	previewContentVersion: 0,
	recordedAudio: [],
	ui: {
		leftTab: null,
		focusSection: null,
		commandNonce: 0,
		recordAudioModal: null,
	},
};

function syncPrimarySelection(state) {
	state.selectedLayerId =
		state.selectedLayerIds.length > 0
			? state.selectedLayerIds[state.selectedLayerIds.length - 1]
			: null;
}

function applySnapshot(state, snapshot) {
	state.project = snapshot.project;
	state.activeSceneId = snapshot.activeSceneId;
	state.selectedLayerIds =
		snapshot.selectedLayerIds ??
		(snapshot.selectedLayerId ? [snapshot.selectedLayerId] : []);
	syncPrimarySelection(state);
}

const videoEditorSlice = createSlice({
	name: "videoEditor",
	initialState,
	reducers: {
		pushHistorySnapshot(state, action) {
			state.history.past.push(action.payload);
			if (state.history.past.length > HISTORY_LIMIT) {
				state.history.past.shift();
			}
			state.history.future = [];
		},
		bumpPreviewContentVersion(state) {
			state.previewContentVersion = (state.previewContentVersion || 0) + 1;
		},
		undo(state) {
			if (state.history.past.length === 0) return;
			const current = cloneEditorSnapshot(state);
			state.history.future.unshift(current);
			const previous = state.history.past.pop();
			applySnapshot(state, previous);
		},
		redo(state) {
			if (state.history.future.length === 0) return;
			const current = cloneEditorSnapshot(state);
			state.history.past.push(current);
			if (state.history.past.length > HISTORY_LIMIT) {
				state.history.past.shift();
			}
			const next = state.history.future.shift();
			applySnapshot(state, next);
		},
		resetProject(state) {
			const project = createDefaultProject();
			state.project = project;
			state.activeSceneId = project.scenes[0].id;
			state.selectedLayerIds = [];
			state.selectedLayerId = null;
			state.clipboardLayer = null;
			state.history = { past: [], future: [] };
			state.playback = {
				isPlaying: false,
				currentTime: 0,
				previewLocalTime: 0,
				isRendering: false,
				audioUnlocked: false,
				renderSnapshot: null,
			};
		},
		loadProject(state, action) {
			const project = normalizeProject(action.payload);
			state.project = project;
			state.activeSceneId = project.scenes[0]?.id ?? null;
			state.selectedLayerIds = [];
			state.selectedLayerId = null;
			state.clipboardLayer = null;
			state.history = { past: [], future: [] };
			state.playback.currentTime = 0;
			state.playback.previewLocalTime = 0;
		},
		setProjectName(state, action) {
			state.project.name = action.payload;
		},
		setActiveScene(state, action) {
			state.activeSceneId = action.payload;
			if (!state.playback.isPlaying) {
				state.selectedLayerIds = [];
				syncPrimarySelection(state);
			}
		},
		selectLayer(state, action) {
			const id = action.payload;
			state.selectedLayerIds = id ? [id] : [];
			syncPrimarySelection(state);
		},
		toggleLayerSelection(state, action) {
			const id = action.payload;
			if (!id) return;
			const idx = state.selectedLayerIds.indexOf(id);
			if (idx >= 0) {
				state.selectedLayerIds.splice(idx, 1);
			} else {
				state.selectedLayerIds.push(id);
			}
			syncPrimarySelection(state);
		},
		setTimelineScrollAnchor(state, action) {
			state.playback.timelineScrollAnchor = action.payload;
		},
		setPxPerSec(state, action) {
			state.pxPerSec = clampTimelinePxPerSec(action.payload);
		},
		setTimelineZoom(state, action) {
			const v = clampTimelinePxPerSec(action.payload);
			state.pxPerSec = v;
			for (const scene of state.project.scenes) {
				scene.timelinePxPerSec = v;
			}
		},
		runCommandNavigation(state, action) {
			const {
				leftTab,
				focusSection,
				sceneId,
				layerId,
				layerIds,
			} = action.payload ?? {};
			state.ui.commandNonce += 1;
			if (leftTab !== undefined) state.ui.leftTab = leftTab;
			if (focusSection !== undefined) state.ui.focusSection = focusSection;
			if (sceneId) state.activeSceneId = sceneId;
			if (layerIds?.length) {
				state.selectedLayerIds = [...layerIds];
			} else if (layerId) {
				state.selectedLayerIds = [layerId];
			}
			syncPrimarySelection(state);
		},
		clearCommandNavigation(state) {
			state.ui.leftTab = null;
			state.ui.focusSection = null;
		},
		clearCommandLeftTab(state) {
			state.ui.leftTab = null;
		},
		clearCommandFocusSection(state) {
			state.ui.focusSection = null;
		},
		openRecordAudioModal(state, action) {
			state.ui.recordAudioModal = action.payload ?? { insertAt: null };
		},
		closeRecordAudioModal(state) {
			state.ui.recordAudioModal = null;
		},
		addRecordedAudio(state, action) {
			state.recordedAudio.unshift(action.payload);
		},
		removeRecordedAudio(state, action) {
			const id = action.payload;
			const track = state.recordedAudio.find((t) => t.id === id);
			if (track?.src?.startsWith("blob:")) {
				try {
					URL.revokeObjectURL(track.src);
				} catch {
					/* ignore */
				}
			}
			state.recordedAudio = state.recordedAudio.filter((t) => t.id !== id);
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
			const rendering = action.payload;
			if (rendering) {
				state.playback.isPlaying = false;
				state.playback.renderSnapshot = {
					globalTime: state.playback.currentTime,
					localTime: state.playback.previewLocalTime,
					sceneId: state.activeSceneId,
				};
			} else if (state.playback.renderSnapshot) {
				const snap = state.playback.renderSnapshot;
				state.playback.currentTime = snap.globalTime;
				state.playback.previewLocalTime = snap.localTime;
				if (snap.sceneId) state.activeSceneId = snap.sceneId;
				state.playback.renderSnapshot = null;
			}
			state.playback.isRendering = rendering;
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
			state.selectedLayerIds = [];
			syncPrimarySelection(state);
		},
		removeScene(state, action) {
			if (state.project.scenes.length <= 1) return;
			const id = action.payload;
			state.project.scenes = state.project.scenes.filter((s) => s.id !== id);
			if (state.activeSceneId === id) {
				state.activeSceneId = state.project.scenes[0].id;
			}
			state.selectedLayerIds = [];
			syncPrimarySelection(state);
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
				clipDuration,
				...(overrides || {}),
			};
			layer.startTime = overrides?.startTime ?? startTime;
			layer.timelineRow = overrides?.timelineRow ?? nextTimelineRow(scene.layers);
			if (dataPatch) layer.data = { ...layer.data, ...dataPatch };
			if (insertAt === "start") {
				scene.layers.unshift(layer);
			} else {
				scene.layers.push(layer);
			}
			extendSceneDuration(scene);
			state.selectedLayerIds = [layer.id];
			syncPrimarySelection(state);
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
			const { sceneId, layerId, startTime, clipDuration, timelineRow } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;
			if (startTime != null) {
				layer.startTime = Math.max(0, startTime);
			}
			if (clipDuration != null) {
				layer.clipDuration = Math.max(MIN_CLIP_DURATION, clipDuration);
			}
			if (timelineRow != null) {
				layer.timelineRow = timelineRow;
			}
			extendSceneDuration(scene);
		},
		splitLayerAtTime(state, action) {
			const { sceneId, layerId, atTime } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (!layer) return;

			const start = layer.startTime || 0;
			const clipDur = getLayerClipDuration(layer, scene.duration);
			const end = start + clipDur;

			if (atTime <= start + MIN_CLIP_DURATION || atTime >= end - MIN_CLIP_DURATION) return;

			const firstDur = atTime - start;
			const secondDur = end - atTime;

			layer.clipDuration = firstDur;

			const copy = JSON.parse(JSON.stringify(layer));
			copy.id = uid("layer");
			copy.startTime = atTime;
			copy.clipDuration = secondDur;
			copy.timelineRow = layer.timelineRow ?? 0;

			if (layer.type === "video" || layer.type === "audio") {
				const trim = layer.data?.mediaTrimStart ?? 0;
				copy.data = { ...copy.data, mediaTrimStart: trim + firstDur };
			}

			const idx = scene.layers.findIndex((l) => l.id === layerId);
			scene.layers.splice(idx + 1, 0, copy);
			state.selectedLayerIds = [copy.id];
			syncPrimarySelection(state);
			extendSceneDuration(scene);
		},
		swapTimelineRows(state, action) {
			const { sceneId, rowA, rowB } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			for (const layer of scene.layers) {
				const row = layer.timelineRow ?? 0;
				if (row === rowA) layer.timelineRow = rowB;
				else if (row === rowB) layer.timelineRow = rowA;
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
			state.selectedLayerIds = state.selectedLayerIds.filter((id) => id !== layerId);
			syncPrimarySelection(state);
		},
		deleteLayers(state, action) {
			const { sceneId, layerIds } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene || !layerIds?.length) return;
			const remove = new Set(layerIds);
			scene.layers = scene.layers.filter((l) => !remove.has(l.id));
			state.selectedLayerIds = state.selectedLayerIds.filter((id) => !remove.has(id));
			syncPrimarySelection(state);
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
			state.selectedLayerIds = [copy.id];
			syncPrimarySelection(state);
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
			state.selectedLayerIds = [copy.id];
			syncPrimarySelection(state);
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
			state.selectedLayerIds = [copy.id];
			syncPrimarySelection(state);
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
		toggleLayerLock(state, action) {
			const { sceneId, layerId } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene) return;
			const layer = scene.layers.find((l) => l.id === layerId);
			if (layer) layer.locked = !layer.locked;
		},
		moveLayerZIndex(state, action) {
			const { sceneId, layerId, direction } = action.payload;
			const scene = state.project.scenes.find((s) => s.id === sceneId);
			if (!scene?.layers?.length) return;
			const idx = scene.layers.findIndex((l) => l.id === layerId);
			if (idx === -1) return;

			const layers = scene.layers.slice();
			const [layer] = layers.splice(idx, 1);

			if (direction === "front") {
				// Canvas: draw last (on top). Timeline: move track to top row.
				const minRow = layers.length
					? Math.min(...layers.map((l) => l.timelineRow ?? 0))
					: 0;
				layer.timelineRow = minRow - 1;
				layers.push(layer);
				scene.layers = layers;
				compactTimelineRows(scene.layers);
				return;
			}

			if (direction === "back") {
				// Canvas: draw first (underneath). Timeline: move track to bottom row.
				const maxRow = layers.length
					? Math.max(...layers.map((l) => l.timelineRow ?? 0))
					: 0;
				layer.timelineRow = maxRow + 1;
				layers.unshift(layer);
				scene.layers = layers;
				compactTimelineRows(scene.layers);
				return;
			}

			if (direction === "forward") {
				const insertAt = Math.min(idx + 1, layers.length);
				layers.splice(insertAt, 0, layer);
				scene.layers = layers;
				return;
			}

			if (direction === "backward") {
				const insertAt = Math.max(idx - 1, 0);
				layers.splice(insertAt, 0, layer);
				scene.layers = layers;
				return;
			}

			// Unknown direction — put layer back
			layers.splice(idx, 0, layer);
			scene.layers = layers;
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
	pushHistorySnapshot,
	bumpPreviewContentVersion,
	undo,
	redo,
	resetProject,
	loadProject,
	setProjectName,
	setActiveScene,
	selectLayer,
	toggleLayerSelection,
	setTimelineScrollAnchor,
	setPxPerSec,
	setTimelineZoom,
	runCommandNavigation,
	clearCommandNavigation,
	clearCommandLeftTab,
	clearCommandFocusSection,
	openRecordAudioModal,
	closeRecordAudioModal,
	addRecordedAudio,
	removeRecordedAudio,
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
	splitLayerAtTime,
	swapTimelineRows,
	updateLayerData,
	deleteLayer,
	deleteLayers,
	duplicateLayer,
	duplicateLayerInPlace,
	copyLayer,
	pasteLayer,
	reorderLayers,
	toggleLayerVisibility,
	toggleLayerLock,
	moveLayerZIndex,
	updateCanvas,
	setCanvasDimensions,
} = videoEditorSlice.actions;

export default videoEditorSlice.reducer;
