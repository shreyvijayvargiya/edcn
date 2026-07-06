import TimelineAddObjectMenu from "./TimelineAddObjectMenu";
import { cn } from "@/lib/utils";

/**
 * Full-width timeline add line — shows centered + on hover, opens add-object dropdown on click.
 * @param {"start"|"end"} insertAt — "end" = top row (front), "start" = bottom row (back)
 */
export default function TimelineAddStrip({ insertAt = "end", className }) {
	return (
		<div
			className={cn(
				"group relative w-full shrink-0 border-border/60",
				insertAt === "end" ? "border-b" : "border-t",
				className,
			)}
			onClick={(e) => e.stopPropagation()}
		>
			<TimelineAddObjectMenu
				insertAt={insertAt}
				variant="strip"
				align="center"
				side={insertAt === "end" ? "bottom" : "top"}
			/>
		</div>
	);
}
