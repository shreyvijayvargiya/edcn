import { Pipette } from "lucide-react";
import { PANEL_COLOR_PRESETS } from "@/lib/video-editor/shapePresets";
import { cn } from "@/lib/utils";

export function ColorSwatchRow({ colors = PANEL_COLOR_PRESETS, value, onChange }) {
	const normalized = (value || "").toLowerCase();
	const isPreset = colors.some((c) => c.toLowerCase() === normalized);

	return (
		<div className="flex flex-wrap gap-1.5 items-center">
			{colors.map((c) => (
				<button
					key={c}
					type="button"
					onClick={() => onChange(c)}
					className={cn(
						"h-6 w-6 rounded-full border-2 shrink-0 transition-transform",
						normalized === c.toLowerCase() ? "border-primary scale-110" : "border-border",
						c.toLowerCase() === "#ffffff" && "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]",
					)}
					style={{ background: c }}
					title={c}
				/>
			))}
			<label
				className={cn(
					"relative h-6 w-6 rounded-full border-2 shrink-0 overflow-hidden transition-transform cursor-pointer",
					"flex items-center justify-center",
					!isPreset ? "border-primary scale-110" : "border-border",
				)}
				title="Custom color"
				aria-label="Pick custom color"
			>
				<span
					className="absolute inset-0"
					style={{
						background: isPreset
							? "conic-gradient(#ef4444, #fbbf24, #22c55e, #3b82f6, #a855f7, #ef4444)"
							: value,
					}}
				/>
				<span className="relative z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm pointer-events-none">
					<Pipette className="h-2.5 w-2.5" />
				</span>
				<input
					type="color"
					value={value && value !== "transparent" ? value : "#ea580c"}
					onChange={(e) => onChange(e.target.value)}
					className="absolute inset-0 opacity-0 cursor-pointer"
					aria-label="Custom color"
				/>
			</label>
		</div>
	);
}
