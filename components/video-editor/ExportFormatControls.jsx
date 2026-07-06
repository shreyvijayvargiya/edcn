import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PropertySelect from "./PropertySelect";
import { EXPORT_FORMATS } from "@/lib/video-editor/render";
import { cn } from "@/lib/utils";

/**
 * Shared export format + GIF time range controls.
 */
export default function ExportFormatControls({
	format,
	onFormatChange,
	startTime,
	endTime,
	onStartTimeChange,
	onEndTimeChange,
	maxDuration,
	disabled = false,
	className,
	compact = false,
}) {
	const isGif = format === "gif";

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className={cn("flex gap-2", compact ? "flex-row items-center" : "flex-col")}>
				<div className={cn(compact ? "w-36 shrink-0" : "w-full")}>
					{!compact && (
						<Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
							Format
						</Label>
					)}
					<PropertySelect
						value={format}
						onChange={onFormatChange}
						options={EXPORT_FORMATS}
						disabled={disabled}
						className={compact ? "h-8" : undefined}
					/>
				</div>

				{isGif && (
					<div
						className={cn(
							"flex gap-2",
							compact ? "flex-1 min-w-0 hidden lg:flex" : "w-full",
						)}
					>
						<div className="flex-1 min-w-0">
							<Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
								Start (sec)
							</Label>
							<Input
								type="number"
								min={0}
								max={Math.max(0, endTime - 0.1)}
								step={0.1}
								value={startTime}
								disabled={disabled}
								onChange={(e) =>
									onStartTimeChange(
										Math.max(0, Math.min(Number(e.target.value) || 0, endTime - 0.1)),
									)
								}
								className="h-8 text-xs tabular-nums"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
								End (sec)
							</Label>
							<Input
								type="number"
								min={startTime + 0.1}
								max={maxDuration}
								step={0.1}
								value={endTime}
								disabled={disabled}
								onChange={(e) =>
									onEndTimeChange(
										Math.max(
											startTime + 0.1,
											Math.min(Number(e.target.value) || maxDuration, maxDuration),
										),
									)
								}
								className="h-8 text-xs tabular-nums"
							/>
						</div>
					</div>
				)}
			</div>

			{isGif && (
				<p className="text-[10px] text-muted-foreground leading-relaxed">
					GIF uses {startTime.toFixed(1)}s–{endTime.toFixed(1)}s (
					{(endTime - startTime).toFixed(1)}s, max 15s).
				</p>
			)}
		</div>
	);
}
