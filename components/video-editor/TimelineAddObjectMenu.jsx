import { useState } from "react";
import {
	Plus,
	Type,
	Image as ImageIcon,
	Video,
	Music,
	Square,
	Star,
	Mic,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/lib/store/hooks";
import { openRecordAudioModal } from "@/lib/store/slices/videoEditorSlice";
import { useTimelineLayerActions } from "@/lib/video-editor/useTimelineLayerActions";
import { cn } from "@/lib/utils";

export const TIMELINE_ADD_OPTIONS = [
	{ id: "text", label: "Text", icon: Type, action: "addText" },
	{ id: "image", label: "Image", icon: ImageIcon, action: "uploadImage" },
	{ id: "video", label: "Video", icon: Video, action: "uploadVideo" },
	{ id: "audio", label: "Audio", icon: Music, action: "uploadAudio" },
	{ id: "record-audio", label: "Record audio", icon: Mic, action: "recordAudio" },
	{ id: "shape", label: "Object", icon: Square, action: "addShape" },
	{ id: "icon", label: "Icon", icon: Star, action: "addIcon" },
];

function AddObjectMenuContent({ actions, insertAt, onDone }) {
	const run = (actionKey) => {
		const fn = actions[actionKey];
		if (typeof fn === "function") fn(insertAt);
		onDone();
	};

	return (
		<>
			<DropdownMenuLabel className="px-2 py-1">Add object</DropdownMenuLabel>
			<DropdownMenuSeparator />
			{TIMELINE_ADD_OPTIONS.map(({ id, label, icon: Icon, action }) => (
				<DropdownMenuItem
					key={id}
					className="gap-2.5 rounded-md px-2 py-2 cursor-pointer"
					onSelect={() => run(action)}
				>
					<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60">
						<Icon className="h-4 w-4 text-foreground" />
					</span>
					<span className="text-sm font-medium">{label}</span>
				</DropdownMenuItem>
			))}
		</>
	);
}

/**
 * Shared add-object dropdown for timeline header, strips, and track rows.
 * @param {"icon"|"strip"|"chip"} variant
 * @param {"start"|"end"} insertAt
 */
export default function TimelineAddObjectMenu({
	insertAt = "end",
	variant = "icon",
	side = "bottom",
	align = "end",
	className,
}) {
	const [open, setOpen] = useState(false);
	const dispatch = useAppDispatch();
	const actions = useTimelineLayerActions();
	const disabled = !actions.activeSceneId;

	const runAndClose = () => setOpen(false);

	const allActions = {
		...actions,
		recordAudio: (insertAt) => {
			dispatch(openRecordAudioModal({ insertAt }));
		},
	};

	let trigger = null;
	if (variant === "icon") {
		trigger = (
			<Button
				type="button"
				size="icon"
				variant="outline"
				disabled={disabled}
				className={cn("h-7 w-7 shrink-0", className)}
				aria-label="Add object"
			>
				<Plus className="h-3.5 w-3.5" />
			</Button>
		);
	} else if (variant === "chip") {
		trigger = (
			<button
				type="button"
				disabled={disabled}
				className={cn(
					"flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm",
					"hover:border-primary hover:bg-primary hover:text-primary-foreground transition-colors",
					disabled && "cursor-not-allowed opacity-40",
					open && "border-primary bg-primary text-primary-foreground",
					className,
				)}
				aria-label="Add object"
			>
				<Plus className="h-3 w-3" strokeWidth={2.5} />
			</button>
		);
	} else {
		trigger = (
			<button
				type="button"
				disabled={disabled}
				className={cn(
					"relative flex h-7 w-full items-center justify-center transition-colors",
					disabled
						? "cursor-not-allowed opacity-40"
						: "cursor-pointer hover:bg-muted/40",
					open && "bg-muted/50",
					className,
				)}
				aria-label="Add layer"
			>
				<span
					className={cn(
						"absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/80 transition-colors",
						!disabled && "group-hover:bg-primary/30",
						open && "bg-primary/40",
					)}
				/>
				<span
					className={cn(
						"relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm",
						"opacity-0 scale-75 transition-all duration-150",
						!disabled && "group-hover:opacity-100 group-hover:scale-100",
						open && "opacity-100 scale-100 border-primary bg-primary text-primary-foreground",
					)}
				>
					<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
				</span>
			</button>
		);
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild disabled={disabled}>
				{trigger}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={align}
				side={side}
				className="min-w-[11rem] border-2 p-1.5"
				onClick={(e) => e.stopPropagation()}
			>
				<AddObjectMenuContent
					actions={allActions}
					insertAt={insertAt}
					onDone={runAndClose}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
