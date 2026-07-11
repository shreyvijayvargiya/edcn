import { useEffect, useRef } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { isLayerActiveAtTime, getLayerClipDuration } from "@/lib/video-editor/timeline";

/**
 * Syncs hidden HTMLAudioElement instances with timeline playback.
 */
export default function AudioPlaybackSync() {
	const { project, activeSceneId, playback } = useAppSelector((s) => s.videoEditor);
	const poolRef = useRef(new Map());

	const activeScene = project.scenes.find((s) => s.id === activeSceneId);
	const previewTime = playback.previewLocalTime ?? 0;
	const shouldPlay = playback.isPlaying;

	useEffect(() => {
		if (!activeScene) return;

		const pool = poolRef.current;
		const activeIds = new Set();

		for (const layer of activeScene.layers) {
			if (layer.type !== "audio" || !layer.visible || !layer.data?.src) continue;
			if (!isLayerActiveAtTime(layer, activeScene.duration, previewTime)) continue;

			activeIds.add(layer.id);

			let audio = pool.get(layer.id);
			if (!audio) {
				audio = document.createElement("audio");
				audio.preload = "auto";
				audio.crossOrigin = "anonymous";
				pool.set(layer.id, audio);
			}
			if (audio.src !== layer.data.src) {
				audio.src = layer.data.src;
				audio.load();
			}

			audio.volume = Math.max(0, Math.min(1, layer.data?.volume ?? 1));
			audio.muted = Boolean(layer.data?.muted);

			const startTime = layer.startTime || 0;
			const clipLocalTime = Math.max(0, previewTime - startTime);
			const clipDur = getLayerClipDuration(layer, activeScene.duration);
			const mediaTrimStart = layer.data?.mediaTrimStart ?? 0;
			const seekTo = Math.min(
				mediaTrimStart + clipLocalTime,
				Math.max(0, mediaTrimStart + clipDur - 0.05),
			);

			if (!shouldPlay) {
				audio.pause();
				if (Math.abs(audio.currentTime - seekTo) > 0.05) {
					try {
						audio.currentTime = seekTo;
					} catch {
						/* ignore */
					}
				}
				continue;
			}

			if (Math.abs(audio.currentTime - seekTo) > 0.25) {
				try {
					audio.currentTime = seekTo;
				} catch {
					/* ignore */
				}
			}
			audio.play().catch(() => {});
		}

		for (const [id, audio] of pool.entries()) {
			if (!activeIds.has(id)) audio.pause();
		}
	}, [activeScene, previewTime, shouldPlay]);

	useEffect(() => {
		const pool = poolRef.current;
		return () => {
			for (const audio of pool.values()) {
				audio.pause();
				audio.removeAttribute("src");
			}
			pool.clear();
		};
	}, []);

	return null;
}
