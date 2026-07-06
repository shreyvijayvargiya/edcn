import { useHotkeys } from "react-hotkeys-hook";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { deleteLayer } from "@/lib/store/slices/videoEditorSlice";

/** Delete selected layer from anywhere in the editor (timeline or canvas selection) */
export default function EditorLayerHotkeys() {
	const dispatch = useAppDispatch();
	const { activeSceneId, selectedLayerId, playback } = useAppSelector(
		(s) => s.videoEditor,
	);
	const canDelete = !!selectedLayerId && !!activeSceneId;
	const blocked = playback.isPlaying || playback.isRendering;

	useHotkeys(
		"delete, backspace",
		(e) => {
			if (!canDelete || blocked) return;
			e.preventDefault();
			dispatch(deleteLayer({ sceneId: activeSceneId, layerId: selectedLayerId }));
		},
		{ enableOnFormTags: false },
		[canDelete, blocked, activeSceneId, selectedLayerId, dispatch],
	);

	return null;
}
