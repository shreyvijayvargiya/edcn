import { useState } from "react";
import { SHAPE_PRESETS, PANEL_COLOR_PRESETS } from "@/lib/video-editor/shapePresets";
import { timelineDragProps } from "@/components/video-editor/timelineDragSource";
import { ColorSwatchRow } from "./ColorSwatchRow";

export function shapeWithColor(preset, color) {
	return {
		...preset,
		preview: { ...preset.preview, bg: color },
		data: { ...preset.data, fill: color },
	};
}

export function ShapesPanel({ onAddShape }) {
	const [color, setColor] = useState(PANEL_COLOR_PRESETS[1]);

	return (
		<div className="flex flex-col gap-3 p-3">
			<p className="text-sm font-bold text-foreground">Objects</p>
			<ColorSwatchRow value={color} onChange={setColor} />
			<div className="grid grid-cols-2 gap-2">
				{SHAPE_PRESETS.map((preset) => {
					const colored = shapeWithColor(preset, color);
					return (
						<button
							key={preset.id}
							type="button"
							onClick={() => onAddShape(colored)}
							{...timelineDragProps({
								type: "shape",
								data: colored.data,
								size: colored.size,
							})}
							className="aspect-square border-2 border-border rounded-lg bg-muted/20 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 p-3 cursor-grab active:cursor-grabbing"
						>
							<div
								className="w-12 h-10 shrink-0"
								style={{
									background: colored.preview.bg,
									borderRadius: colored.preview.borderRadius,
									border: colored.preview.border,
								}}
							/>
							<span className="text-[10px] font-medium text-muted-foreground capitalize">
								{preset.shape}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
