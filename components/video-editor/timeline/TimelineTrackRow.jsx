import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
	TIMELINE_TRACK_HEIGHT,
	getLayerClipDuration,
} from "@/lib/video-editor/timeline";
import { snapClipStartTime } from "@/lib/video-editor/timelineRows";
import { cn } from "@/lib/utils";
import LayerClip from "./LayerClip";

export default function TimelineTrackRow({
	rowId,
	rowIndex,
	clips,
	sceneId,
	pxPerSec,
	timelineDuration,
	selectedLayerIds,
	draggingLayerId,
	onSelect,
	onTimingEnd,
	onClipDragStart,
	onClipContextMenu,
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: rowId });

	return (
		<div
			ref={setNodeRef}
			data-timeline-row={rowIndex}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				height: TIMELINE_TRACK_HEIGHT,
			}}
			className={cn(
				"group/row relative border-b border-border/50 bg-background",
				isDragging && "opacity-70 z-20",
			)}
		>
			<button
				type="button"
				className={cn(
					"absolute left-0 top-0 bottom-0 z-20 flex w-6 items-center justify-center",
					"text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing",
					"opacity-0 group-hover/row:opacity-100 transition-opacity",
				)}
				{...attributes}
				{...listeners}
				onClick={(e) => e.stopPropagation()}
			>
				<GripVertical className="h-3.5 w-3.5" />
			</button>
			{clips.map((layer) => {
				const start = layer.startTime || 0;
				const dur = getLayerClipDuration(layer, timelineDuration);
				const clipLeft = start * pxPerSec;
				const clipWidth = Math.max(dur * pxPerSec, 20);
				return (
					<LayerClip
						key={layer.id}
						layer={layer}
						sceneId={sceneId}
						left={clipLeft}
						width={clipWidth}
						pxPerSec={pxPerSec}
						timelineDuration={timelineDuration}
						isSelected={selectedLayerIds.includes(layer.id)}
						isDragging={draggingLayerId === layer.id}
						onSelect={onSelect}
						onClipDragStart={onClipDragStart}
						onContextMenu={onClipContextMenu}
						onTimingEnd={(layerId, startTime, clipDuration) => {
							const snapped = snapClipStartTime(
								startTime,
								clipDuration,
								clips,
								layerId,
							);
							onTimingEnd(layerId, snapped, clipDuration);
						}}
					/>
				);
			})}
		</div>
	);
}
