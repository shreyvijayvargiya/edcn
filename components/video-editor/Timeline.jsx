import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
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
import { Plus, Clapperboard, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	setActiveScene,
	addScene,
	selectLayer,
	toggleLayerSelection,
	setTimelineScrollAnchor,
	resizeSceneDuration,
	updateLayerTiming,
	setCurrentTime,
	reorderLayers,
	togglePlayback,
	setAudioUnlocked,
} from "@/lib/store/slices/videoEditorSlice";
import {
	TRACK_META,
	TIMELINE_TRACK_HEIGHT,
	getTotalDuration,
	getLayerClipDuration,
	layerClipLabel,
	MIN_SCENE_DURATION,
	MIN_CLIP_DURATION,
} from "@/lib/video-editor/timeline";
import usePlaybackTick from "@/lib/video-editor/usePlaybackTick";
import { cn } from "@/lib/utils";
import TimelineAddStrip from "./TimelineAddStrip";
import TimelineAddObjectMenu from "./TimelineAddObjectMenu";
import TimelineLayerMenu from "./TimelineLayerMenu";

function formatPlayheadTime(seconds) {
	const t = Math.max(0, seconds ?? 0);
	return `${t.toFixed(1)}s`;
}

function formatClock(seconds) {
	const s = Math.max(0, Math.floor(seconds));
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Playhead line with hover tooltip — spans full height of its container */
function PlayheadMarker({ x, time, className }) {
	return (
		<div
			className={cn(
				"absolute top-0 bottom-0 z-30 group/playhead w-3 -translate-x-1/2 cursor-default",
				className,
			)}
			style={{ left: x }}
			title={formatPlayheadTime(time)}
		>
			<div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary" />
			<div
				className={cn(
					"absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none",
					"opacity-0 group-hover/playhead:opacity-100 transition-opacity duration-150",
				)}
			>
				<span className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary shadow-md whitespace-nowrap">
					{formatPlayheadTime(time)}
				</span>
			</div>
		</div>
	);
}

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

function SceneBlock({ scene, left, width, isActive, pxPerSec, onSelect, onResizeEnd }) {
	const onPointerDown = useDragResize((dx, start) => {
		const newDur = Math.max(MIN_SCENE_DURATION, start.duration + dx / start.pxPerSec);
		onResizeEnd(scene.id, newDur);
	});

	return (
		<div
			className={cn(
				"absolute top-1 bottom-1 border-2 flex items-center overflow-hidden cursor-pointer select-none",
				isActive
					? "border-primary bg-primary/20"
					: "border-border bg-secondary/80 hover:bg-secondary",
			)}
			style={{ left, width: Math.max(width, 24) }}
			onClick={onSelect}
		>
			<span className="text-[10px] font-bold truncate px-2 flex-1">{scene.name}</span>
			<span className="text-[9px] text-muted-foreground tabular-nums pr-2 shrink-0">
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
	sceneId,
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
				"group/chip absolute top-1 bottom-1 border-2 rounded-sm flex items-center overflow-hidden select-none text-[10px] font-semibold touch-none",
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
				onSelect(layer.id, e);
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
			<span className="truncate px-3 flex-1 min-w-0 pointer-events-none">
				{layerClipLabel(layer)}
			</span>
			<div
				className={cn(
					"relative z-20 shrink-0 mr-3 transition-opacity duration-150",
					"opacity-0 pointer-events-none group-hover/chip:opacity-100 group-hover/chip:pointer-events-auto",
					isSelected && "opacity-100 pointer-events-auto",
				)}
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
						clipDuration: getLayerClipDuration(layer, scene.duration),
					});
				}}
			/>
		</div>
	);
}

function SortableTrackRow({ layer, scene, sceneId, pxPerSec, isSelected, onSelect, onTimingEnd }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: layer.id });

	const start = layer.startTime || 0;
	const dur = getLayerClipDuration(layer, scene.duration);
	const clipLeft = start * pxPerSec;
	const clipWidth = Math.max(dur * pxPerSec, 20);

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				height: TIMELINE_TRACK_HEIGHT,
			}}
			className="group/row relative border-b border-border/50 bg-background"
		>
			<LayerClip
				layer={layer}
				scene={scene}
				sceneId={sceneId}
				left={clipLeft}
				width={clipWidth}
				pxPerSec={pxPerSec}
				isSelected={isSelected}
				isDragging={isDragging}
				onSelect={onSelect}
				onTimingEnd={onTimingEnd}
				sortableAttributes={attributes}
				sortableListeners={listeners}
			/>
			<div
				className={cn(
					"absolute top-1/2 z-30 -translate-y-1/2",
					"opacity-0 pointer-events-none transition-opacity duration-150",
					"group-hover/row:opacity-100 group-hover/row:pointer-events-auto",
				)}
				style={{ left: clipLeft + clipWidth + 6 }}
				onClick={(e) => e.stopPropagation()}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<TimelineAddObjectMenu insertAt="end" variant="chip" align="start" side="top" />
			</div>
		</div>
	);
}

export default function Timeline() {
	const dispatch = useAppDispatch();
	const timelineRef = useRef(null);
	const layerTrackScrollRef = useRef(null);
	const [timelineFocused, setTimelineFocused] = useState(false);
	const { project, activeSceneId, selectedLayerIds, playback, pxPerSec } =
		useAppSelector((s) => s.videoEditor);

	usePlaybackTick();

	const totalDuration = getTotalDuration(project.scenes);
	const displaySceneId =
		playback.isRendering && playback.renderSnapshot?.sceneId
			? playback.renderSnapshot.sceneId
			: activeSceneId;
	const activeScene = project.scenes.find((s) => s.id === displaySceneId);
	const layerPxPerSec = activeScene?.timelinePxPerSec ?? pxPerSec;

	useHotkeys(
		"space",
		(e) => {
			e.preventDefault();
			if (playback.isRendering) return;
			if (!playback.isPlaying) dispatch(setAudioUnlocked(true));
			dispatch(togglePlayback());
		},
		{
			enabled: timelineFocused && !playback.isRendering,
			enableOnFormTags: false,
		},
		[timelineFocused, playback.isPlaying, playback.isRendering, dispatch],
	);

	const handleTimelineKeyDown = useCallback(
		(e) => {
			if (e.key !== " " && e.code !== "Space") return;
			if (playback.isRendering) return;
			e.preventDefault();
			e.stopPropagation();
			if (!playback.isPlaying) dispatch(setAudioUnlocked(true));
			dispatch(togglePlayback());
		},
		[dispatch, playback.isPlaying, playback.isRendering],
	);

	const focusTimeline = useCallback(() => {
		timelineRef.current?.focus({ preventScroll: true });
	}, []);

	const handleLayerSelect = useCallback(
		(layerId, e) => {
			if (e.ctrlKey || e.metaKey) {
				dispatch(toggleLayerSelection(layerId));
			} else {
				dispatch(selectLayer(layerId));
			}
		},
		[dispatch],
	);

	const scrollLayerTrackToTime = useCallback(
		(timeSec, behavior = "smooth") => {
			const scrollEl = layerTrackScrollRef.current;
			if (!scrollEl) return;
			const x = timeSec * layerPxPerSec;
			const target = Math.max(0, x - scrollEl.clientWidth / 2);
			scrollEl.scrollTo({ left: target, behavior });
		},
		[layerPxPerSec],
	);

	const sceneTimelineWidth = Math.max(totalDuration * pxPerSec, 400);
	const trackWidth = Math.max((activeScene?.duration ?? 0) * layerPxPerSec, 400);
	const displayGlobalTime =
		playback.isRendering && playback.renderSnapshot
			? playback.renderSnapshot.globalTime
			: playback.currentTime;
	const displayLocalTime =
		playback.isRendering && playback.renderSnapshot
			? playback.renderSnapshot.localTime
			: playback.previewLocalTime || 0;

	useEffect(() => {
		const anchor = playback.timelineScrollAnchor;
		if (!anchor || !activeScene) return;
		if (anchor === "start") scrollLayerTrackToTime(0);
		else if (anchor === "end") scrollLayerTrackToTime(activeScene.duration);
		else scrollLayerTrackToTime(displayLocalTime);
		dispatch(setTimelineScrollAnchor(null));
	}, [
		playback.timelineScrollAnchor,
		activeScene,
		displayLocalTime,
		scrollLayerTrackToTime,
		dispatch,
	]);

	const globalPlayheadX = displayGlobalTime * pxPerSec;
	const localPlayheadX = displayLocalTime * layerPxPerSec;

	const displayLayers = useMemo(() => {
		if (!activeScene) return [];
		return [...activeScene.layers].reverse();
	}, [activeScene]);

	const sceneOffsets = useMemo(() => {
		let acc = 0;
		return project.scenes.map((s) => {
			const left = acc;
			acc += s.duration * pxPerSec;
			return { scene: s, left, width: s.duration * pxPerSec };
		});
	}, [project.scenes, pxPerSec]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const seekToTime = (e) => {
		const scrollEl = e.currentTarget.closest("[data-timeline-scroll]");
		const scrollLeft = scrollEl?.scrollLeft ?? 0;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left + scrollLeft;
		if (!activeScene) return;
		const local = Math.max(0, Math.min(x / layerPxPerSec, activeScene.duration));
		let acc = 0;
		for (const scene of project.scenes) {
			if (scene.id === activeSceneId) {
				dispatch(
					setCurrentTime({
						globalTime: acc + local,
						sceneId: scene.id,
						localTime: local,
					}),
				);
				return;
			}
			acc += scene.duration;
		}
	};

	const seekGlobal = (e) => {
		const scrollEl = e.currentTarget.closest("[data-timeline-scroll]");
		const scrollLeft = scrollEl?.scrollLeft ?? 0;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left + scrollLeft;
		const t = Math.max(0, Math.min(x / pxPerSec, totalDuration));
		let acc = 0;
		for (const scene of project.scenes) {
			if (t <= acc + scene.duration) {
				dispatch(setActiveScene(scene.id));
				dispatch(
					setCurrentTime({
						globalTime: t,
						sceneId: scene.id,
						localTime: t - acc,
					}),
				);
				return;
			}
			acc += scene.duration;
		}
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
		<div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none bg-background px-3 pb-3">
			<div
				ref={timelineRef}
				tabIndex={0}
				data-timeline-root
				onFocusCapture={() => setTimelineFocused(true)}
				onBlurCapture={(e) => {
					if (!timelineRef.current?.contains(e.relatedTarget)) {
						setTimelineFocused(false);
					}
				}}
				onKeyDownCapture={handleTimelineKeyDown}
				onMouseDown={(e) => {
					if (
						e.target.closest(
							"button, input, textarea, select, [role=menuitem], [data-radix-collection-item]",
						)
					) {
						return;
					}
					focusTimeline();
				}}
				className={cn(
					"pointer-events-auto max-w-7xl mx-auto flex flex-col h-60 overflow-hidden outline-none",
					"rounded-xl border-2 border-border bg-card shadow-2xl",
					timelineFocused && "ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
				)}
			>
				{/* Sidebar-style header */}
				<div className="shrink-0 flex items-center gap-2 border-b-2 border-border px-3 py-2">
					<Clapperboard className="h-4 w-4 text-primary shrink-0" />
					<span className="text-xs font-bold text-foreground">Timeline</span>
					<span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
						Scenes & layers
					</span>
					<div className="flex-1" />
					<span className="text-[10px] font-semibold tabular-nums text-foreground shrink-0">
						{formatClock(displayGlobalTime)}
					</span>
					<Button
						size="icon"
						variant="outline"
						className="h-7 w-7 shrink-0 rounded-full"
						disabled={playback.isRendering}
						onClick={() => {
							if (playback.isRendering) return;
							if (!playback.isPlaying) dispatch(setAudioUnlocked(true));
							dispatch(togglePlayback());
						}}
						title={
							playback.isRendering
								? "Rendering…"
								: playback.isPlaying
									? "Pause (Space)"
									: "Play (Space)"
						}
					>
						{playback.isPlaying ? (
							<Pause className="h-3.5 w-3.5" />
						) : (
							<Play className="h-3.5 w-3.5 ml-0.5" />
						)}
					</Button>
					<span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
						{formatClock(totalDuration)}
					</span>
					<TimelineAddObjectMenu insertAt="end" variant="icon" align="end" />
					<Button
						size="sm"
						variant="outline"
						className="shrink-0 h-7 text-xs gap-1"
						onClick={() => dispatch(addScene())}
					>
						<Plus className="h-3.5 w-3.5" />
						Scene
					</Button>
				</div>

				{/* Scene rail + layers */}
				<div className="relative flex flex-1 flex-col min-h-0 overflow-hidden">
					<div className="flex shrink-0 items-center gap-2 border-b border-border/80 px-3 py-1.5 bg-muted/15">
						<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 w-12">
							Scenes
						</span>
					<div
						className="flex-1 overflow-x-auto relative h-9 rounded-md border border-border/60 bg-background/80 cursor-pointer"
						data-timeline-scroll
						onClick={(e) => {
							focusTimeline();
							seekGlobal(e);
						}}
						>
							<div
								className="relative h-full"
								style={{ width: sceneTimelineWidth, minWidth: "100%" }}
							>
								{sceneOffsets.map(({ scene, left, width }) => (
									<SceneBlock
										key={scene.id}
										scene={scene}
										left={left}
										width={width}
										pxPerSec={pxPerSec}
										isActive={scene.id === activeSceneId}
										onSelect={() => dispatch(setActiveScene(scene.id))}
										onResizeEnd={(id, dur) =>
											dispatch(resizeSceneDuration({ sceneId: id, duration: dur }))
										}
									/>
								))}
								<PlayheadMarker
									x={globalPlayheadX}
									time={displayGlobalTime}
								/>
							</div>
						</div>
					</div>

					<div
						ref={layerTrackScrollRef}
						className="flex-1 min-h-0 overflow-auto relative px-3 pb-2 bg-card"
						data-timeline-scroll
						onClick={(e) => {
							focusTimeline();
							seekToTime(e);
							if (!e.ctrlKey && !e.metaKey) {
								dispatch(selectLayer(null));
							}
						}}
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
												sceneId={activeSceneId}
												pxPerSec={layerPxPerSec}
												isSelected={selectedLayerIds.includes(layer.id)}
												onSelect={handleLayerSelect}
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
						<PlayheadMarker
							x={localPlayheadX}
							time={displayLocalTime}
							className="top-0 bottom-0"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
