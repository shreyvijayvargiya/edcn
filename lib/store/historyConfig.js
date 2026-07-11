/** Max undo snapshots kept in memory */
export const HISTORY_LIMIT = 5;

/** Project mutations that push an undo snapshot before applying */
export const HISTORY_TRACKED_ACTIONS = new Set([
	"videoEditor/resetProject",
	"videoEditor/loadProject",
	"videoEditor/addScene",
	"videoEditor/removeScene",
	"videoEditor/reorderScenes",
	"videoEditor/updateScene",
	"videoEditor/resizeSceneDuration",
	"videoEditor/addLayer",
	"videoEditor/updateLayer",
	"videoEditor/updateLayerTiming",
	"videoEditor/updateLayerData",
	"videoEditor/splitLayerAtTime",
	"videoEditor/deleteLayer",
	"videoEditor/deleteLayers",
	"videoEditor/duplicateLayer",
	"videoEditor/duplicateLayerInPlace",
	"videoEditor/pasteLayer",
	"videoEditor/reorderLayers",
	"videoEditor/toggleLayerVisibility",
	"videoEditor/toggleLayerLock",
	"videoEditor/moveLayerZIndex",
	"videoEditor/updateCanvas",
	"videoEditor/setCanvasDimensions",
]);

export const HISTORY_SKIP_ACTIONS = new Set([
	"videoEditor/pushHistorySnapshot",
	"videoEditor/undo",
	"videoEditor/redo",
]);

export function cloneEditorSnapshot(state) {
	return {
		project: JSON.parse(JSON.stringify(state.project)),
		activeSceneId: state.activeSceneId,
		selectedLayerIds: [...state.selectedLayerIds],
	};
}
