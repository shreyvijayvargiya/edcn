import { useState } from "react";
import { Copy, CopyPlus, MoreVertical, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch } from "@/lib/store/hooks";
import {
	copyLayer,
	deleteLayer,
	duplicateLayer,
} from "@/lib/store/slices/videoEditorSlice";
import { cn } from "@/lib/utils";

const LAYER_ACTIONS = [
	{ id: "duplicate", label: "Duplicate", icon: CopyPlus, action: "duplicate" },
	{ id: "copy", label: "Copy", icon: Copy, action: "copy" },
	{ id: "delete", label: "Delete", icon: Trash2, action: "delete", destructive: true },
];

export default function TimelineLayerMenu({ sceneId, layerId, className }) {
	const [open, setOpen] = useState(false);
	const dispatch = useAppDispatch();

	const run = (action) => {
		if (!sceneId || !layerId) return;
		switch (action) {
			case "duplicate":
				dispatch(duplicateLayer({ sceneId, layerId }));
				break;
			case "copy":
				dispatch(copyLayer({ sceneId, layerId }));
				break;
			case "delete":
				dispatch(deleteLayer({ sceneId, layerId }));
				break;
			default:
				break;
		}
		setOpen(false);
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex h-5 w-5 items-center justify-center rounded-sm",
						"border border-border/80 bg-card/90 text-foreground shadow-sm",
						"hover:border-primary hover:bg-primary hover:text-primary-foreground transition-colors",
						open && "border-primary bg-primary text-primary-foreground",
						className,
					)}
					aria-label="Layer actions"
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<MoreVertical className="h-3 w-3" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				side="top"
				className="min-w-[10rem] border-2 p-1.5"
				onClick={(e) => e.stopPropagation()}
			>
				<DropdownMenuLabel className="px-2 py-1">Layer</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{LAYER_ACTIONS.map(({ id, label, icon: Icon, action, destructive }) => (
					<DropdownMenuItem
						key={id}
						className={cn(
							"gap-2.5 rounded-md px-2 py-2 cursor-pointer",
							destructive && "text-destructive focus:text-destructive",
						)}
						onSelect={() => run(action)}
					>
						<span
							className={cn(
								"flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60",
								destructive && "bg-destructive/10",
							)}
						>
							<Icon className="h-4 w-4" />
						</span>
						<span className="text-sm font-medium">{label}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
