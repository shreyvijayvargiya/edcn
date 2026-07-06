import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CapsuleSlider } from "@/components/ui/capsule-slider";
import PropertySelect from "../PropertySelect";
import EditorAnimationDropdown from "../EditorAnimationDropdown";
import {
	getLayerAnimationGroups,
	SCENE_TRANSITION_GROUPS,
	SCENE_ENTER_ANIMATION_GROUPS,
	MIN_ANIMATION_DURATION,
	MAX_ANIMATION_DURATION,
	MIN_TRANSITION_DURATION,
	MAX_TRANSITION_DURATION,
} from "@/lib/video-editor/animations";
import { updateLayer, updateLayerTiming, updateScene } from "@/lib/store/slices/videoEditorSlice";
import {
	IMAGE_OBJECT_FITS,
	IMAGE_OBJECT_POSITIONS,
	BORDER_STYLES,
} from "@/lib/video-editor/imageLayout";
import {
	Sparkles,
	Clapperboard,
	Film,
	ChevronDown,
	Maximize2,
	Move,
	Palette,
	Clock,
	Layers,
	FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SIZE = 20;
const MAX_SIZE = 4000;

export function Field({ label, children, className }) {
	return (
		<div className={cn("space-y-1", className)}>
			{label ? (
				<Label className="text-[10px] font-medium text-muted-foreground">{label}</Label>
			) : null}
			{children}
		</div>
	);
}

export function RangeField({ label, value, min, max, step = 1, onChange, formatValue }) {
	return (
		<CapsuleSlider
			label={label}
			value={value}
			min={min}
			max={max}
			step={step}
			onChange={onChange}
			formatValue={formatValue}
		/>
	);
}

export function ColorField({ label, value, onChange, fallback = "#ffffff" }) {
	const color = value && value !== "transparent" ? value : fallback;
	return (
		<Field label={label}>
			<div className="flex gap-1.5">
				<input
					type="color"
					value={color}
					onChange={(e) => onChange(e.target.value)}
					className="h-8 w-10 border border-border cursor-pointer shrink-0 rounded-sm"
				/>
				<Input
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					placeholder={fallback}
					className="flex-1 h-8 text-xs font-mono px-2"
				/>
			</div>
		</Field>
	);
}

function clampNum(value, fallback, min, max) {
	const n = Number.parseFloat(String(value));
	if (!Number.isFinite(n)) return fallback;
	return Math.max(min, Math.min(max, n));
}

function NumInput({ label, value, onCommit, min = -9999, max = 9999, step }) {
	const [draft, setDraft] = useState(String(Math.round(value ?? 0)));

	useEffect(() => {
		setDraft(Number.isInteger(value) ? String(value) : String(Math.round((value ?? 0) * 10) / 10));
	}, [value]);

	const commit = () => onCommit(clampNum(draft, value, min, max));

	return (
		<Field label={label}>
			<Input
				type="number"
				min={min}
				max={max}
				step={step}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
				className="h-8 text-xs font-mono px-2"
			/>
		</Field>
	);
}

export function PanelSection({ title, icon: Icon, children, defaultOpen = true, className }) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className={cn("border-b border-border", className)}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
			>
				{Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : null}
				<span className="flex-1 text-[11px] font-semibold text-foreground">{title}</span>
				<ChevronDown
					className={cn(
						"h-3.5 w-3.5 text-muted-foreground transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>
			{open ? <div className="px-3 pb-3 space-y-2.5">{children}</div> : null}
		</div>
	);
}

/** Figma-style W/H and X/Y grid at the top */
export function FrameSection({ layer, onPatch }) {
	return (
		<PanelSection title="Frame" icon={Maximize2} defaultOpen>
			<div className="grid grid-cols-2 gap-2">
				<NumInput
					label="W"
					value={layer.width}
					min={MIN_SIZE}
					max={MAX_SIZE}
					onCommit={(v) => onPatch({ width: Math.round(v) })}
				/>
				<NumInput
					label="H"
					value={layer.height}
					min={MIN_SIZE}
					max={MAX_SIZE}
					onCommit={(v) => onPatch({ height: Math.round(v) })}
				/>
				<NumInput
					label="X"
					value={Math.round(layer.x ?? 0)}
					min={-9999}
					max={9999}
					onCommit={(v) => onPatch({ x: Math.round(v) })}
				/>
				<NumInput
					label="Y"
					value={Math.round(layer.y ?? 0)}
					min={-9999}
					max={9999}
					onCommit={(v) => onPatch({ y: Math.round(v) })}
				/>
			</div>
		</PanelSection>
	);
}

export function TransformSection({ layer, onPatch }) {
	return (
		<PanelSection title="Transform" icon={Move} defaultOpen>
			<RangeField
				label="Rotation"
				value={Math.round(layer.rotation ?? 0)}
				min={-180}
				max={180}
				onChange={(v) => onPatch({ rotation: v })}
			/>
			<RangeField
				label="Opacity"
				value={Math.round((layer.opacity ?? 1) * 100)}
				min={0}
				max={100}
				formatValue={(v) => `${v}%`}
				onChange={(v) => onPatch({ opacity: v / 100 })}
			/>
		</PanelSection>
	);
}

function TimingCheckbox({ label, checked, onChange }) {
	return (
		<label className="flex items-center gap-2 cursor-pointer select-none">
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="h-3.5 w-3.5 rounded border-border accent-primary"
			/>
			<span className="text-[10px] text-muted-foreground">{label}</span>
		</label>
	);
}

export function TimingSection({ layer, scene, sceneId, layerId, dispatch }) {
	const sceneDuration = scene?.duration ?? 5;
	const startTime = layer.startTime ?? 0;
	const clipDuration = layer.clipDuration ?? sceneDuration;
	const endTime = Math.min(startTime + clipDuration, sceneDuration);
	const pinStart = layer.timingPinStart ?? false;
	const pinEnd = layer.timingPinEnd ?? false;

	const patchTiming = (patch) =>
		dispatch(updateLayerTiming({ sceneId, layerId, ...patch }));

	const patchLayerMeta = (changes) =>
		dispatch(updateLayer({ sceneId, layerId, changes }));

	const anim = layer.animation ?? { preset: "none", duration: 0.6 };
	const patchAnim = (patch) =>
		dispatch(
			updateLayer({
				sceneId,
				layerId,
				changes: { animation: { ...anim, ...patch } },
			}),
		);

	const groups = getLayerAnimationGroups(layer.type);

	return (
		<PanelSection title="Timing" icon={Clock} defaultOpen>
			<div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
				<TimingCheckbox
					label="Pin start"
					checked={pinStart}
					onChange={(timingPinStart) => patchLayerMeta({ timingPinStart })}
				/>
				<RangeField
					label="Start (sec)"
					value={Math.round(startTime * 10) / 10}
					min={0}
					max={Math.max(0, sceneDuration - 0.25)}
					step={0.1}
					onChange={(v) => {
						const nextStart = v;
						let nextDuration = clipDuration;
						if (pinEnd) {
							nextDuration = Math.max(0.25, endTime - nextStart);
						}
						patchTiming({ startTime: nextStart, clipDuration: nextDuration });
					}}
				/>
				<TimingCheckbox
					label="Pin end"
					checked={pinEnd}
					onChange={(checked) => {
						if (checked) {
							patchLayerMeta({ timingPinEnd: true });
							patchTiming({ clipDuration: Math.max(0.25, sceneDuration - startTime) });
						} else {
							patchLayerMeta({ timingPinEnd: false });
						}
					}}
				/>
				<NumInput
					label="End (sec)"
					value={Math.round(endTime * 10) / 10}
					min={startTime + 0.25}
					max={sceneDuration}
					step={0.1}
					onCommit={(v) => {
						patchLayerMeta({ timingPinEnd: false });
						patchTiming({ clipDuration: Math.max(0.25, v - startTime) });
					}}
				/>
				<RangeField
					label="Duration (sec)"
					value={Math.round(clipDuration * 10) / 10}
					min={0.25}
					max={Math.max(0.25, sceneDuration - startTime)}
					step={0.1}
					onChange={(v) => {
						patchLayerMeta({ timingPinEnd: false });
						patchTiming({ clipDuration: v });
					}}
				/>
			</div>

			<div className="pt-1 space-y-2">
				<p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
					<Sparkles className="h-3 w-3" />
					Enter animation
				</p>
				<EditorAnimationDropdown
					value={anim.preset}
					onChange={(preset) => patchAnim({ preset })}
					groups={groups}
					placeholder="Select animation…"
				/>
				{anim.preset !== "none" && (
					<RangeField
						label="Anim duration (sec)"
						value={Math.round((anim.duration ?? 0.6) * 10) / 10}
						min={MIN_ANIMATION_DURATION}
						max={MAX_ANIMATION_DURATION}
						step={0.1}
						onChange={(v) => patchAnim({ duration: v })}
					/>
				)}
			</div>
		</PanelSection>
	);
}

export function SceneTimingSection({ scene, dispatch }) {
	if (!scene) return null;
	const enter = scene.enterAnimation ?? { preset: "none", duration: 0.6 };
	const tr = scene.transition ?? { type: "none", duration: 0.5 };

	const patchEnter = (patch) =>
		dispatch(
			updateScene({ sceneId: scene.id, changes: { enterAnimation: { ...enter, ...patch } } }),
		);
	const patchTransition = (patch) =>
		dispatch(updateScene({ sceneId: scene.id, changes: { transition: { ...tr, ...patch } } }));

	return (
		<PanelSection title="Scene" icon={Layers} defaultOpen={false}>
			<div className="space-y-3">
				<div className="space-y-2">
					<p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
						<Film className="h-3 w-3" />
						Enter · {scene.name}
					</p>
					<EditorAnimationDropdown
						value={enter.preset}
						onChange={(preset) => patchEnter({ preset })}
						groups={SCENE_ENTER_ANIMATION_GROUPS}
						placeholder="Scene intro…"
					/>
					{enter.preset !== "none" && (
						<RangeField
							label="Intro duration (sec)"
							value={Math.round((enter.duration ?? 0.6) * 10) / 10}
							min={MIN_ANIMATION_DURATION}
							max={MAX_ANIMATION_DURATION}
							step={0.1}
							onChange={(v) => patchEnter({ duration: v })}
						/>
					)}
				</div>
				<div className="space-y-2">
					<p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
						<Clapperboard className="h-3 w-3" />
						Transition
					</p>
					<EditorAnimationDropdown
						value={tr.type}
						onChange={(type) => patchTransition({ type })}
						groups={SCENE_TRANSITION_GROUPS}
						placeholder="Between scenes…"
					/>
					{tr.type !== "none" && (
						<RangeField
							label="Transition duration (sec)"
							value={Math.round((tr.duration ?? 0.5) * 10) / 10}
							min={MIN_TRANSITION_DURATION}
							max={MAX_TRANSITION_DURATION}
							step={0.1}
							onChange={(v) => patchTransition({ duration: v })}
						/>
					)}
				</div>
			</div>
		</PanelSection>
	);
}

/** Border → Ring → Shadow (Figma effects order) */
export function AppearanceStyleSection({
	data,
	patch,
	showObjectFit = false,
	showStroke = false,
	showBorderFill = false,
	showCornerRadius = true,
}) {
	return (
		<PanelSection title="Appearance" icon={Palette} defaultOpen>
			{showCornerRadius && !showObjectFit && (
				<RangeField
					label="Corner radius"
					value={data.borderRadius ?? 0}
					min={0}
					max={100}
					onChange={(v) => patch({ borderRadius: v })}
				/>
			)}

			{showObjectFit && (
				<>
					<div className="grid grid-cols-2 gap-2">
						<Field label="Object fit">
							<PropertySelect
								value={data.objectFit ?? "cover"}
								onChange={(objectFit) => patch({ objectFit })}
								options={IMAGE_OBJECT_FITS}
								placeholder="Fit"
							/>
						</Field>
						<Field label="Position">
							<PropertySelect
								value={data.objectPosition ?? "center"}
								onChange={(objectPosition) => patch({ objectPosition })}
								options={IMAGE_OBJECT_POSITIONS}
								placeholder="Position"
							/>
						</Field>
					</div>
					<RangeField
						label="Corner radius"
						value={data.borderRadius ?? 0}
						min={0}
						max={100}
						onChange={(v) => patch({ borderRadius: v })}
					/>
				</>
			)}

			{showStroke && (
				<>
					<p className="text-[10px] font-semibold text-muted-foreground pt-0.5">Stroke</p>
					<RangeField
						label="Width"
						value={data.strokeWidth ?? 0}
						min={0}
						max={12}
						step={0.5}
						onChange={(v) => patch({ strokeWidth: v })}
					/>
					{(data.strokeWidth ?? 0) > 0 && (
						<ColorField
							label="Color"
							value={data.stroke}
							fallback="#000000"
							onChange={(stroke) => patch({ stroke })}
						/>
					)}
				</>
			)}

			<p className="text-[10px] font-semibold text-muted-foreground pt-0.5">Border</p>
			<RangeField
				label="Width"
				value={data.borderWidth ?? 0}
				min={0}
				max={12}
				step={0.5}
				onChange={(v) => patch({ borderWidth: v })}
			/>
			{(data.borderWidth ?? 0) > 0 && (
				<>
					<ColorField
						label="Color"
						value={data.borderColor}
						fallback="#ffffff"
						onChange={(borderColor) => patch({ borderColor })}
					/>
					<Field label="Style">
						<PropertySelect
							value={data.borderStyle ?? "solid"}
							onChange={(borderStyle) => patch({ borderStyle })}
							options={BORDER_STYLES}
							placeholder="Style"
						/>
					</Field>
					{showBorderFill && (
						<ColorField
							label="Fill"
							value={data.borderFill}
							fallback="transparent"
							onChange={(borderFill) => patch({ borderFill })}
						/>
					)}
				</>
			)}

			<p className="text-[10px] font-semibold text-muted-foreground pt-1">Ring</p>
			<RangeField
				label="Width"
				value={data.ringWidth ?? 0}
				min={0}
				max={12}
				step={0.5}
				onChange={(v) => patch({ ringWidth: v })}
			/>
			{(data.ringWidth ?? 0) > 0 && (
				<>
					<ColorField
						label="Color"
						value={data.ringColor}
						fallback="#ffffff"
						onChange={(ringColor) => patch({ ringColor })}
					/>
					<div className="grid grid-cols-2 gap-2">
						<RangeField
							label="Radius"
							value={data.ringRadius ?? data.borderRadius ?? 0}
							min={0}
							max={100}
							onChange={(v) => patch({ ringRadius: v })}
						/>
						<RangeField
							label="Offset"
							value={data.ringOffset ?? 4}
							min={0}
							max={24}
							onChange={(v) => patch({ ringOffset: v })}
						/>
					</div>
				</>
			)}

			<p className="text-[10px] font-semibold text-muted-foreground pt-1">Shadow</p>
			<RangeField
				label="Blur"
				value={data.shadowBlur ?? 0}
				min={0}
				max={40}
				onChange={(v) => patch({ shadowBlur: v })}
			/>
			{(data.shadowBlur ?? 0) > 0 && (
				<>
					<ColorField
						label="Color"
						value={data.shadowColor}
						fallback="rgba(0,0,0,0.35)"
						onChange={(shadowColor) => patch({ shadowColor })}
					/>
					<div className="grid grid-cols-2 gap-2">
						<RangeField
							label="X"
							value={data.shadowOffsetX ?? 0}
							min={-30}
							max={30}
							onChange={(v) => patch({ shadowOffsetX: v })}
						/>
						<RangeField
							label="Y"
							value={data.shadowOffsetY ?? 0}
							min={-30}
							max={30}
							onChange={(v) => patch({ shadowOffsetY: v })}
						/>
					</div>
				</>
			)}
		</PanelSection>
	);
}

export function LayerPanelHeader({ layer }) {
	const typeLabels = {
		text: "Text",
		image: "Image",
		video: "Video",
		audio: "Audio",
		shape: "Shape",
		icon: "Icon",
	};
	return (
		<div className="px-3 py-2.5 border-b border-border bg-muted/20">
			<p className="text-sm font-semibold text-foreground">
				{typeLabels[layer.type] ?? layer.type}
			</p>
			<p className="text-[10px] text-muted-foreground mt-0.5">Layer properties</p>
		</div>
	);
}

export function ContentSection({ title = "Content", children }) {
	return (
		<PanelSection title={title} icon={FileText} defaultOpen>
			{children}
		</PanelSection>
	);
}

export { Button };
