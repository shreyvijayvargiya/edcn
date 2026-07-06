import { useHotkeys } from "react-hotkeys-hook";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { deleteLayers } from "@/lib/store/slices/videoEditorSlice";

/** Delete selected layer(s) from anywhere in the editor */
export default function EditorLayerHotkeys() {
	const dispatch = useAppDispatch();
	const { activeSceneId, selectedLayerIds, playback } = useAppSelector(
		(s) => s.videoEditor,
	);
	const canDelete = selectedLayerIds.length > 0 && !!activeSceneId;
	const blocked = playback.isPlaying || playback.isRendering;

	useHotkeys(
		"delete, backspace",
		(e) => {
			if (!canDelete || blocked) return;
			e.preventDefault();
			dispatch(deleteLayers({ sceneId: activeSceneId, layerIds: selectedLayerIds }));
		},
		{ enableOnFormTags: false },
		[canDelete, blocked, activeSceneId, selectedLayerIds, dispatch],
	);

	return null;
}
