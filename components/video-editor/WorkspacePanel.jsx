import { useEffect, useState } from "react";
import { Clapperboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { loadProject, resetProject } from "@/lib/store/slices/videoEditorSlice";
import {
	listWorkspaceProjects,
	upsertWorkspaceProject,
	getWorkspaceProject,
	formatWorkspaceDate,
} from "@/lib/video-editor/workspace";
import { cn } from "@/lib/utils";

export default function WorkspacePanel() {
	const dispatch = useAppDispatch();
	const { project } = useAppSelector((s) => s.videoEditor);
	const [entries, setEntries] = useState([]);

	useEffect(() => {
		upsertWorkspaceProject(project);
		setEntries(listWorkspaceProjects());
	}, [project]);

	const openProject = (entry) => {
		const payload = entry.isDemo ? getWorkspaceProject(entry.id) : entry.project ?? getWorkspaceProject(entry.id);
		if (payload) {
			dispatch(loadProject(payload));
		}
	};

	const createNew = () => {
		dispatch(resetProject());
	};

	return (
		<div className="flex flex-col gap-3 p-3">
			<div className="flex items-start justify-between gap-2">
				<div>
					<p className="text-sm font-bold text-foreground">Workspace</p>
					<p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
						Your videos and projects. The open project auto-saves here.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="h-8 shrink-0 gap-1.5 text-xs"
					onClick={createNew}
				>
					<Plus className="h-3.5 w-3.5" />
					New
				</Button>
			</div>

			<div className="flex flex-col gap-2">
				{entries.map((entry) => {
					const isActive = entry.id === project.id;
					return (
						<button
							key={entry.id}
							type="button"
							onClick={() => openProject(entry)}
							className={cn(
								"flex items-center gap-3 rounded-lg border-2 p-2.5 text-left transition-colors",
								isActive
									? "border-primary bg-primary/5"
									: "border-border hover:border-primary/50 hover:bg-muted/30",
							)}
						>
							<div
								className={cn(
									"h-12 w-12 shrink-0 rounded-md border-2 flex items-center justify-center",
									isActive ? "border-primary/30 bg-primary/10" : "border-border bg-muted/40",
								)}
							>
								<Clapperboard
									className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-semibold text-foreground truncate">{entry.name}</p>
								<p className="text-[10px] text-muted-foreground mt-0.5">
									Updated {formatWorkspaceDate(entry.updatedAt)}
								</p>
								{isActive && (
									<span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-primary">
										Editing
									</span>
								)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
