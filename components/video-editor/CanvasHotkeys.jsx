import { useHotkeys } from "react-hotkeys-hook";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { togglePlayback, setAudioUnlocked } from "@/lib/store/slices/videoEditorSlice";

/** Free tier: Space play/pause only. */
export default function CanvasHotkeys({ enabled }) {
	const dispatch = useAppDispatch();
	const { playback } = useAppSelector((s) => s.videoEditor);

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

	return null;
}
