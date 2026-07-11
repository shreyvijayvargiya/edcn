import { useState } from "react";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import { ICON_COMBOS } from "@/lib/video-editor/iconCombos";
import { PANEL_COLOR_PRESETS } from "@/lib/video-editor/shapePresets";
import { timelineDragProps } from "@/components/video-editor/timelineDragSource";
import { ColorSwatchRow } from "./ColorSwatchRow";

export function IconsPanel({ onAddIcon, onAddIconCombo, search }) {
	const [color, setColor] = useState(PANEL_COLOR_PRESETS[0]);
	const filtered = EDITOR_ICONS.filter((icon) => !search || icon.includes(search));
	const filteredCombos = ICON_COMBOS.filter(
		(c) => !search || c.label.toLowerCase().includes(search.toLowerCase()) || c.icon.includes(search),
	);

	return (
		<div className="flex flex-col gap-3 p-3">
			{filteredCombos.length > 0 && (
				<>
					<p className="text-sm font-bold text-foreground">Icon combinations</p>
					<div className="grid grid-cols-4 gap-1.5">
						{filteredCombos.map((combo) => (
							<button
								key={combo.id}
								type="button"
								onClick={() => onAddIconCombo(combo)}
								{...timelineDragProps({
									type: "icon",
									data: {
										icon: combo.icon,
										fill: combo.fill,
										fontSize: combo.fontSize ?? 48,
									},
								})}
								className="aspect-square rounded-lg bg-muted/30 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-0.5 p-1 cursor-grab active:cursor-grabbing"
								title={combo.label}
							>
								<span className="text-2xl leading-none" style={{ color: combo.fill }}>
									{combo.icon}
								</span>
								<span className="text-[8px] font-medium text-muted-foreground truncate w-full text-center">
									{combo.label}
								</span>
							</button>
						))}
					</div>
				</>
			)}

			<p className="text-sm font-bold text-foreground">All icons</p>
			<ColorSwatchRow value={color} onChange={setColor} />
			<div className="grid grid-cols-6 gap-1">
				{filtered.map((icon) => (
					<button
						key={icon}
						type="button"
						onClick={() => onAddIcon(icon, color)}
						{...timelineDragProps({
							type: "icon",
							data: { icon, fill: color, fontSize: 48 },
						})}
						className="h-9 w-9 flex items-center justify-center text-xl rounded-md hover:bg-primary/5 transition-colors cursor-grab active:cursor-grabbing"
						style={{ color }}
						title={`Add ${icon}`}
					>
						{icon}
					</button>
				))}
			</div>
		</div>
	);
}
