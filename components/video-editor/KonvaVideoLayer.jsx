import { useEffect, useRef, useState } from "react";
import { getLayerClipDuration } from "@/lib/video-editor/timeline";
import KonvaMediaFrame from "./KonvaMediaFrame";

/**
 * Renders HTML5 video in Konva, synced to timeline previewLocalTime.
 * Audio plays when playback.audioUnlocked (set on first user play click).
 */
export default function KonvaVideoLayer({
	layer,
	anim,
	sceneDuration,
	previewTime,
	isVideoPlaying,
	audioUnlocked,
	isSelected,
	onSelect,
	onChange,
	registerRef,
	interactive,
	onAltDragDuplicate,
}) {
	const imageRef = useRef(null);
	const [videoEl, setVideoEl] = useState(null);
	const [loadError, setLoadError] = useState(false);
	const src = layer.data?.src;
	const layerMuted = layer.data?.muted ?? false;
	const volume = layer.data?.volume ?? 1;

	const startTime = layer.startTime || 0;
	const clipDuration = getLayerClipDuration(layer, sceneDuration);
	const clipLocalTime = Math.max(0, previewTime - startTime);
	const shouldMute = layerMuted || !audioUnlocked;

	useEffect(() => {
		if (!src) {
			setVideoEl(null);
			setLoadError(false);
			return;
		}

		const video = document.createElement("video");
		video.crossOrigin = "anonymous";
		video.playsInline = true;
		video.preload = "auto";
		video.loop = false;
		video.src = src;

		const onReady = () => {
			setLoadError(false);
			setVideoEl(video);
		};
		const onError = () => {
			setLoadError(true);
			setVideoEl(null);
		};

		video.addEventListener("loadeddata", onReady);
		video.addEventListener("error", onError);
		video.load();

		return () => {
			video.removeEventListener("loadeddata", onReady);
			video.removeEventListener("error", onError);
			video.pause();
			video.removeAttribute("src");
			video.load();
			setVideoEl(null);
		};
	}, [src]);

	useEffect(() => {
		if (!videoEl) return;
		videoEl.muted = shouldMute;
		videoEl.volume = Math.max(0, Math.min(1, volume));
	}, [videoEl, shouldMute, volume]);

	useEffect(() => {
		if (!videoEl) return;

		const dur = Number.isFinite(videoEl.duration) ? videoEl.duration : clipDuration;
		const seekTo = Math.min(Math.max(0, clipLocalTime), Math.max(0, dur - 0.05));

		if (!isVideoPlaying) {
			videoEl.pause();
			if (Math.abs(videoEl.currentTime - seekTo) > 0.05) {
				try {
					videoEl.currentTime = seekTo;
				} catch {
					/* ignore seek errors before metadata */
				}
			}
			imageRef.current?.getLayer()?.batchDraw();
			return;
		}

		if (Math.abs(videoEl.currentTime - seekTo) > 0.25) {
			try {
				videoEl.currentTime = seekTo;
			} catch {
				/* ignore */
			}
		}
		videoEl.play().catch(() => {});
	}, [videoEl, isVideoPlaying, clipLocalTime, clipDuration, shouldMute]);

	useEffect(() => {
		if (!videoEl || !isVideoPlaying) return;
		let rafId;
		const frame = () => {
			imageRef.current?.getLayer()?.batchDraw();
			rafId = requestAnimationFrame(frame);
		};
		rafId = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(rafId);
	}, [videoEl, isVideoPlaying]);

	const placeholderFill = loadError
		? "rgba(239,68,68,0.35)"
		: "rgba(59,130,246,0.35)";

	return (
		<KonvaMediaFrame
			layer={layer}
			anim={anim}
			mediaElement={videoEl}
			placeholderFill={placeholderFill}
			mediaImageRef={imageRef}
			onSelect={onSelect}
			onChange={onChange}
			registerRef={registerRef}
			interactive={interactive}
			onAltDragDuplicate={onAltDragDuplicate}
		/>
	);
}
