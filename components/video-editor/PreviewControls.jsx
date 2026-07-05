import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	setCurrentTime,
	setPlaying,
	setAudioUnlocked,
	togglePlayback,
} from "@/lib/store/slices/videoEditorSlice";
import { getTotalDuration, resolveTime } from "@/lib/video-editor/timeline";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

function formatSimple(seconds) {
	const s = Math.max(0, Math.floor(seconds));
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function PreviewControls() {
	const dispatch = useAppDispatch();
	const { project, playback } = useAppSelector((s) => s.videoEditor);
	const rafRef = useRef(null);
	const lastTickRef = useRef(performance.now());
	const currentTimeRef = useRef(0);

	const total = getTotalDuration(project.scenes);
	const { isPlaying, currentTime } = playback;
	currentTimeRef.current = currentTime;

	const tick = useCallback(() => {
		const now = performance.now();
		const dt = (now - lastTickRef.current) / 1000;
		lastTickRef.current = now;

		const max = getTotalDuration(project.scenes);
		const next = Math.min(currentTimeRef.current + dt, max);

		const { scene, localTime } = resolveTime(project.scenes, next);
		dispatch(
			setCurrentTime({
				globalTime: next,
				sceneId: scene?.id,
				localTime,
			}),
		);

		if (next >= max - 0.02) {
			dispatch(setPlaying(false));
			return;
		}
		rafRef.current = requestAnimationFrame(tick);
	}, [dispatch, project.scenes]);

	useEffect(() => {
		if (!isPlaying) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			return;
		}
		lastTickRef.current = performance.now();
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying, tick]);

	return (
		<div className="shrink-0 flex items-center justify-center gap-3 py-2 border-t-2 border-border bg-card">
			<span className="text-sm font-semibold tabular-nums text-foreground min-w-[36px] text-right">
				{formatSimple(currentTime)}
			</span>
			<Button
				size="icon"
				variant="outline"
				className="h-9 w-9 rounded-full shrink-0"
				onClick={() => {
					if (!isPlaying) dispatch(setAudioUnlocked(true));
					dispatch(togglePlayback());
				}}
				title={isPlaying ? "Pause" : "Play"}
			>
				{isPlaying ? (
					<Pause className="h-4 w-4" />
				) : (
					<Play className="h-4 w-4 ml-0.5" />
				)}
			</Button>
			<span className="text-sm tabular-nums text-muted-foreground min-w-[36px]">
				{formatSimple(total)}
			</span>
		</div>
	);
}
