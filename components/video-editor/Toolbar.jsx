import { useState } from "react";
import { flushSync } from "react-dom";
import {
	Undo2,
	Redo2,
	Clapperboard,
	Play,
	Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	setProjectName,
	setCurrentTime,
	setPlaying,
	setRendering,
	setAudioUnlocked,
	setCanvasDimensions,
	undo,
	redo,
} from "@/lib/store/slices/videoEditorSlice";
import {
	renderProjectExport,
	downloadBlob,
	exportFilename,
} from "@/lib/video-editor/render";
import { getTotalDuration } from "@/lib/video-editor/timeline";
import { useStageRef } from "./StageRefContext";
import FrameDimensionSelect from "./FrameDimensionSelect";
import ThemeToggle from "@/components/theme/ThemeToggle";
import PreviewVideoModal from "./PreviewVideoModal";
import ExportMenu from "./ExportMenu";

export default function Toolbar({ onOpenCommandSearch }) {
	const dispatch = useAppDispatch();
	const stageRef = useStageRef();
	const { project, playback, history } = useAppSelector((s) => s.videoEditor);
	const [previewOpen, setPreviewOpen] = useState(false);
	const totalDuration = getTotalDuration(project.scenes);
	const [gifStart, setGifStart] = useState(0);
	const [gifEnd, setGifEnd] = useState(Math.min(5, totalDuration || 5));

	const canUndo = history.past.length > 0;
	const canRedo = history.future.length > 0;
	const historyBlocked = playback.isPlaying || playback.isRendering;
	const exportBlocked = playback.isRendering || playback.isPlaying;

	const runExport = async (format) => {
		if (!stageRef?.current) {
			alert("Canvas not ready — wait for preview to load.");
			return;
		}
		dispatch(setPlaying(false));
		dispatch(setAudioUnlocked(true));
		dispatch(setRendering(true));
		try {
			const { blob, ext } = await renderProjectExport(
				stageRef,
				project,
				(globalTime, sceneId, localTime) => {
					flushSync(() => {
						dispatch(setCurrentTime({ globalTime, sceneId, localTime }));
					});
				},
				{
					format,
					startTime: format === "gif" ? gifStart : 0,
					endTime: format === "gif" ? gifEnd : undefined,
				},
			);
			downloadBlob(blob, exportFilename(project.name, ext));
		} catch (err) {
			if (err?.name !== "AbortError") {
				alert(err?.message || "Export failed.");
			}
		} finally {
			dispatch(setRendering(false));
			dispatch(setPlaying(false));
		}
	};

	return (
		<header className="shrink-0 bg-background px-3 pt-1 pb-2">
			<div className="max-w-7xl mx-auto h-11 rounded-xl border-2 border-border bg-card shadow flex items-center gap-2 px-3">
				<div className="flex items-center gap-2 shrink-0 mr-1">
					<Clapperboard className="h-5 w-5 text-primary shrink-0" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-primary border-2 border-primary px-1.5 py-0.5 hidden sm:inline">
						Edcn
					</span>
				</div>

				<Input
					value={project.name}
					onChange={(e) => dispatch(setProjectName(e.target.value))}
					className="h-8 max-w-[160px] sm:max-w-[200px] text-sm font-semibold border-transparent shadow-none focus-visible:border-border"
				/>
				<FrameDimensionSelect
					canvas={project.canvas}
					disabled={playback.isPlaying || playback.isRendering}
					onChange={(dims) => dispatch(setCanvasDimensions(dims))}
				/>

				<div className="flex-1" />

				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-2 text-xs shrink-0 hidden sm:flex"
					onClick={() => onOpenCommandSearch?.()}
				>
					<Search className="h-3.5 w-3.5" />
					Search
					<kbd className="ml-1 rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono">
						⌘K
					</kbd>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 shrink-0"
					disabled={!canUndo || historyBlocked}
					onClick={() => dispatch(undo())}
					title="Undo (Ctrl+Z)"
				>
					<Undo2 className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 shrink-0"
					disabled={!canRedo || historyBlocked}
					onClick={() => dispatch(redo())}
					title="Redo (Ctrl+Shift+Z)"
				>
					<Redo2 className="h-4 w-4" />
				</Button>

				<ThemeToggle />

				<Button
					size="sm"
					variant="outline"
					disabled={exportBlocked}
					onClick={() => setPreviewOpen(true)}
					title="Preview rendered export"
				>
					<Play className="h-4 w-4" />
					<span className="hidden sm:inline">Preview</span>
				</Button>

				<ExportMenu
					disabled={exportBlocked}
					isExporting={playback.isRendering}
					gifStart={gifStart}
					gifEnd={gifEnd}
					maxDuration={totalDuration}
					onGifStartChange={setGifStart}
					onGifEndChange={setGifEnd}
					onExportMp4={() => runExport("mp4")}
					onExportGif={() => runExport("gif")}
				/>
			</div>

			<PreviewVideoModal open={previewOpen} onOpenChange={setPreviewOpen} />
		</header>
	);
}
