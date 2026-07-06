import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	PanelVerticalResizeHandle,
	PanelHorizontalResizeHandle,
} from "./PanelResizeHandle";

const PANEL_CARD = "rounded-xl border-2 border-border bg-card";

/**
 * Fixed side cards with resizable width (inner vertical edge) and height (bottom edge).
 */
export default function SidebarOverlay({
	side,
	open,
	onOpenChange,
	children,
	width = 280,
	panelHeight = 560,
	onWidthChange,
	onHeightChange,
	toggleIcon: ToggleIcon,
	label,
}) {
	const isLeft = side === "left";

	return (
		<>
			<AnimatePresence>
				{!open && (
					<motion.button
						key={`${side}-toggle`}
						type="button"
						initial={{ opacity: 0, scale: 0.92 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.92 }}
						transition={{ duration: 0.15 }}
						className={cn(
							"md:hidden fixed z-30 top-1/2 -translate-y-1/2",
							"flex h-10 w-10 items-center justify-center",
							PANEL_CARD,
							"hover:bg-muted hover:border-primary/40 transition-colors",
							isLeft ? "left-2" : "right-2",
						)}
						onClick={() => onOpenChange(true)}
						aria-label={`Open ${label}`}
						title={label}
					>
						<ToggleIcon className="h-5 w-5" />
					</motion.button>
				)}
			</AnimatePresence>

			<aside
				className={cn(
					"fixed z-30 flex flex-col overflow-visible",
					PANEL_CARD,
					"top-2",
					"max-w-[min(calc(100vw-1rem),92vw)]",
					isLeft ? "left-2" : "right-2",
					"hidden md:flex",
					open && "max-md:flex",
					!open && "max-md:hidden",
				)}
				style={{ width, height: panelHeight }}
				aria-label={label}
			>
				{onWidthChange && (
					<PanelVerticalResizeHandle
						edge={isLeft ? "right" : "left"}
						onResizeStart={() => width}
						onResize={onWidthChange}
					/>
				)}

				{onHeightChange && (
					<PanelHorizontalResizeHandle
						onResizeStart={() => panelHeight}
						onResize={onHeightChange}
					/>
				)}

				<div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[inherit]">
					<div className="md:hidden shrink-0 flex items-center gap-2 border-b-2 border-border bg-muted/30 px-2.5 py-1.5">
						<ToggleIcon className="h-4 w-4 text-primary shrink-0" />
						<span className="text-xs font-bold text-foreground truncate flex-1">
							{label}
						</span>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-7 w-7 shrink-0"
							onClick={() => onOpenChange(false)}
							aria-label={`Close ${label}`}
						>
							{isLeft ? (
								<ChevronLeft className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</Button>
					</div>
					<div className="flex-1 min-h-0 overflow-hidden">{children}</div>
				</div>
			</aside>
		</>
	);
}
