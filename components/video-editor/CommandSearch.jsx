import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Search, X } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { loadProject } from "@/lib/store/slices/videoEditorSlice";
import { getWorkspaceProject, listWorkspaceProjects } from "@/lib/video-editor/workspace";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
	buildCommandSearchIndex,
	searchCommands,
	executeCommandAction,
} from "@/lib/utils/commandSearch";
import { cn } from "@/lib/utils";

function CommandRow({ item, active, onSelect }) {
	return (
		<button
			type="button"
			onClick={() => onSelect(item)}
			className={cn(
				"flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
				active
					? "border-primary bg-primary/10"
					: "border-transparent hover:border-border hover:bg-muted/40",
			)}
		>
			<div className="min-w-0 flex-1">
				<p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
				{item.description ? (
					<p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.description}</p>
				) : null}
			</div>
		</button>
	);
}

export default function CommandSearch({
	open: controlledOpen,
	onOpenChange,
	openLeftPanel,
	openRightPanel,
	onExport,
}) {
	const dispatch = useAppDispatch();
	const { project } = useAppSelector((s) => s.videoEditor);
	const { setTheme, toggleTheme } = useTheme();
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef(null);

	const workspaceEntries = useMemo(() => {
		if (typeof window === "undefined") return [];
		return listWorkspaceProjects();
	}, [open, project.id]);

	const commands = useMemo(
		() => buildCommandSearchIndex({ project, workspaceEntries }),
		[project, workspaceEntries],
	);

	const groups = useMemo(() => searchCommands(query, commands), [query, commands]);

	const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

	const loadWorkspaceProject = useCallback(
		(projectId) => {
			const payload = getWorkspaceProject(projectId);
			if (payload) dispatch(loadProject(payload));
		},
		[dispatch],
	);

	const runItem = useCallback(
		(item) => {
			executeCommandAction(item.action, {
				dispatch,
				openLeftPanel,
				openRightPanel,
				setTheme,
				toggleTheme,
				loadWorkspaceProject,
				onExport,
			});
			setOpen(false);
			setQuery("");
			setActiveIndex(0);
		},
		[
			dispatch,
			openLeftPanel,
			openRightPanel,
			setTheme,
			toggleTheme,
			loadWorkspaceProject,
			onExport,
		],
	);

	useHotkeys(
		"meta+k, ctrl+k",
		(e) => {
			e.preventDefault();
			setOpen(true);
		},
		{ enableOnFormTags: true },
		[],
	);

	useEffect(() => {
		if (!open) return;
		setActiveIndex(0);
		const t = window.setTimeout(() => inputRef.current?.focus(), 0);
		return () => window.clearTimeout(t);
	}, [open]);

	useEffect(() => {
		setActiveIndex(0);
	}, [query]);

	const handleKeyDown = (e) => {
		if (!flatItems.length) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => (i + 1) % flatItems.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
		} else if (e.key === "Enter") {
			e.preventDefault();
			const item = flatItems[activeIndex];
			if (item) runItem(item);
		}
	};

	let rowIndex = 0;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden">
				<DialogHeader className="sr-only">
					<DialogTitle>Command search</DialogTitle>
					<DialogDescription>Search navigation, properties, assets, and actions</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
					<Search className="h-4 w-4 text-muted-foreground shrink-0" />
					<Input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Search everything…"
						className="h-9 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
					/>
					{query ? (
						<button
							type="button"
							onClick={() => setQuery("")}
							className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
							aria-label="Clear search"
						>
							<X className="h-4 w-4" />
						</button>
					) : null}
					<button
						type="button"
						onClick={() => setOpen(false)}
						className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
						aria-label="Close search"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="max-h-[min(60vh,420px)] overflow-y-auto p-2 space-y-3">
					{groups.length === 0 ? (
						<p className="text-xs text-muted-foreground text-center py-8">No results found.</p>
					) : (
						groups.map((group) => (
							<div key={group.category}>
								<p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									{group.category}
								</p>
								<div className="space-y-0.5">
									{group.items.map((item) => {
										const idx = rowIndex;
										rowIndex += 1;
										return (
											<CommandRow
												key={item.id}
												item={item}
												active={idx === activeIndex}
												onSelect={runItem}
											/>
										);
									})}
								</div>
							</div>
						))
					)}
				</div>

				<div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
					<span>↑↓ navigate · Enter select</span>
					<kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px]">
						⌘K
					</kbd>
				</div>
			</DialogContent>
		</Dialog>
	);
}
