import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Play, RotateCcw, Download } from "lucide-react";
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

export default function PreviewVideoModal({ open, onOpenChange }) {
	const dispatch = useAppDispatch();
	const stageRef = useStageRef();
	const { project, playback } = useAppSelector((s) => s.videoEditor);
	const canvasW = project.canvas?.width ?? 360;
	const canvasH = project.canvas?.height ?? 640;
	const totalDuration = getTotalDuration(project.scenes);

	const [format, setFormat] = useState("mp4");
	const [gifStart, setGifStart] = useState(0);
	const [gifEnd, setGifEnd] = useState(Math.min(5, totalDuration || 5));
	const [previewUrl, setPreviewUrl] = useState(null);
	const [previewExt, setPreviewExt] = useState("mp4");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const videoRef = useRef(null);
	const renderTokenRef = useRef(0);
	const previewUrlRef = useRef(null);

	const clearPreviewUrl = useCallback(() => {
		if (previewUrlRef.current) {
			URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = null;
		}
		setPreviewUrl(null);
	}, []);

	const renderPreview = useCallback(async () => {
		if (!stageRef?.current) {
			setError("Canvas not ready — wait for the editor to load.");
			return;
		}

		const token = ++renderTokenRef.current;
		setLoading(true);
		setError(null);
		clearPreviewUrl();

		dispatch(setPlaying(false));
		dispatch(setRendering(true));

		try {
			const { blob, ext } = await renderProjectExport(
				stageRef,
				project,
				(globalTime, sceneId, localTime) =>
					dispatch(setCurrentTime({ globalTime, sceneId, localTime })),
				{
					format,
					startTime: format === "gif" ? gifStart : 0,
					endTime: format === "gif" ? gifEnd : undefined,
				},
			);

			if (token !== renderTokenRef.current) return;

			const url = URL.createObjectURL(blob);
			previewUrlRef.current = url;
			setPreviewExt(ext);
			setPreviewUrl(url);
		} catch (err) {
			if (token !== renderTokenRef.current) return;
			setError(err?.message || "Preview render failed.");
		} finally {
			if (token === renderTokenRef.current) {
				setLoading(false);
				dispatch(setRendering(false));
				dispatch(setPlaying(false));
			}
		}
	}, [dispatch, project, clearPreviewUrl, stageRef, format, gifStart, gifEnd]);

	useEffect(() => {
		if (!open) return;
		renderPreview();
		// Re-render when modal opens or format changes; GIF range uses Re-render button
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, format]);

	useEffect(() => {
		if (open && totalDuration > 0 && gifEnd > totalDuration) {
			setGifEnd(totalDuration);
		}
	}, [open, totalDuration, gifEnd]);

	useEffect(() => {
		if (open) return;
		renderTokenRef.current += 1;
		setLoading(false);
		setError(null);
		clearPreviewUrl();
		videoRef.current?.pause();
		dispatch(setRendering(false));
		dispatch(setPlaying(false));
	}, [open, clearPreviewUrl, dispatch]);

	const displayScale = (() => {
		if (typeof window === "undefined") return 1;
		const maxW = Math.min(window.innerWidth * 0.88 - 48, canvasW);
		const maxH = Math.min(window.innerHeight * 0.72 - 160, canvasH);
		return Math.min(1, maxW / canvasW, maxH / canvasH);
	})();

	const displayW = Math.round(canvasW * displayScale);
	const displayH = Math.round(canvasH * displayScale);
	const isGif = previewExt === "gif" || format === "gif";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-none w-auto max-w-[calc(100vw-1.5rem)]">
				<DialogHeader>
					<DialogTitle>Export preview</DialogTitle>
					<DialogDescription>
						Rendered at {canvasW} × {canvasH}px — choose format below
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
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-muted-foreground z-10">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<span className="text-xs font-medium">
									Rendering {format.toUpperCase()}…
								</span>
							</div>
						)}

						{error && !loading && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center z-10">
								<p className="text-sm text-destructive">{error}</p>
								<Button size="sm" variant="outline" onClick={renderPreview}>
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
							onClick={renderPreview}
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
