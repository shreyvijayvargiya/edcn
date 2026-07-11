import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Loader2, Play, RotateCcw, Download, X } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	setCurrentTime,
	setPlaying,
	setRendering,
} from "@/lib/store/slices/videoEditorSlice";
import {
	renderProjectExport,
	downloadBlob,
	exportFilename,
} from "@/lib/video-editor/render";
import { getTotalDuration } from "@/lib/video-editor/timeline";
import { useStageRef } from "./StageRefContext";
import ExportFormatControls from "./ExportFormatControls";
import { cn } from "@/lib/utils";

/** Survives modal close — only invalidated when previewContentVersion / format changes. */
let previewCache = {
	key: null,
	url: null,
	ext: null,
};

function buildPreviewCacheKey(contentVersion, format, gifStart, gifEnd) {
	const range =
		format === "gif" ? `${Number(gifStart) || 0}:${Number(gifEnd) || 0}` : "-";
	return `v${contentVersion}|${format}|${range}`;
}

function storePreviewCache(key, blob, ext) {
	if (previewCache.url) {
		URL.revokeObjectURL(previewCache.url);
	}
	const url = URL.createObjectURL(blob);
	previewCache = { key, url, ext };
	return url;
}

function progressLabel(progress) {
	if (!progress) return "Preparing…";
	if (progress.phase === "preparing") return "Preparing media…";
	if (progress.phase === "finalizing") return "Finalizing…";
	if (progress.phase === "done") return "Done";
	const pct = Math.round((progress.progress ?? 0) * 100);
	if (progress.totalFrames) {
		return `Encoding ${progress.frame}/${progress.totalFrames} · ${pct}%`;
	}
	return `Encoding · ${pct}%`;
}

export default function PreviewVideoModal({ open, onOpenChange }) {
	const dispatch = useAppDispatch();
	const stageRef = useStageRef();
	const { project, playback, previewContentVersion } = useAppSelector(
		(s) => s.videoEditor,
	);
	const canvasW = project.canvas?.width ?? 360;
	const canvasH = project.canvas?.height ?? 640;
	const totalDuration = getTotalDuration(project.scenes);

	const [format, setFormat] = useState("mp4");
	const [gifStart, setGifStart] = useState(0);
	const [gifEnd, setGifEnd] = useState(Math.min(5, totalDuration || 5));
	const [previewUrl, setPreviewUrl] = useState(null);
	const [previewExt, setPreviewExt] = useState("mp4");
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState(null);
	const [error, setError] = useState(null);
	const [fromCache, setFromCache] = useState(false);
	const videoRef = useRef(null);
	const renderTokenRef = useRef(0);
	const abortRef = useRef(null);
	const projectRef = useRef(project);
	projectRef.current = project;

	const cacheKey = buildPreviewCacheKey(
		previewContentVersion,
		format,
		gifStart,
		gifEnd,
	);

	const cancelRender = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		renderTokenRef.current += 1;
		setLoading(false);
		setProgress(null);
		dispatch(setRendering(false));
		dispatch(setPlaying(false));
	}, [dispatch]);

	const showCached = useCallback((key) => {
		if (previewCache.key !== key || !previewCache.url) return false;
		setPreviewUrl(previewCache.url);
		setPreviewExt(previewCache.ext || "mp4");
		setError(null);
		setLoading(false);
		setProgress(null);
		setFromCache(true);
		return true;
	}, []);

	const encodePreview = useCallback(
		async (key) => {
			if (!stageRef?.current) {
				setError("Canvas not ready — wait for the editor to load.");
				return;
			}

			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			const token = ++renderTokenRef.current;
			const projectSnapshot = projectRef.current;
			const useFormat = format;
			const rangeStart = useFormat === "gif" ? gifStart : 0;
			const rangeEnd = useFormat === "gif" ? gifEnd : undefined;

			setLoading(true);
			setProgress({ phase: "preparing", progress: 0 });
			setError(null);
			setFromCache(false);
			setPreviewUrl(null);

			dispatch(setPlaying(false));
			dispatch(setRendering(true));

			try {
				const { blob, ext } = await renderProjectExport(
					stageRef,
					projectSnapshot,
					(globalTime, sceneId, localTime) => {
						flushSync(() => {
							dispatch(setCurrentTime({ globalTime, sceneId, localTime }));
						});
					},
					{
						format: useFormat,
						startTime: rangeStart,
						endTime: rangeEnd,
						signal: controller.signal,
						onProgress: (p) => {
							if (token === renderTokenRef.current) setProgress(p);
						},
					},
				);

				if (token !== renderTokenRef.current) return;

				const url = storePreviewCache(key, blob, ext);
				setPreviewExt(ext);
				setPreviewUrl(url);
				setFromCache(false);
			} catch (err) {
				if (token !== renderTokenRef.current) return;
				if (err?.name === "AbortError") {
					setError(null);
					showCached(key);
				} else {
					setError(err?.message || "Preview render failed.");
				}
			} finally {
				if (token === renderTokenRef.current) {
					setLoading(false);
					setProgress(null);
					dispatch(setRendering(false));
					dispatch(setPlaying(false));
				}
				if (abortRef.current === controller) abortRef.current = null;
			}
		},
		[dispatch, stageRef, format, gifStart, gifEnd, showCached],
	);

	/** Only encode when cache is missing/stale — never because the modal toggled. */
	const ensurePreview = useCallback(
		(force = false) => {
			if (!force && showCached(cacheKey)) return;
			encodePreview(cacheKey);
		},
		[cacheKey, showCached, encodePreview],
	);

	// Modal opened OR content/format changed while open → ensure preview
	useEffect(() => {
		if (!open) return;
		ensurePreview(false);
	}, [open, cacheKey, ensurePreview]);

	// Modal closed → abort in-flight encode, keep cache
	useEffect(() => {
		if (open) return;
		abortRef.current?.abort();
		abortRef.current = null;
		renderTokenRef.current += 1;
		setLoading(false);
		setProgress(null);
		setError(null);
		videoRef.current?.pause();
		dispatch(setRendering(false));
		dispatch(setPlaying(false));
	}, [open, dispatch]);

	useEffect(() => {
		if (open && totalDuration > 0 && gifEnd > totalDuration) {
			setGifEnd(totalDuration);
		}
	}, [open, totalDuration, gifEnd]);

	const displayScale = (() => {
		if (typeof window === "undefined") return 1;
		const maxW = Math.min(window.innerWidth * 0.88 - 48, canvasW);
		const maxH = Math.min(window.innerHeight * 0.72 - 160, canvasH);
		return Math.min(1, maxW / canvasW, maxH / canvasH);
	})();

	const displayW = Math.round(canvasW * displayScale);
	const displayH = Math.round(canvasH * displayScale);
	const isGif = previewExt === "gif" || format === "gif";
	const pct = Math.round((progress?.progress ?? 0) * 100);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next && loading) cancelRender();
				onOpenChange(next);
			}}
		>
			<DialogContent className="sm:max-w-none w-auto max-w-[calc(100vw-1.5rem)]">
				<DialogHeader>
					<DialogTitle>Export preview</DialogTitle>
					<DialogDescription>
						Rendered at {canvasW} × {canvasH}px — re-encodes only when the project
						changes
					</DialogDescription>
				</DialogHeader>

				<ExportFormatControls
					format={format}
					onFormatChange={setFormat}
					startTime={gifStart}
					endTime={gifEnd}
					onStartTimeChange={setGifStart}
					onEndTimeChange={setGifEnd}
					maxDuration={totalDuration}
					disabled={loading || playback.isRendering}
				/>

				<div className="flex flex-col items-center gap-4">
					<div
						className={cn(
							"relative flex items-center justify-center overflow-hidden",
							"rounded-lg border-2 border-border bg-black shadow-inner",
						)}
						style={{ width: displayW, height: displayH }}
					>
						{loading && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 text-muted-foreground z-10 px-6">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<span className="text-xs font-medium text-center">
									{progressLabel(progress)}
								</span>
								<div className="w-full max-w-[200px] h-1.5 rounded-full bg-muted overflow-hidden">
									<div
										className="h-full bg-primary transition-[width] duration-150 ease-out"
										style={{ width: `${Math.max(2, pct)}%` }}
									/>
								</div>
								<Button
									size="sm"
									variant="outline"
									className="h-7 gap-1 mt-1"
									onClick={cancelRender}
								>
									<X className="h-3.5 w-3.5" />
									Cancel
								</Button>
							</div>
						)}

						{error && !loading && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center z-10">
								<p className="text-sm text-destructive">{error}</p>
								<Button size="sm" variant="outline" onClick={() => ensurePreview(true)}>
									<RotateCcw className="h-4 w-4" />
									Retry
								</Button>
							</div>
						)}

						{previewUrl && !loading && isGif && (
							<img
								src={previewUrl}
								alt="GIF preview"
								className="h-full w-full object-contain"
								style={{ width: displayW, height: displayH }}
							/>
						)}

						{previewUrl && !loading && !isGif && (
							<video
								ref={videoRef}
								src={previewUrl}
								className="h-full w-full object-contain"
								style={{ width: displayW, height: displayH }}
								controls
								autoPlay
								playsInline
							/>
						)}
					</div>

					<div className="flex flex-wrap items-center justify-center gap-2">
						<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground tabular-nums">
							{canvasW} × {canvasH} · {format.toUpperCase()}
							{fromCache ? " · cached" : ""}
						</span>
						{previewUrl && !loading && !isGif && (
							<Button
								size="sm"
								variant="outline"
								className="h-8 gap-1.5"
								onClick={() => {
									const v = videoRef.current;
									if (v) {
										v.currentTime = 0;
										v.play();
									}
								}}
							>
								<Play className="h-3.5 w-3.5" />
								Replay
							</Button>
						)}
						<Button
							size="sm"
							variant="outline"
							className="h-8"
							onClick={() => ensurePreview(true)}
							disabled={loading || playback.isRendering}
						>
							<RotateCcw className="h-3.5 w-3.5" />
							Re-render
						</Button>
						{previewUrl && !loading && (
							<Button
								size="sm"
								className="h-8 gap-1.5"
								onClick={() => {
									fetch(previewUrl)
										.then((r) => r.blob())
										.then((blob) =>
											downloadBlob(blob, exportFilename(project.name, previewExt)),
										);
								}}
							>
								<Download className="h-3.5 w-3.5" />
								Download
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
