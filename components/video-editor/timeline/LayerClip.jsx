import { Lock, VolumeX } from "lucide-react";
import {
	TRACK_META,
	getLayerClipDuration,
	layerClipLabel,
	MIN_CLIP_DURATION,
} from "@/lib/video-editor/timeline";
import { cn } from "@/lib/utils";
import TimelineLayerMenu from "../TimelineLayerMenu";
import useDragResize from "./useDragResize";

export default function LayerClip({
	layer,
	sceneId,
	left,
	width,
	isSelected,
	pxPerSec,
	timelineDuration,
	onSelect,
	onTimingEnd,
	onClipDragStart,
	onContextMenu,
	isDragging,
}) {
	const meta = TRACK_META[layer.type] || TRACK_META.shape;
	const clipDuration = getLayerClipDuration(layer, timelineDuration);
	const isMuted =
		(layer.type === "video" || layer.type === "audio") && Boolean(layer.data?.muted);

	const onMovePointerDown = useDragResize((dx, start) => {
		const newStart = Math.max(0, start.startTime + dx / pxPerSec);
		onTimingEnd(layer.id, newStart, start.clipDuration);
	});

	const onResizePointerDown = useDragResize((dx, start) => {
		const newDur = Math.max(MIN_CLIP_DURATION, start.clipDuration + dx / pxPerSec);
		onTimingEnd(layer.id, start.startTime, newDur);
	});

	return (
		<div
			className={cn(
				"group/chip absolute top-1 bottom-1 border-2 rounded-sm flex items-center overflow-hidden select-none text-[10px] font-semibold",
				meta.color,
				meta.border,
				meta.text,
				isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
				!layer.visible && "opacity-40",
				layer.locked && "opacity-80",
				isDragging ? "opacity-30 z-10" : "z-[1]",
			)}
			style={{ left, width: Math.max(width, 20) }}
			onClick={(e) => {
				e.stopPropagation();
				onSelect(layer.id, e);
			}}
			onContextMenu={(e) => onContextMenu?.(e, layer.id)}
		>
			<div
				className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/10 z-10"
				onPointerDown={(e) => {
					e.stopPropagation();
					onMovePointerDown(e, {
						startTime: layer.startTime || 0,
						clipDuration,
					});
				}}
			/>
			<div
				className="flex-1 min-w-0 h-full flex items-center gap-1 cursor-grab active:cursor-grabbing px-3"
				onPointerDown={(e) => {
					if (e.target.closest("[data-no-drag]")) return;
					e.stopPropagation();
					onClipDragStart?.(e, layer.id, clipDuration);
				}}
			>
				<span className="truncate pointer-events-none">{layerClipLabel(layer)}</span>
				{layer.locked ? (
					<Lock className="h-3 w-3 shrink-0 pointer-events-none opacity-80" />
				) : null}
				{isMuted ? (
					<VolumeX className="h-3 w-3 shrink-0 pointer-events-none opacity-80" />
				) : null}
			</div>
			<div
				className={cn(
					"relative z-20 shrink-0 mr-1 transition-opacity duration-150",
					"opacity-0 pointer-events-none group-hover/chip:opacity-100 group-hover/chip:pointer-events-auto",
					isSelected && "opacity-100 pointer-events-auto",
				)}
				data-no-drag
				onClick={(e) => e.stopPropagation()}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<TimelineLayerMenu sceneId={sceneId} layerId={layer.id} />
			</div>
			<div
				className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/20 z-10"
				onPointerDown={(e) => {
					e.stopPropagation();
					onResizePointerDown(e, {
						startTime: layer.startTime || 0,
						clipDuration,
					});
				}}
			/>
		</div>
	);
}
