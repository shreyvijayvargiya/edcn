import { useHotkeys } from "react-hotkeys-hook";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { undo, redo } from "@/lib/store/slices/videoEditorSlice";

/** Global undo/redo shortcuts for the editor (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y) */
export default function EditorHistoryHotkeys() {
	const dispatch = useAppDispatch();
	const { history, playback } = useAppSelector((s) => s.videoEditor);
	const canUndo = history.past.length > 0;
	const canRedo = history.future.length > 0;
	const blocked = playback.isPlaying || playback.isRendering;

	useHotkeys(
		"meta+z, ctrl+z",
		(e) => {
			if (!canUndo || blocked) return;
			e.preventDefault();
			dispatch(undo());
		},
		{ enableOnFormTags: false },
		[canUndo, blocked, dispatch],
	);

	useHotkeys(
		"meta+shift+z, ctrl+shift+z, ctrl+y",
		(e) => {
			if (!canRedo || blocked) return;
			e.preventDefault();
			dispatch(redo());
		},
		{ enableOnFormTags: false },
		[canRedo, blocked, dispatch],
	);

	return null;
}
