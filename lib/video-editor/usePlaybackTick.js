import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setCurrentTime, setPlaying } from "@/lib/store/slices/videoEditorSlice";
import { getTotalDuration, getTimelineDuration, getPrimaryScene } from "@/lib/video-editor/timeline";

/** RAF loop that advances timeline time while playback is active. */
export default function usePlaybackTick() {
	const dispatch = useAppDispatch();
	const { project, playback } = useAppSelector((s) => s.videoEditor);
	const rafRef = useRef(null);
	const lastTickRef = useRef(performance.now());
	const currentTimeRef = useRef(0);

	const { isPlaying, isRendering, currentTime } = playback;
	currentTimeRef.current = currentTime;

	const tick = useCallback(() => {
		const now = performance.now();
		const dt = (now - lastTickRef.current) / 1000;
		lastTickRef.current = now;

		const primary = getPrimaryScene(project);
		const max = getTotalDuration(project.scenes);
		const next = Math.min(currentTimeRef.current + dt, max);
		const localTime = Math.max(0, Math.min(next, getTimelineDuration(primary) - 0.001));

		dispatch(
			setCurrentTime({
				globalTime: next,
				sceneId: primary?.id,
				localTime,
			}),
		);

		if (next >= max - 0.02) {
			dispatch(setPlaying(false));
			return;
		}
		rafRef.current = requestAnimationFrame(tick);
	}, [dispatch, project]);

	useEffect(() => {
		if (!isPlaying || isRendering) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			return;
		}
		lastTickRef.current = performance.now();
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying, isRendering, tick]);
}
