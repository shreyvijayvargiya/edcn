import { useEffect, useRef, useState } from "react";
import { Image, Rect } from "react-konva";
import { getLayerClipDuration } from "@/lib/video-editor/timeline";
import { konvaAltDragHandlers } from "@/lib/video-editor/konvaDrag";
import { layerAnimProps } from "@/lib/video-editor/animations";

/**
 * Renders HTML5 video in Konva, synced to timeline previewLocalTime.
 * Audio plays when playback.audioUnlocked (set on first user play click).
 */
export default function KonvaVideoLayer({
	layer,
	anim,
	sceneDuration,
	previewTime,
	isPlaying,
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
	const altDrag = konvaAltDragHandlers(layer, interactive, onAltDragDuplicate);
	const pos = layerAnimProps(layer, anim ?? { opacityMult: 1, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 });

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

		if (!isPlaying) {
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
	}, [videoEl, isPlaying, clipLocalTime, clipDuration, shouldMute]);

	useEffect(() => {
		if (!videoEl || !isPlaying) return;
		let rafId;
		const frame = () => {
			imageRef.current?.getLayer()?.batchDraw();
			rafId = requestAnimationFrame(frame);
		};
		rafId = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(rafId);
	}, [videoEl, isPlaying]);

	const setRef = (node) => {
		imageRef.current = node;
		registerRef?.(node);
	};

	if (!src || loadError || !videoEl) {
		return (
			<Rect
				ref={setRef}
				x={pos.x}
				y={pos.y}
				width={layer.width}
				height={layer.height}
				scaleX={pos.scaleX}
				scaleY={pos.scaleY}
				rotation={pos.rotation}
				opacity={pos.opacity}
				visible={layer.visible}
				fill={loadError ? "rgba(239,68,68,0.35)" : "rgba(59,130,246,0.35)"}
				cornerRadius={8}
				stroke={isSelected ? "#ea580c" : "#52525b"}
				strokeWidth={isSelected ? 2 : 1}
				dash={[6, 4]}
				draggable={interactive && !layer.locked}
				onClick={onSelect}
				onTap={onSelect}
				{...altDrag}
				onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
			/>
		);
	}

	return (
		<Image
			ref={setRef}
			image={videoEl}
			x={pos.x}
			y={pos.y}
			width={layer.width}
			height={layer.height}
			scaleX={pos.scaleX}
			scaleY={pos.scaleY}
			rotation={pos.rotation}
			opacity={pos.opacity}
			visible={layer.visible}
			draggable={interactive && !layer.locked}
			onClick={onSelect}
			onTap={onSelect}
			{...altDrag}
			onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
			onTransformEnd={(e) => {
				const node = e.target;
				const scaleX = node.scaleX();
				const scaleY = node.scaleY();
				onChange({
					x: node.x(),
					y: node.y(),
					width: Math.max(20, node.width() * scaleX),
					height: Math.max(20, node.height() * scaleY),
					rotation: node.rotation(),
				});
				node.scaleX(1);
				node.scaleY(1);
			}}
			stroke={isSelected ? "#ea580c" : undefined}
			strokeWidth={isSelected ? 2 : 0}
		/>
	);
}
