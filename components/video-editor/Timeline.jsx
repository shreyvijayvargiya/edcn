import { useRef, useCallback, useMemo } from "react";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	selectLayer,
	resizeSceneDuration,
	updateLayerTiming,
	setCurrentTime,
	reorderLayers,
} from "@/lib/store/slices/videoEditorSlice";
import {
	TRACK_META,
	TIMELINE_TRACK_HEIGHT,
	getLayerClipDuration,
	layerClipLabel,
	MIN_SCENE_DURATION,
	MIN_CLIP_DURATION,
} from "@/lib/video-editor/timeline";
import { cn } from "@/lib/utils";
import TimelineAddStrip from "./TimelineAddStrip";

function useDragResize(onEnd) {
	const startRef = useRef(null);

	const onPointerDown = useCallback(
		(e, initial) => {
			e.stopPropagation();
			e.preventDefault();
			startRef.current = { x: e.clientX, ...initial };
			const onUp = (ev) => {
				const dx = ev.clientX - startRef.current.x;
				onEnd(dx, startRef.current);
				window.removeEventListener("pointerup", onUp);
				startRef.current = null;
			};
			window.addEventListener("pointerup", onUp);
		},
		[onEnd],
	);

	return onPointerDown;
}

function TimeRuler({ totalWidth, totalDuration, pxPerSec, playheadX }) {
	const marks = [];
	const step = totalDuration > 30 ? 5 : totalDuration > 15 ? 2 : 1;
	for (let t = 0; t <= totalDuration; t += step) {
		marks.push(t);
	}

	return (
		<div className="relative h-6 border-b-2 border-border bg-muted/30" style={{ width: totalWidth }}>
			{marks.map((t) => (
				<div
					key={t}
					className="absolute top-0 h-full border-l border-border/60"
					style={{ left: t * pxPerSec }}
				>
					<span className="absolute top-0.5 left-1 text-[9px] text-muted-foreground tabular-nums">
						{t}s
					</span>
				</div>
			))}
			<div
				className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
				style={{ left: playheadX }}
			/>
		</div>
	);
}

function SceneDurationBar({ scene, width, pxPerSec, onResizeEnd }) {
	const onPointerDown = useDragResize((dx, start) => {
		const newDur = Math.max(MIN_SCENE_DURATION, start.duration + dx / start.pxPerSec);
		onResizeEnd(scene.id, newDur);
	});

	return (
		<div
			className="relative h-8 border-b-2 border-border bg-muted/20 flex items-center px-2 shrink-0"
			style={{ width: Math.max(width, 400), minWidth: "100%" }}
		>
			<span className="text-[10px] font-bold truncate flex-1">{scene.name}</span>
			<span className="text-[9px] text-muted-foreground tabular-nums shrink-0 mr-2">
				{scene.duration.toFixed(1)}s
			</span>
			<div
				className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-primary/40 hover:bg-primary/70"
				onPointerDown={(e) =>
					onPointerDown(e, { duration: scene.duration, pxPerSec })
				}
			/>
		</div>
	);
}

function LayerClip({
	layer,
	scene,
	left,
	width,
	isSelected,
	pxPerSec,
	onSelect,
	onTimingEnd,
	sortableListeners,
	sortableAttributes,
	isDragging,
}) {
	const meta = TRACK_META[layer.type] || TRACK_META.shape;
	const onMovePointerDown = useDragResize((dx, start) => {
		const newStart = Math.max(
			0,
			Math.min(start.startTime + dx / pxPerSec, scene.duration - MIN_CLIP_DURATION),
		);
		onTimingEnd(layer.id, newStart, start.clipDuration);
	});
	const onResizePointerDown = useDragResize((dx, start) => {
		const newDur = Math.max(
			MIN_CLIP_DURATION,
			Math.min(start.clipDuration + dx / pxPerSec, scene.duration - start.startTime),
		);
		onTimingEnd(layer.id, start.startTime, newDur);
	});

	return (
		<div
			{...sortableAttributes}
			{...sortableListeners}
			className={cn(
				"absolute top-1 bottom-1 border-2 rounded-sm flex items-center overflow-hidden select-none text-[10px] font-semibold touch-none",
				meta.color,
				meta.border,
				meta.text,
				isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
				!layer.visible && "opacity-40",
				isDragging ? "cursor-grabbing opacity-60 z-10" : "cursor-grab",
			)}
			style={{ left, width: Math.max(width, 20) }}
			onClick={(e) => {
				e.stopPropagation();
				onSelect(layer.id);
			}}
		>
			<div
				className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/10 z-10"
				onPointerDown={(e) => {
					e.stopPropagation();
					onMovePointerDown(e, {
						startTime: layer.startTime || 0,
						clipDuration: getLayerClipDuration(layer, scene.duration),
					});
				}}
			/>
			<span className="truncate px-3 flex-1 pointer-events-none">{layerClipLabel(layer)}</span>
			<div
				className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/20 z-10"
				onPointerDown={(e) => {
					e.stopPropagation();
					onResizePointerDown(e, {
						startTime: layer.startTime || 0,
						clipDuration: getLayerClipDuration(layer, scene.duration),
					});
				}}
			/>
		</div>
	);
}

function SortableTrackRow({ layer, scene, pxPerSec, isSelected, onSelect, onTimingEnd }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: layer.id });

	const start = layer.startTime || 0;
	const dur = getLayerClipDuration(layer, scene.duration);

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				height: TIMELINE_TRACK_HEIGHT,
			}}
			className="relative border-b border-border/50 bg-background"
		>
			<LayerClip
				layer={layer}
				scene={scene}
				left={start * pxPerSec}
				width={dur * pxPerSec}
				pxPerSec={pxPerSec}
				isSelected={isSelected}
				isDragging={isDragging}
				onSelect={onSelect}
				onTimingEnd={onTimingEnd}
				sortableAttributes={attributes}
				sortableListeners={listeners}
			/>
		</div>
	);
}

export default function Timeline() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId, selectedLayerId, playback, pxPerSec } =
		useAppSelector((s) => s.videoEditor);

	const activeScene = project.scenes.find((s) => s.id === activeSceneId);
	const trackWidth = Math.max((activeScene?.duration ?? 0) * pxPerSec, 400);
	const localPlayheadX = (playback.previewLocalTime || 0) * pxPerSec;

	const displayLayers = useMemo(() => {
		if (!activeScene) return [];
		return [...activeScene.layers].reverse();
	}, [activeScene]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const seekToTime = (e) => {
		const scrollEl = e.currentTarget.closest("[data-timeline-scroll]");
		const scrollLeft = scrollEl?.scrollLeft ?? 0;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left + scrollLeft;
		if (!activeScene) return;
		const local = Math.max(0, Math.min(x / pxPerSec, activeScene.duration));
		dispatch(
			setCurrentTime({
				globalTime: local,
				sceneId: activeScene.id,
				localTime: local,
			}),
		);
	};

	const onLayerDragEnd = (event) => {
		const { active, over } = event;
		if (!over || active.id === over.id || !activeScene) return;
		const oldIndex = displayLayers.findIndex((l) => l.id === active.id);
		const newIndex = displayLayers.findIndex((l) => l.id === over.id);
		const reordered = arrayMove(displayLayers, oldIndex, newIndex);
		dispatch(
			reorderLayers({
				sceneId: activeSceneId,
				layers: [...reordered].reverse(),
			}),
		);
	};

	return (
		<div className="h-56 shrink-0 border-t-2 border-border bg-card flex flex-col">
			{activeScene && (
				<div className="overflow-x-auto shrink-0" data-timeline-scroll>
					<SceneDurationBar
						scene={activeScene}
						width={trackWidth}
						pxPerSec={pxPerSec}
						onResizeEnd={(id, dur) =>
							dispatch(resizeSceneDuration({ sceneId: id, duration: dur }))
						}
					/>
				</div>
			)}

			<div className="flex border-b-2 border-border shrink-0 items-center">
				<div className="flex-1 overflow-x-auto" data-timeline-scroll>
					<TimeRuler
						totalWidth={trackWidth}
						totalDuration={activeScene?.duration ?? 0}
						pxPerSec={pxPerSec}
						playheadX={localPlayheadX}
					/>
				</div>
			</div>

			<div
				className="flex-1 min-h-0 overflow-auto relative"
				data-timeline-scroll
				onClick={seekToTime}
			>
				<div style={{ width: trackWidth, minWidth: "100%" }}>
					<TimelineAddStrip insertAt="end" />
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragEnd={onLayerDragEnd}
					>
						<SortableContext
							items={displayLayers.map((l) => l.id)}
							strategy={verticalListSortingStrategy}
						>
							{displayLayers.length === 0 ? (
								<div style={{ height: TIMELINE_TRACK_HEIGHT }} aria-hidden />
							) : (
								displayLayers.map((layer) => (
									<SortableTrackRow
										key={layer.id}
										layer={layer}
										scene={activeScene}
										pxPerSec={pxPerSec}
										isSelected={layer.id === selectedLayerId}
										onSelect={(id) => dispatch(selectLayer(id))}
										onTimingEnd={(layerId, startTime, clipDuration) =>
											dispatch(
												updateLayerTiming({
													sceneId: activeSceneId,
													layerId,
													startTime,
													clipDuration,
												}),
											)
										}
									/>
								))
							)}
						</SortableContext>
					</DndContext>
					<TimelineAddStrip insertAt="start" />
				</div>
				<div
					className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
					style={{ left: localPlayheadX }}
				/>
			</div>
		</div>
	);
}
