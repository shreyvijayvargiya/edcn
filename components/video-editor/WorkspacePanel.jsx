import { useCallback, useEffect, useState } from "react";
import { Clapperboard, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { loadProject, resetProject, setProjectName } from "@/lib/store/slices/videoEditorSlice";
import {
	listWorkspaceProjects,
	upsertWorkspaceProject,
	getWorkspaceProject,
	formatWorkspaceDate,
	renameWorkspaceProject,
	deleteWorkspaceProject,
	isDemoWorkspaceProject,
} from "@/lib/video-editor/workspace";
import { cn } from "@/lib/utils";

function ProjectRow({ entry, isActive, onOpen, onRename, onDelete }) {
	const [renaming, setRenaming] = useState(false);
	const [draft, setDraft] = useState(entry.name);
	const isDemo = entry.isDemo || isDemoWorkspaceProject(entry.id);

	const commitRename = () => {
		const next = draft.trim();
		if (next && next !== entry.name) {
			onRename(next);
		} else {
			setDraft(entry.name);
		}
		setRenaming(false);
	};

	const startRename = () => {
		setDraft(entry.name);
		setRenaming(true);
	};

	return (
		<div
			className={cn(
				"group flex items-center gap-3 rounded-lg border-2 p-2.5 transition-colors",
				isActive
					? "border-primary bg-primary/5"
					: "border-border hover:border-primary/50 hover:bg-muted/30",
			)}
		>
			<button
				type="button"
				onClick={onOpen}
				className={cn(
					"h-12 w-12 shrink-0 rounded-md border-2 flex items-center justify-center",
					isActive ? "border-primary/30 bg-primary/10" : "border-border bg-muted/40",
				)}
				title="Open project"
			>
				<Clapperboard
					className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
				/>
			</button>

			<div className="min-w-0 flex-1">
				{renaming ? (
					<Input
						autoFocus
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={commitRename}
						onKeyDown={(e) => {
							if (e.key === "Enter") commitRename();
							if (e.key === "Escape") {
								setDraft(entry.name);
								setRenaming(false);
							}
						}}
						className="h-7 text-xs"
					/>
				) : (
					<button
						type="button"
						onClick={onOpen}
						className="text-xs font-semibold text-foreground truncate w-full text-left"
					>
						{entry.name}
					</button>
				)}
				<p className="text-[10px] text-muted-foreground mt-0.5">
					Updated {formatWorkspaceDate(entry.updatedAt)}
				</p>
				{isActive && (
					<span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-primary">
						Editing
					</span>
				)}
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 shrink-0 opacity-70 group-hover:opacity-100"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreHorizontal className="h-4 w-4" />
						<span className="sr-only">Project actions</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-40">
					<DropdownMenuItem onClick={startRename} disabled={isDemo}>
						<Pencil className="h-3.5 w-3.5" />
						Rename
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={onDelete}
						className="text-destructive focus:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export default function WorkspacePanel() {
	const dispatch = useAppDispatch();
	const { project } = useAppSelector((s) => s.videoEditor);
	const [entries, setEntries] = useState([]);

	const refreshEntries = useCallback(() => {
		setEntries(listWorkspaceProjects());
	}, []);

	useEffect(() => {
		upsertWorkspaceProject(project);
		refreshEntries();
	}, [project, refreshEntries]);

	const openProject = (entry) => {
		const payload = entry.isDemo ? getWorkspaceProject(entry.id) : entry.project ?? getWorkspaceProject(entry.id);
		if (payload) {
			dispatch(loadProject(payload));
		}
	};

	const createNew = () => {
		dispatch(resetProject());
	};

	const handleRename = (entry, name) => {
		if (entry.isDemo || isDemoWorkspaceProject(entry.id)) return;
		if (!renameWorkspaceProject(entry.id, name)) return;
		if (entry.id === project.id) {
			dispatch(setProjectName(name));
		}
		refreshEntries();
	};

	const handleDelete = (entry) => {
		if (!deleteWorkspaceProject(entry.id)) return;
		if (entry.id === project.id) {
			const remaining = listWorkspaceProjects();
			const next = remaining[0];
			if (next) {
				openProject(next);
			} else {
				dispatch(resetProject());
			}
		}
		refreshEntries();
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
				{entries.map((entry) => (
					<ProjectRow
						key={entry.id}
						entry={entry}
						isActive={entry.id === project.id}
						onOpen={() => openProject(entry)}
						onRename={(name) => handleRename(entry, name)}
						onDelete={() => handleDelete(entry)}
					/>
				))}
			</div>
		</div>
	);
}
