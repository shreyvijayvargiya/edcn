import { Trash2, Copy, Undo2, Clapperboard, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	setProjectName,
	deleteLayer,
	duplicateLayer,
	resetProject,
} from "@/lib/store/slices/videoEditorSlice";

export default function Toolbar() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId, selectedLayerId } = useAppSelector(
		(s) => s.videoEditor,
	);

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

			<div className="flex items-center gap-1.5 h-8 px-2.5 border-2 border-border rounded-md text-xs font-semibold text-muted-foreground shrink-0">
				<Monitor className="h-3.5 w-3.5" />
				<span>1920 × 1080</span>
			</div>

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
