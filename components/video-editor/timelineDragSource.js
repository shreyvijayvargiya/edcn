import { setTimelineDragData } from "@/lib/video-editor/timelineRows";

/** Spread onto left-panel items to drag onto the timeline. */
export function timelineDragProps(payload) {
	return {
		draggable: true,
		onDragStart: (e) => {
			setTimelineDragData(e.dataTransfer, payload);
			e.dataTransfer.effectAllowed = "copy";
		},
	};
}
