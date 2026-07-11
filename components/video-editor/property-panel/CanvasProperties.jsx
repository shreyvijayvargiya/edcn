import { Plus, Minus } from "lucide-react";
import { CapsuleSlider } from "@/components/ui/capsule-slider";
import { updateCanvas } from "@/lib/store/slices/videoEditorSlice";
import { DEFAULT_CANVAS_BACKGROUND } from "@/lib/video-editor/gradients";
import {
	BACKGROUND_GRADIENT_PRESETS,
	findBackgroundGradientPresetId,
} from "@/lib/video-editor/backgroundGradientPresets";
import BackgroundGradientSelect from "../BackgroundGradientSelect";
import {
	Field,
	RangeField,
	ColorField,
	Button,
} from "./PropertyPanelSections";

export default function CanvasProperties({ canvas, dispatch }) {
	const bg = canvas?.background ?? DEFAULT_CANVAS_BACKGROUND;
	const isGradient = bg.type === "gradient";
	const gradient = bg.gradient ?? DEFAULT_CANVAS_BACKGROUND.gradient;
	const stops = gradient.stops ?? DEFAULT_CANVAS_BACKGROUND.gradient.stops;

	const patchBg = (patch) => {
		dispatch(updateCanvas({ background: { ...bg, ...patch } }));
	};

	const patchGradient = (patch) => {
		patchBg({ gradient: { ...gradient, ...patch } });
	};

	const updateStop = (index, patch) => {
		const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
		patchGradient({ stops: next });
	};

	const addStop = () => {
		const last = stops[stops.length - 1];
		patchGradient({
			stops: [
				...stops,
				{ offset: Math.min(1, (last?.offset ?? 0) + 0.15), color: last?.color ?? "#ffffff" },
			],
		});
	};

	const removeStop = (index) => {
		if (stops.length <= 2) return;
		patchGradient({ stops: stops.filter((_, i) => i !== index) });
	};

	const applyGradientPreset = (presetId) => {
		const preset = BACKGROUND_GRADIENT_PRESETS.find((p) => p.id === presetId);
		if (!preset) return;
		patchBg({ type: "gradient", gradient: { ...preset.gradient } });
	};

	const activePresetId = findBackgroundGradientPresetId(gradient);

	return (
		<div className="space-y-2.5">
			<Field label="Background type">
				<div className="flex gap-1">
					{["solid", "gradient"].map((t) => (
						<Button
							key={t}
							type="button"
							size="sm"
							variant={bg.type === t ? "default" : "outline"}
							className="flex-1 capitalize text-xs h-8"
							onClick={() =>
								patchBg({
									type: t,
									...(t === "gradient" && !bg.gradient
										? { gradient: DEFAULT_CANVAS_BACKGROUND.gradient }
										: {}),
								})
							}
						>
							{t}
						</Button>
					))}
				</div>
			</Field>

			{!isGradient ? (
				<ColorField
					label="Solid color"
					value={bg.fill}
					fallback="#18181b"
					onChange={(fill) => patchBg({ fill })}
				/>
			) : (
				<>
					<Field label="Gradient preset">
						<BackgroundGradientSelect value={activePresetId} onChange={applyGradientPreset} />
					</Field>
					<Field label="Gradient type">
						<div className="flex gap-1">
							{["linear", "radial"].map((t) => (
								<Button
									key={t}
									type="button"
									size="sm"
									variant={gradient.type === t ? "default" : "outline"}
									className="flex-1 capitalize text-xs h-8"
									onClick={() => patchGradient({ type: t })}
								>
									{t}
								</Button>
							))}
						</div>
					</Field>
					{gradient.type === "linear" && (
						<RangeField
							label="Angle"
							value={gradient.angle ?? 180}
							min={0}
							max={360}
							onChange={(v) => patchGradient({ angle: v })}
						/>
					)}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<p className="text-[10px] font-medium text-muted-foreground">Color stops</p>
							<Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={addStop}>
								<Plus className="h-3.5 w-3.5" />
							</Button>
						</div>
						{stops.map((stop, i) => (
							<div key={i} className="flex items-center gap-1.5 border border-border rounded-md p-1.5">
								<input
									type="color"
									value={stop.color}
									onChange={(e) => updateStop(i, { color: e.target.value })}
									className="h-8 w-10 border border-border cursor-pointer shrink-0 rounded-sm"
								/>
								<div className="flex-1 min-w-0">
									<CapsuleSlider
										label="Position"
										value={Math.round(stop.offset * 100)}
										min={0}
										max={100}
										formatValue={(v) => `${v}%`}
										onChange={(v) => updateStop(i, { offset: v / 100 })}
									/>
								</div>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="h-7 w-7 shrink-0"
									disabled={stops.length <= 2}
									onClick={() => removeStop(i)}
								>
									<Minus className="h-3.5 w-3.5" />
								</Button>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
