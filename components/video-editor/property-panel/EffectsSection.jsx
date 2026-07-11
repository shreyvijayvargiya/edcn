import { Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PropertySelect from "../PropertySelect";
import {
	PanelSection,
	Field,
	RangeField,
	ColorField,
} from "./PropertyPanelSections";
import {
	COLOR_GRADE_PRESETS,
	MASK_TYPES,
	PARTICLE_PRESETS,
	resolveMediaEffects,
} from "@/lib/video-editor/mediaEffects";

/**
 * Advanced effects for image/video layers: grade, blur, glow, vignette,
 * masks, feathered crop, chroma key, particles.
 */
export default function EffectsSection({ data, patch }) {
	const effects = resolveMediaEffects(data);

	const patchEffects = (partial) => {
		patch({
			effects: {
				...effects,
				...partial,
			},
		});
	};

	const patchNested = (key, partial) => {
		patchEffects({
			[key]: {
				...effects[key],
				...partial,
			},
		});
	};

	return (
		<PanelSection title="Effects" icon={Sparkles} defaultOpen={false} sectionId="effects">
			<label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
				<Checkbox
					checked={effects.enabled !== false}
					onCheckedChange={(checked) => patchEffects({ enabled: checked === true })}
				/>
				Enable effects
			</label>

			{effects.enabled !== false && (
				<>
					<p className="text-[10px] font-semibold text-muted-foreground pt-1">Color grading</p>
					<Field label="LUT / look">
						<PropertySelect
							value={effects.colorGrade.preset}
							onChange={(preset) => patchNested("colorGrade", { preset })}
							options={COLOR_GRADE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
						/>
					</Field>
					<RangeField
						label="Brightness"
						value={effects.colorGrade.brightness}
						min={-0.5}
						max={0.5}
						step={0.01}
						onChange={(brightness) => patchNested("colorGrade", { brightness })}
					/>
					<RangeField
						label="Contrast"
						value={effects.colorGrade.contrast}
						min={-50}
						max={50}
						step={1}
						onChange={(contrast) => patchNested("colorGrade", { contrast })}
					/>
					<RangeField
						label="Saturation"
						value={effects.colorGrade.saturation}
						min={-1}
						max={1}
						step={0.01}
						onChange={(saturation) => patchNested("colorGrade", { saturation })}
					/>
					<RangeField
						label="Hue"
						value={effects.colorGrade.hue}
						min={-180}
						max={180}
						step={1}
						onChange={(hue) => patchNested("colorGrade", { hue })}
					/>
					{effects.colorGrade.preset !== "none" && (
						<RangeField
							label="LUT intensity"
							value={effects.colorGrade.lutIntensity}
							min={0}
							max={1}
							step={0.01}
							onChange={(lutIntensity) => patchNested("colorGrade", { lutIntensity })}
						/>
					)}

					<p className="text-[10px] font-semibold text-muted-foreground pt-2">Blur & glow</p>
					<label className="flex items-center gap-2 text-xs cursor-pointer">
						<Checkbox
							checked={Boolean(effects.blur.enabled)}
							onCheckedChange={(checked) =>
								patchNested("blur", { enabled: checked === true })
							}
						/>
						Gaussian blur
					</label>
					{effects.blur.enabled && (
						<RangeField
							label="Blur radius"
							value={effects.blur.radius}
							min={0}
							max={40}
							step={0.5}
							onChange={(radius) => patchNested("blur", { radius })}
						/>
					)}
					<label className="flex items-center gap-2 text-xs cursor-pointer">
						<Checkbox
							checked={Boolean(effects.glow.enabled)}
							onCheckedChange={(checked) =>
								patchNested("glow", { enabled: checked === true })
							}
						/>
						Outer glow
					</label>
					{effects.glow.enabled && (
						<>
							<RangeField
								label="Glow radius"
								value={effects.glow.radius}
								min={0}
								max={60}
								step={1}
								onChange={(radius) => patchNested("glow", { radius })}
							/>
							<RangeField
								label="Glow intensity"
								value={effects.glow.intensity}
								min={0}
								max={1}
								step={0.01}
								onChange={(intensity) => patchNested("glow", { intensity })}
							/>
							<ColorField
								label="Glow color"
								value={effects.glow.color}
								onChange={(color) => patchNested("glow", { color })}
							/>
						</>
					)}

					<p className="text-[10px] font-semibold text-muted-foreground pt-2">Vignette</p>
					<label className="flex items-center gap-2 text-xs cursor-pointer">
						<Checkbox
							checked={Boolean(effects.vignette.enabled)}
							onCheckedChange={(checked) =>
								patchNested("vignette", { enabled: checked === true })
							}
						/>
						Vignette
					</label>
					{effects.vignette.enabled && (
						<>
							<RangeField
								label="Amount"
								value={effects.vignette.amount}
								min={0}
								max={1}
								step={0.01}
								onChange={(amount) => patchNested("vignette", { amount })}
							/>
							<RangeField
								label="Softness"
								value={effects.vignette.softness}
								min={0.05}
								max={1}
								step={0.01}
								onChange={(softness) => patchNested("vignette", { softness })}
							/>
							<ColorField
								label="Color"
								value={effects.vignette.color}
								onChange={(color) => patchNested("vignette", { color })}
							/>
						</>
					)}

					<p className="text-[10px] font-semibold text-muted-foreground pt-2">Mask & crop</p>
					<Field label="Matte shape">
						<PropertySelect
							value={effects.mask.type}
							onChange={(type) => patchNested("mask", { type })}
							options={MASK_TYPES.map((p) => ({ value: p.id, label: p.label }))}
						/>
					</Field>
					{effects.mask.type !== "none" && (
						<RangeField
							label="Mask inset"
							value={effects.mask.feather}
							min={0}
							max={0.45}
							step={0.01}
							onChange={(feather) => patchNested("mask", { feather })}
						/>
					)}
					<label className="flex items-center gap-2 text-xs cursor-pointer">
						<Checkbox
							checked={Boolean(effects.cropFeather.enabled)}
							onCheckedChange={(checked) =>
								patchNested("cropFeather", { enabled: checked === true })
							}
						/>
						Crop with feather
					</label>
					{effects.cropFeather.enabled && (
						<RangeField
							label="Feather amount"
							value={effects.cropFeather.amount}
							min={0}
							max={1}
							step={0.01}
							onChange={(amount) => patchNested("cropFeather", { amount })}
						/>
					)}

					<p className="text-[10px] font-semibold text-muted-foreground pt-2">Chroma key</p>
					<label className="flex items-center gap-2 text-xs cursor-pointer">
						<Checkbox
							checked={Boolean(effects.chromaKey.enabled)}
							onCheckedChange={(checked) =>
								patchNested("chromaKey", { enabled: checked === true })
							}
						/>
						Green / color key
					</label>
					{effects.chromaKey.enabled && (
						<>
							<ColorField
								label="Key color"
								value={effects.chromaKey.keyColor}
								onChange={(keyColor) => patchNested("chromaKey", { keyColor })}
							/>
							<RangeField
								label="Similarity"
								value={effects.chromaKey.similarity}
								min={0.05}
								max={0.9}
								step={0.01}
								onChange={(similarity) => patchNested("chromaKey", { similarity })}
							/>
							<RangeField
								label="Smoothness"
								value={effects.chromaKey.smoothness}
								min={0}
								max={0.5}
								step={0.01}
								onChange={(smoothness) => patchNested("chromaKey", { smoothness })}
							/>
							<RangeField
								label="Spill suppress"
								value={effects.chromaKey.spill}
								min={0}
								max={1}
								step={0.01}
								onChange={(spill) => patchNested("chromaKey", { spill })}
							/>
						</>
					)}

					<p className="text-[10px] font-semibold text-muted-foreground pt-2">Light particles</p>
					<label className="flex items-center gap-2 text-xs cursor-pointer">
						<Checkbox
							checked={Boolean(effects.particles.enabled)}
							onCheckedChange={(checked) =>
								patchNested("particles", { enabled: checked === true })
							}
						/>
						Particle overlay
					</label>
					{effects.particles.enabled && (
						<>
							<Field label="Preset">
								<PropertySelect
									value={effects.particles.preset}
									onChange={(preset) => patchNested("particles", { preset })}
									options={PARTICLE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
								/>
							</Field>
							<RangeField
								label="Count"
								value={effects.particles.count}
								min={4}
								max={100}
								step={1}
								onChange={(count) => patchNested("particles", { count })}
							/>
						</>
					)}
				</>
			)}
		</PanelSection>
	);
}
