import { BACKGROUND_GRADIENT_PRESETS, backgroundGradientPresetCss } from "@/lib/video-editor/backgroundGradientPresets";
import {
	BACKGROUND_PATTERNS,
	patternPreviewStyle,
	DEFAULT_BG,
	DEFAULT_FG,
} from "@/lib/video-editor/backgroundPatterns";
import {
	sceneBackgroundFromGradient,
	sceneBackgroundFromPattern,
} from "@/lib/video-editor/sceneBackground";
import { cn } from "@/lib/utils";

export default function BackgroundPanel({ scene, onApplyGradient, onApplyPattern }) {
	if (!scene) {
		return (
			<div className="p-3 text-xs text-muted-foreground">Select a scene to edit its background.</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-3">
			<div>
				<p className="text-sm font-bold text-foreground">Scene background</p>
				<p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
					Applies to <span className="font-semibold">{scene.name}</span> only. Click a swatch to
					update the canvas.
				</p>
			</div>

			<div>
				<div className="flex items-center justify-between mb-2">
					<p className="text-xs font-bold text-foreground">Gradients</p>
					<span className="text-[10px] text-muted-foreground tabular-nums">
						{BACKGROUND_GRADIENT_PRESETS.length}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-2">
					{BACKGROUND_GRADIENT_PRESETS.map((preset) => (
						<button
							key={preset.id}
							type="button"
							onClick={() => onApplyGradient(preset)}
							className={cn(
								"aspect-[4/3] rounded-lg border-2 border-border overflow-hidden",
								"hover:border-primary transition-colors text-left relative",
							)}
							title={preset.label}
						>
							<div
								className="absolute inset-0"
								style={{ background: backgroundGradientPresetCss(preset) }}
							/>
							<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 py-1.5 text-[10px] font-semibold text-white truncate">
								{preset.label}
							</span>
						</button>
					))}
				</div>
			</div>

			<div>
				<div className="flex items-center justify-between mb-2">
					<p className="text-xs font-bold text-foreground">Pattern shapes</p>
					<span className="text-[10px] text-muted-foreground tabular-nums">
						{BACKGROUND_PATTERNS.length}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-2">
					{BACKGROUND_PATTERNS.map((pattern) => (
						<button
							key={pattern.id}
							type="button"
							onClick={() =>
								onApplyPattern(
									sceneBackgroundFromPattern(pattern.id, DEFAULT_FG, DEFAULT_BG),
								)
							}
							className={cn(
								"aspect-[4/3] rounded-lg border-2 border-border overflow-hidden",
								"hover:border-primary transition-colors text-left relative",
							)}
							title={pattern.label}
						>
							<div
								className="absolute inset-0"
								style={patternPreviewStyle(pattern.id, DEFAULT_FG, DEFAULT_BG)}
							/>
							<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] font-semibold text-white truncate">
								{pattern.label}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export { sceneBackgroundFromGradient };
