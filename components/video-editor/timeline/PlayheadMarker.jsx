import { cn } from "@/lib/utils";
import { formatPlayheadTime } from "./formatTime";

export default function PlayheadMarker({ x, time, className }) {
	return (
		<div
			className={cn(
				"absolute top-0 bottom-0 z-30 group/playhead w-3 -translate-x-1/2 cursor-default pointer-events-none",
				className,
			)}
			style={{ left: x }}
			title={formatPlayheadTime(time)}
		>
			<div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary" />
			<div
				className={cn(
					"absolute top-1 left-1/2 -translate-x-1/2",
					"opacity-0 group-hover/playhead:opacity-100 transition-opacity duration-150",
				)}
			>
				<span className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary shadow-md whitespace-nowrap">
					{formatPlayheadTime(time)}
				</span>
			</div>
		</div>
	);
}
