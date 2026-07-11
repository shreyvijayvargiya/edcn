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
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	Clapperboard,
	Play,
	Pause,
	ZoomIn,
	ZoomOut,
	Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	selectLayer,
	toggleLayerSelection,
	setTimelineScrollAnchor,
	setTimelineZoom,
	updateLayerTiming,
	setCurrentTime,
	togglePlayback,
	setAudioUnlocked,
	setPlaying,
	splitLayerAtTime,
	swapTimelineRows,
	addLayer,
	duplicateLayer,
	copyLayer,
	pasteLayer,
	deleteLayer,
	toggleLayerVisibility,
	toggleLayerLock,
	updateLayerData,
	moveLayerZIndex,
} from "@/lib/store/slices/videoEditorSlice";
import {
	TIMELINE_TRACK_HEIGHT,
	getTimelineDuration,
} from "@/lib/video-editor/timeline";
import usePlaybackTick from "@/lib/video-editor/usePlaybackTick";
import {
	stepTimelineZoom,
	fitTimelinePxPerSec,
	scrollLeftForZoomAnchor,
	clampTimelinePxPerSec,
} from "@/lib/video-editor/timelineZoom";
import {
	groupLayersByRow,
	resolveClipDrop,
	readTimelineDragData,
	TIMELINE_DRAG_MIME,
} from "@/lib/video-editor/timelineRows";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { cn } from "@/lib/utils";
import TimelineAddStrip from "./TimelineAddStrip";
import TimelineAddObjectMenu from "./TimelineAddObjectMenu";
import TimelineClipContextMenu from "./TimelineClipContextMenu";
import { formatClock } from "./timeline/formatTime";
import PlayheadMarker from "./timeline/PlayheadMarker";
import TimelineTrackRow from "./timeline/TimelineTrackRow";

export default function Timeline() {
	const dispatch = useAppDispatch();
	const timelineRef = useRef(null);
	const trackScrollRef = useRef(null);
	const [timelineFocused, setTimelineFocused] = useState(false);
	const [contextMenu, setContextMenu] = useState(null);
	const [dropTarget, setDropTarget] = useState(null);
	const [isExternalDrag, setIsExternalDrag] = useState(false);
	const [clipDrag, setClipDrag] = useState(null);
	const clipDragRef = useRef(null);

	const { project, activeSceneId, selectedLayerIds, selectedLayerId, playback, pxPerSec, clipboardLayer } =
		useAppSelector((s) => s.videoEditor);

	usePlaybackTick();

	const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0] ?? null;
	const sceneId = activeScene?.id;
	const timelineDuration = getTimelineDuration(activeScene);

	const previewTime =
		playback.isRendering && playback.renderSnapshot
			? playback.renderSnapshot.localTime
			: (playback.previewLocalTime ?? playback.currentTime ?? 0);

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

	const applyTimelineZoom = useCallback(
		(mode, { pointerX } = {}) => {
			const oldPx = pxPerSec;
			let resolved = oldPx;

			if (mode === "fit") {
				resolved = fitTimelinePxPerSec(
					timelineDuration,
					trackScrollRef.current?.clientWidth ?? 600,
				);
			} else if (mode === "in") {
				resolved = stepTimelineZoom(oldPx, 1);
			} else if (mode === "out") {
				resolved = stepTimelineZoom(oldPx, -1);
			} else if (typeof mode === "number") {
				resolved = clampTimelinePxPerSec(mode);
			}

			if (resolved === oldPx && mode !== "fit") return oldPx;

			dispatch(setTimelineZoom(resolved));

			const el = trackScrollRef.current;
			if (el) {
				const rect = el.getBoundingClientRect();
				const px = pointerX ?? rect.left + rect.width / 2;
				el.scrollLeft = scrollLeftForZoomAnchor({
					scrollLeft: el.scrollLeft,
					pointerXInViewport: px - rect.left,
					anchorTimeSec: previewTime,
					oldPxPerSec: oldPx,
					newPxPerSec: resolved,
				});
			}

			return resolved;
		},
		[dispatch, pxPerSec, timelineDuration, previewTime],
	);

	const handleTimelineWheel = useCallback(
		(e) => {
			if (!e.ctrlKey && !e.metaKey) return;
			e.preventDefault();
			e.stopPropagation();

			const direction = e.deltaY > 0 ? -1 : 1;
			const oldPx = pxPerSec;
			const next = stepTimelineZoom(oldPx, direction);
			if (next === oldPx) return;

			dispatch(setTimelineZoom(next));

			const el = trackScrollRef.current;
			if (el) {
				const rect = el.getBoundingClientRect();
				el.scrollLeft = scrollLeftForZoomAnchor({
					scrollLeft: el.scrollLeft,
					pointerXInViewport: e.clientX - rect.left,
					anchorTimeSec: previewTime,
					oldPxPerSec: oldPx,
					newPxPerSec: next,
				});
			}
		},
		[dispatch, pxPerSec, previewTime],
	);

	useHotkeys(
		"mod+equal, mod+plus",
		(e) => {
			e.preventDefault();
			applyTimelineZoom("in");
		},
		{ enabled: timelineFocused && !playback.isRendering, enableOnFormTags: false },
		[timelineFocused, playback.isRendering, applyTimelineZoom],
	);

	useHotkeys(
		"mod+minus",
		(e) => {
			e.preventDefault();
			applyTimelineZoom("out");
		},
		{ enabled: timelineFocused && !playback.isRendering, enableOnFormTags: false },
		[timelineFocused, playback.isRendering, applyTimelineZoom],
	);

	useHotkeys(
		"mod+0",
		(e) => {
			e.preventDefault();
			applyTimelineZoom("fit");
			trackScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
		},
		{ enabled: timelineFocused && !playback.isRendering, enableOnFormTags: false },
		[timelineFocused, playback.isRendering, applyTimelineZoom],
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

	const scrollToTime = useCallback(
		(timeSec, behavior = "smooth") => {
			const scrollEl = trackScrollRef.current;
			if (!scrollEl) return;
			const x = timeSec * pxPerSec;
			const target = Math.max(0, x - scrollEl.clientWidth / 2);
			scrollEl.scrollTo({ left: target, behavior });
		},
		[pxPerSec],
	);

	const timelineWidth = timelineDuration * pxPerSec;
	const playheadX = previewTime * pxPerSec;

	const trackRows = useMemo(() => {
		if (!activeScene) return [];
		return groupLayersByRow(activeScene.layers);
	}, [activeScene]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const seekToTime = (e) => {
		if (!sceneId) return;
		if (playback.isPlaying) dispatch(setPlaying(false));

		const scrollEl = e.currentTarget.closest("[data-timeline-scroll]");
		const scrollLeft = scrollEl?.scrollLeft ?? 0;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left + scrollLeft;
		const t = Math.max(0, Math.min(x / pxPerSec, timelineDuration));

		dispatch(
			setCurrentTime({
				globalTime: t,
				sceneId,
				localTime: t,
			}),
		);
	};

	const onRowDragEnd = (event) => {
		const { active, over } = event;
		if (!over || active.id === over.id || !activeScene || !sceneId) return;
		const fromRow = trackRows.find((r) => r.rowId === active.id);
		const toRow = trackRows.find((r) => r.rowId === over.id);
		if (!fromRow || !toRow) return;
		dispatch(
			swapTimelineRows({
				sceneId,
				rowA: fromRow.rowIndex,
				rowB: toRow.rowIndex,
			}),
		);
	};

	const addFromDragPayload = useCallback(
		(payload, drop) => {
			if (!sceneId || !payload?.type) return;
			const overrides = {
				timelineRow: drop.rowIndex,
				startTime: drop.startTime,
			};

			if (payload.type === "text") {
				dispatch(
					addLayer({
						sceneId,
						type: "text",
						data: payload.data,
						overrides: {
							...overrides,
							y: CANVAS_HEIGHT / 2 - 50,
							width: CANVAS_WIDTH - 60,
							height: payload.data?.content?.includes("\n") ? 100 : 80,
						},
					}),
				);
			} else if (payload.type === "shape") {
				const size = payload.size ?? { width: 120, height: 120 };
				dispatch(
					addLayer({
						sceneId,
						type: "shape",
						data: payload.data,
						overrides: {
							...overrides,
							x: (CANVAS_WIDTH - size.width) / 2,
							y: (CANVAS_HEIGHT - size.height) / 2,
							width: size.width,
							height: size.height,
						},
					}),
				);
			} else if (payload.type === "icon") {
				const size = payload.data?.fontSize ?? 48;
				dispatch(
					addLayer({
						sceneId,
						type: "icon",
						data: payload.data,
						overrides: {
							...overrides,
							x: CANVAS_WIDTH / 2 - size / 2,
							y: CANVAS_HEIGHT / 2 - size / 2,
						},
					}),
				);
			} else if (payload.type === "ui") {
				const size = payload.size ?? { width: 280, height: 52 };
				dispatch(
					addLayer({
						sceneId,
						type: "ui",
						data: payload.data,
						overrides: {
							...overrides,
							x: Math.round((CANVAS_WIDTH - size.width) / 2),
							y: 200,
							width: size.width,
							height: size.height,
						},
					}),
				);
			}
		},
		[dispatch, sceneId],
	);

	const resolveDropAt = useCallback(
		(clientX, clientY, excludeLayerId, clipDuration) => {
			const el = trackScrollRef.current;
			if (!el) return null;
			const rect = el.getBoundingClientRect();
			return resolveClipDrop(
				trackRows,
				pxPerSec,
				el.scrollLeft,
				clientX,
				clientY,
				rect,
				clipDuration,
				excludeLayerId,
				TIMELINE_TRACK_HEIGHT,
			);
		},
		[trackRows, pxPerSec],
	);

	const beginClipDrag = useCallback(
		(e, layerId, clipDuration) => {
			const originX = e.clientX;
			const originY = e.clientY;
			let moved = false;

			const onMove = (ev) => {
				const dx = ev.clientX - originX;
				const dy = ev.clientY - originY;
				if (!moved && Math.hypot(dx, dy) < 4) return;
				moved = true;
				const target = resolveDropAt(ev.clientX, ev.clientY, layerId, clipDuration);
				clipDragRef.current = { layerId, clipDuration, dropTarget: target, moved: true };
				setClipDrag({ layerId, clipDuration, dropTarget: target });
			};

			const finish = (ev) => {
				window.removeEventListener("pointermove", onMove);
				window.removeEventListener("pointerup", finish);
				window.removeEventListener("pointercancel", finish);
				document.body.style.cursor = "";

				const drag = clipDragRef.current;
				clipDragRef.current = null;
				setClipDrag(null);

				if (!drag?.moved || !sceneId || !activeScene) return;

				const target = resolveDropAt(ev.clientX, ev.clientY, layerId, clipDuration);
				if (!target) return;

				const layer = activeScene.layers.find((l) => l.id === layerId);
				if (!layer) return;

				const sameRow = (layer.timelineRow ?? 0) === target.rowIndex;
				const sameTime = Math.abs((layer.startTime || 0) - target.startTime) < 0.05;
				if (sameRow && sameTime) return;

				dispatch(
					updateLayerTiming({
						sceneId,
						layerId,
						startTime: target.startTime,
						timelineRow: target.rowIndex,
					}),
				);
			};

			document.body.style.cursor = "grabbing";
			window.addEventListener("pointermove", onMove);
			window.addEventListener("pointerup", finish);
			window.addEventListener("pointercancel", finish);
		},
		[dispatch, sceneId, activeScene, resolveDropAt],
	);

	const activeDropTarget = clipDrag?.dropTarget ?? (isExternalDrag ? dropTarget : null);
	const activeDropLabel = clipDrag ? "Drop here" : "Drop to add";
	const activeDropWidth = clipDrag
		? Math.max(72, clipDrag.clipDuration * pxPerSec)
		: Math.max(72, pxPerSec * 2);

	const handleTimelineDragOver = (e) => {
		if (!e.dataTransfer.types.includes(TIMELINE_DRAG_MIME)) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
		setIsExternalDrag(true);
		const el = trackScrollRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const target = resolveClipDrop(
			trackRows,
			pxPerSec,
			el.scrollLeft,
			e.clientX,
			e.clientY,
			rect,
			2,
			null,
			TIMELINE_TRACK_HEIGHT,
		);
		setDropTarget(target);
	};

	const handleTimelineDrop = (e) => {
		e.preventDefault();
		const payload = readTimelineDragData(e.dataTransfer);
		const target = dropTarget;
		setDropTarget(null);
		setIsExternalDrag(false);
		if (payload && target) addFromDragPayload(payload, target);
	};

	const handleTimelineDragLeave = (e) => {
		if (!e.currentTarget.contains(e.relatedTarget)) {
			setDropTarget(null);
			setIsExternalDrag(false);
		}
	};

	const menuLayerId = contextMenu?.layerId ?? null;
	const selectedLayer = menuLayerId
		? activeScene?.layers.find((l) => l.id === menuLayerId) ?? null
		: null;

	const openClipContextMenu = useCallback(
		(e, layerId) => {
			e.preventDefault();
			e.stopPropagation();
			focusTimeline();
			if (layerId) dispatch(selectLayer(layerId));
			setContextMenu({ x: e.clientX, y: e.clientY, layerId });
		},
		[dispatch, focusTimeline],
	);

	useEffect(() => {
		const anchor = playback.timelineScrollAnchor;
		if (!anchor || !activeScene) return;
		if (anchor === "start") scrollToTime(0);
		else if (anchor === "end") scrollToTime(timelineDuration);
		else scrollToTime(previewTime);
		dispatch(setTimelineScrollAnchor(null));
	}, [
		playback.timelineScrollAnchor,
		activeScene,
		previewTime,
		timelineDuration,
		scrollToTime,
		dispatch,
	]);

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
				<div className="shrink-0 flex items-center gap-2 border-b-2 border-border px-3 py-2">
					<Clapperboard className="h-4 w-4 text-primary shrink-0" />
					<span className="text-xs font-bold text-foreground">Timeline</span>
					<span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
						Layers
					</span>
					<div className="flex-1" />
					<span className="text-[10px] font-semibold tabular-nums text-foreground shrink-0">
						{formatClock(previewTime)}
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
						title={playback.isPlaying ? "Pause (Space)" : "Play (Space)"}
					>
						{playback.isPlaying ? (
							<Pause className="h-3.5 w-3.5" />
						) : (
							<Play className="h-3.5 w-3.5 ml-0.5" />
						)}
					</Button>
					<span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
						{formatClock(timelineDuration)}
					</span>
					<div className="flex items-center gap-0.5 shrink-0 rounded-md border border-border bg-muted/20 p-0.5">
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-6 w-6"
							disabled={playback.isRendering}
							onClick={() => applyTimelineZoom("out")}
							title="Zoom out (⌘−)"
						>
							<ZoomOut className="h-3.5 w-3.5" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-6 w-6"
							disabled={playback.isRendering}
							onClick={() => {
								applyTimelineZoom("fit");
								trackScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
							}}
							title="Fit timeline (⌘0)"
						>
							<Maximize2 className="h-3.5 w-3.5" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-6 w-6"
							disabled={playback.isRendering}
							onClick={() => applyTimelineZoom("in")}
							title="Zoom in (⌘+)"
						>
							<ZoomIn className="h-3.5 w-3.5" />
						</Button>
					</div>
					<TimelineAddObjectMenu insertAt="end" variant="icon" align="end" />
				</div>

				<div
					className="relative flex flex-1 flex-col min-h-0 overflow-hidden"
					onWheel={handleTimelineWheel}
					onContextMenu={(e) => {
						e.preventDefault();
						focusTimeline();
						setContextMenu({ x: e.clientX, y: e.clientY });
					}}
				>
					<div
						ref={trackScrollRef}
						className="flex-1 min-h-0 overflow-auto relative px-3 pb-2 bg-card cursor-pointer"
						data-timeline-scroll
						onDragOver={handleTimelineDragOver}
						onDrop={handleTimelineDrop}
						onDragLeave={handleTimelineDragLeave}
						onClick={(e) => {
							focusTimeline();
							seekToTime(e);
							if (!e.ctrlKey && !e.metaKey) {
								dispatch(selectLayer(null));
							}
						}}
					>
						<div style={{ width: timelineWidth, minWidth: "100%" }}>
							<TimelineAddStrip insertAt="end" />
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								modifiers={[restrictToVerticalAxis]}
								onDragEnd={onRowDragEnd}
							>
								<SortableContext
									items={trackRows.map((r) => r.rowId)}
									strategy={verticalListSortingStrategy}
								>
									{trackRows.length === 0 ? (
										<div
											data-timeline-row={0}
											style={{ height: TIMELINE_TRACK_HEIGHT }}
											className="border-b border-border/50"
											aria-hidden
										/>
									) : (
										trackRows.map((row) => (
											<TimelineTrackRow
												key={row.rowId}
												rowId={row.rowId}
												rowIndex={row.rowIndex}
												clips={row.clips}
												sceneId={sceneId}
												pxPerSec={pxPerSec}
												timelineDuration={timelineDuration}
												selectedLayerIds={selectedLayerIds}
												draggingLayerId={clipDrag?.layerId ?? null}
												onSelect={handleLayerSelect}
												onClipContextMenu={openClipContextMenu}
												onClipDragStart={beginClipDrag}
												onTimingEnd={(layerId, startTime, clipDuration) =>
													dispatch(
														updateLayerTiming({
															sceneId,
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
							{activeDropTarget && (
								<div
									className="absolute z-40 pointer-events-none flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10"
									style={{
										left: activeDropTarget.startTime * pxPerSec,
										top: activeDropTarget.rowIndex * TIMELINE_TRACK_HEIGHT + 2,
										width: activeDropWidth,
										height: TIMELINE_TRACK_HEIGHT - 4,
									}}
								>
									<span className="text-[9px] font-bold text-primary px-1">
										{activeDropLabel}
									</span>
								</div>
							)}
							<TimelineAddStrip insertAt="start" />
						</div>
						<PlayheadMarker x={playheadX} time={previewTime} className="top-0 bottom-0" />
					</div>
				</div>
			</div>

			<TimelineClipContextMenu
				open={Boolean(contextMenu)}
				position={contextMenu ?? { x: 0, y: 0 }}
				scene={activeScene}
				layer={selectedLayer}
				playheadTime={previewTime}
				hasClipboard={Boolean(clipboardLayer)}
				onClose={() => setContextMenu(null)}
				onSplit={(layerId, atTime) => {
					if (!sceneId) return;
					dispatch(splitLayerAtTime({ sceneId, layerId, atTime }));
				}}
				onDuplicate={(layerId) => {
					if (!sceneId) return;
					dispatch(duplicateLayer({ sceneId, layerId }));
				}}
				onCopy={(layerId) => {
					if (!sceneId) return;
					dispatch(copyLayer({ sceneId, layerId }));
				}}
				onPaste={() => {
					if (!sceneId) return;
					dispatch(pasteLayer({ sceneId }));
				}}
				onToggleVisible={(layerId) => {
					if (!sceneId) return;
					dispatch(toggleLayerVisibility({ sceneId, layerId }));
				}}
				onToggleLock={(layerId) => {
					if (!sceneId) return;
					dispatch(toggleLayerLock({ sceneId, layerId }));
				}}
				onToggleMute={(layerId, muted) => {
					if (!sceneId || !selectedLayer) return;
					if (selectedLayer.type === "video" || selectedLayer.type === "audio") {
						dispatch(updateLayerData({ sceneId, layerId, data: { muted } }));
					}
				}}
				onBringToFront={(layerId) => {
					if (!sceneId) return;
					dispatch(moveLayerZIndex({ sceneId, layerId, direction: "front" }));
				}}
				onSendToBack={(layerId) => {
					if (!sceneId) return;
					dispatch(moveLayerZIndex({ sceneId, layerId, direction: "back" }));
				}}
				onDelete={(layerId) => {
					if (!sceneId) return;
					dispatch(deleteLayer({ sceneId, layerId }));
				}}
			/>
		</div>
	);
}
