import { useState } from "react";
import {
	Plus,
	Type,
	Image as ImageIcon,
	Square,
	Star,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTimelineLayerActions } from "@/lib/video-editor/useTimelineLayerActions";
import { cn } from "@/lib/utils";

const ADD_OPTIONS = [
	{ id: "text", label: "Text", icon: Type, action: "addText" },
	{ id: "image", label: "Image", icon: ImageIcon, action: "uploadImage" },
	{ id: "shape", label: "Object", icon: Square, action: "addShape" },
	{ id: "icon", label: "Icon", icon: Star, action: "addIcon" },
];

/**
 * Full-width timeline add line — shows centered + on hover, opens add-object dropdown on click.
 * @param {"start"|"end"} insertAt — "end" = top row (front), "start" = bottom row (back)
 */
export default function TimelineAddStrip({ insertAt = "end", className }) {
	const [open, setOpen] = useState(false);
	const actions = useTimelineLayerActions();
	const disabled = !actions.activeSceneId;

	const run = (actionKey) => {
		const fn = actions[actionKey];
		if (typeof fn === "function") fn(insertAt);
		setOpen(false);
	};

	return (
		<div
			className={cn(
				"group relative w-full shrink-0 border-border/60",
				insertAt === "end" ? "border-b" : "border-t",
				className,
			)}
			onClick={(e) => e.stopPropagation()}
		>
			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuTrigger asChild disabled={disabled}>
					<button
						type="button"
						disabled={disabled}
						className={cn(
							"relative flex h-7 w-full items-center justify-center",
							"transition-colors",
							disabled
								? "cursor-not-allowed opacity-40"
								: "cursor-pointer hover:bg-muted/40",
							open && "bg-muted/50",
						)}
						aria-label="Add layer"
					>
						<span
							className={cn(
								"absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/80",
								"group-hover:bg-primary/30 transition-colors",
								open && "bg-primary/40",
							)}
						/>
						<span
							className={cn(
								"relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm",
								"opacity-0 scale-75 transition-all duration-150",
								"group-hover:opacity-100 group-hover:scale-100",
								open && "opacity-100 scale-100 border-primary bg-primary text-primary-foreground",
							)}
						>
							<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
						</span>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="center"
					side={insertAt === "end" ? "bottom" : "top"}
					className="min-w-[11rem] border-2 p-1.5"
					onClick={(e) => e.stopPropagation()}
				>
					<DropdownMenuLabel className="px-2 py-1">Add object</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{ADD_OPTIONS.map(({ id, label, icon: Icon, action }) => (
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
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
