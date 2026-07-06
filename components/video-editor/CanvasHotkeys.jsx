import { useHotkeys } from "react-hotkeys-hook";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	togglePlayback,
	moveLayerZIndex,
	setAudioUnlocked,
	copyLayer,
	pasteLayer,
} from "@/lib/store/slices/videoEditorSlice";

/**
 * Keyboard shortcuts when canvas area is focused.
 * Uses react-hotkeys-hook — no manual useEffect listeners.
 */
export default function CanvasHotkeys({ enabled }) {
	const dispatch = useAppDispatch();
	const { activeSceneId, selectedLayerId, clipboardLayer, playback } = useAppSelector(
		(s) => s.videoEditor,
	);

	useHotkeys(
		"space",
		(e) => {
			e.preventDefault();
			if (!playback.isPlaying) dispatch(setAudioUnlocked(true));
			dispatch(togglePlayback());
		},
		{ enabled, enableOnFormTags: false },
		[enabled, dispatch, playback.isPlaying],
	);

	useHotkeys(
		"meta+c, ctrl+c",
		(e) => {
			if (!selectedLayerId || !activeSceneId) return;
			e.preventDefault();
			dispatch(copyLayer({ sceneId: activeSceneId, layerId: selectedLayerId }));
		},
		{ enabled: enabled && !!selectedLayerId },
		[enabled, selectedLayerId, activeSceneId, dispatch],
	);

	useHotkeys(
		"meta+v, ctrl+v",
		(e) => {
			if (!activeSceneId || !clipboardLayer) return;
			e.preventDefault();
			dispatch(pasteLayer({ sceneId: activeSceneId }));
		},
		{ enabled: enabled && !!clipboardLayer },
		[enabled, activeSceneId, clipboardLayer, dispatch],
	);

	useHotkeys(
		"meta+], ctrl+]",
		(e) => {
			if (!selectedLayerId || !activeSceneId) return;
			e.preventDefault();
			dispatch(
				moveLayerZIndex({
					sceneId: activeSceneId,
					layerId: selectedLayerId,
					direction: "forward",
				}),
			);
		},
		{ enabled: enabled && !!selectedLayerId },
		[enabled, selectedLayerId, activeSceneId, dispatch],
	);

	useHotkeys(
		"meta+[, ctrl+[",
		(e) => {
			if (!selectedLayerId || !activeSceneId) return;
			e.preventDefault();
			dispatch(
				moveLayerZIndex({
					sceneId: activeSceneId,
					layerId: selectedLayerId,
					direction: "backward",
				}),
			);
		},
		{ enabled: enabled && !!selectedLayerId },
		[enabled, selectedLayerId, activeSceneId, dispatch],
	);

	return null;
}
