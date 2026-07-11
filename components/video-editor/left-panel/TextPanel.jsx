import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEXT_PRESETS } from "@/lib/video-editor/textPresets";
import { getTextPresetTileClassName } from "@/lib/video-editor/inlineTextEdit";
import { timelineDragProps } from "@/components/video-editor/timelineDragSource";
import { cn } from "@/lib/utils";

export function TextPanel({ onAddText, search }) {
	const filtered = TEXT_PRESETS.filter(
		(p) =>
			!search ||
			p.label.toLowerCase().includes(search.toLowerCase()) ||
			p.layer.content.toLowerCase().includes(search.toLowerCase()),
	);
	const plain = filtered.find((p) => p.isPlain);
	const combos = filtered.filter((p) => !p.isPlain);

	return (
		<div className="flex flex-col gap-3 p-3">
			{plain && (
				<Button
					className="w-full justify-start gap-2 h-10 cursor-grab active:cursor-grabbing"
					onClick={() => onAddText(plain)}
					{...timelineDragProps({ type: "text", data: plain.layer })}
				>
					<Type className="h-4 w-4" />
					Add a text box
				</Button>
			)}

			{combos.length > 0 && (
				<>
					<p className="text-sm font-bold text-foreground">Font combinations</p>
					<div className="grid grid-cols-2 gap-2">
						{combos.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => onAddText(preset)}
								{...timelineDragProps({ type: "text", data: preset.layer })}
								className={cn(
									"aspect-square border-2 border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center p-2 gap-0.5 overflow-hidden cursor-grab active:cursor-grabbing",
									getTextPresetTileClassName(preset.preview, preset.subPreview),
								)}
							>
								{preset.subPreview ? (
									<>
										<span
											className="text-center leading-tight truncate w-full"
											style={preset.preview}
										>
											{preset.label.split("\n")[0]}
										</span>
										<span
											className="text-center leading-tight truncate w-full"
											style={preset.subPreview}
										>
											{preset.subContent}
										</span>
									</>
								) : (
									<span
										className="text-center leading-tight line-clamp-3 w-full"
										style={preset.preview}
									>
										{preset.label}
									</span>
								)}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
