import {
	Trash2,
	Copy,
	Undo2,
	Clapperboard,
	Loader2,
	Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	setProjectName,
	deleteLayer,
	duplicateLayer,
	resetProject,
	setCurrentTime,
	setPlaying,
	setRendering,
	setAudioUnlocked,
	stopPlayback,
	setCanvasDimensions,
} from "@/lib/store/slices/videoEditorSlice";
import { renderProjectToWebm, downloadBlob } from "@/lib/video-editor/render";
import { useStageRef } from "./StageRefContext";
import FrameDimensionSelect from "./FrameDimensionSelect";

export default function Toolbar() {
	const dispatch = useAppDispatch();
	const stageRef = useStageRef();
	const { project, activeSceneId, selectedLayerId, playback } = useAppSelector(
		(s) => s.videoEditor,
	);

	const handleExport = async () => {
		if (!stageRef?.current) {
			alert("Canvas not ready — wait for preview to load.");
			return;
		}
		dispatch(stopPlayback());
		dispatch(setAudioUnlocked(true));
		dispatch(setRendering(true));
		try {
			const blob = await renderProjectToWebm(
				stageRef,
				project,
				(globalTime, sceneId, localTime) =>
					dispatch(setCurrentTime({ globalTime, sceneId, localTime })),
				(playing) => dispatch(setPlaying(playing)),
			);
			downloadBlob(blob, `${project.name || "video"}.webm`);
		} catch (err) {
			alert(err?.message || "Export failed.");
		} finally {
			dispatch(setRendering(false));
			dispatch(setPlaying(false));
		}
	};

	return (
		<header className="h-12 shrink-0 border-b-2 border-border bg-card flex items-center gap-2 px-3">
			<div className="flex items-center gap-2 shrink-0 mr-2">
				<Clapperboard className="h-5 w-5 text-primary shrink-0" />
				<span className="text-[10px] font-bold uppercase tracking-widest text-primary border-2 border-primary px-1.5 py-0.5 hidden sm:inline">
					Video Editor
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

			<Button variant="ghost" size="sm" disabled title="Undo (coming soon)">
				<Undo2 className="h-4 w-4" />
			</Button>

			<Button
				variant="outline"
				size="sm"
				disabled={!selectedLayerId}
				onClick={() =>
					selectedLayerId &&
					dispatch(
						duplicateLayer({ sceneId: activeSceneId, layerId: selectedLayerId }),
					)
				}
			>
				<Copy className="h-4 w-4" />
				<span className="hidden sm:inline">Duplicate</span>
			</Button>

			<Button
				variant="outline"
				size="sm"
				disabled={!selectedLayerId}
				className="text-destructive hover:text-destructive"
				onClick={() =>
					selectedLayerId &&
					dispatch(
						deleteLayer({ sceneId: activeSceneId, layerId: selectedLayerId }),
					)
				}
			>
				<Trash2 className="h-4 w-4" />
				<span className="hidden sm:inline">Delete</span>
			</Button>

			<Button
				size="sm"
				disabled={playback.isRendering || playback.isPlaying}
				onClick={handleExport}
				title="Export video as WebM"
			>
				{playback.isRendering ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Download className="h-4 w-4" />
				)}
				<span className="hidden sm:inline">
					{playback.isRendering ? "Exporting…" : "Export"}
				</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className="text-muted-foreground"
				onClick={() => {
					if (confirm("Reset project? Unsaved changes will be lost.")) {
						dispatch(resetProject());
					}
				}}
			>
				Reset
			</Button>
		</header>
	);
}
