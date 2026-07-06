import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateLayer, updateLayerData, updateCanvas } from "@/lib/store/slices/videoEditorSlice";
import {
	FONT_FAMILIES,
	FONT_WEIGHTS,
	TEXT_ALIGNMENTS,
	SHAPE_TYPES,
} from "@/lib/video-editor/constants";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import { DEFAULT_CANVAS_BACKGROUND } from "@/lib/video-editor/gradients";
import {
	BACKGROUND_GRADIENT_PRESETS,
	findBackgroundGradientPresetId,
} from "@/lib/video-editor/backgroundGradientPresets";
import PropertySelect from "./PropertySelect";
import BackgroundGradientSelect from "./BackgroundGradientSelect";
import { CapsuleSlider } from "@/components/ui/capsule-slider";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Field,
	RangeField,
	ColorField,
	PanelSection,
	FrameSection,
	TransformSection,
	TimingSection,
	SceneTimingSection,
	AppearanceStyleSection,
	LayerPanelHeader,
	ContentSection,
	Button,
} from "./property-panel/PropertyPanelSections";
import { AdvancedMotionSection } from "./property-panel/AdvancedMotionSection";

function CanvasProperties({ canvas, dispatch }) {
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

function TextContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-2.5">
			<Field label="Content">
				<Textarea
					value={data.content}
					onChange={(e) => patch({ content: e.target.value })}
					rows={3}
					className="text-sm resize-none"
				/>
			</Field>
			<div className="grid grid-cols-2 gap-2">
				<Field label="Font">
					<PropertySelect
						value={data.fontFamily}
						onChange={(fontFamily) => patch({ fontFamily })}
						options={FONT_FAMILIES.map((f) => ({ value: f, label: f }))}
						placeholder="Font"
					/>
				</Field>
				<Field label="Weight">
					<PropertySelect
						value={data.fontWeight}
						onChange={(fontWeight) => patch({ fontWeight })}
						options={FONT_WEIGHTS.map((w) => ({ value: w.value, label: w.label }))}
						placeholder="Weight"
					/>
				</Field>
			</div>
			<RangeField
				label="Font size"
				value={data.fontSize}
				min={12}
				max={120}
				onChange={(v) => patch({ fontSize: v })}
			/>
			<Field label="Alignment">
				<div className="flex gap-1">
					{TEXT_ALIGNMENTS.map((a) => (
						<Button
							key={a}
							type="button"
							size="sm"
							variant={data.align === a ? "default" : "outline"}
							className="flex-1 capitalize text-xs h-8"
							onClick={() => patch({ align: a })}
						>
							{a}
						</Button>
					))}
				</div>
			</Field>
			<ColorField label="Color" value={data.fill} fallback="#ffffff" onChange={(fill) => patch({ fill })} />
			<div className="flex flex-col gap-2">
				<RangeField
					label="Letter spacing"
					value={data.letterSpacing}
					min={-2}
					max={20}
					step={0.5}
					onChange={(v) => patch({ letterSpacing: v })}
				/>
				<RangeField
					label="Line height"
					value={data.lineHeight}
					min={0.8}
					max={3}
					step={0.1}
					onChange={(v) => patch({ lineHeight: v })}
				/>
			</div>
		</div>
	);
}

function ImageContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<Field label="Image URL">
			<Input
				value={data.src ?? ""}
				onChange={(e) => patch({ src: e.target.value })}
				placeholder="https://..."
				className="h-8 text-sm"
			/>
		</Field>
	);
}

function VideoContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-2.5">
			<Field label="Video URL">
				<Input
					value={data.src ?? ""}
					onChange={(e) => patch({ src: e.target.value })}
					placeholder="https://..."
					className="h-8 text-sm"
				/>
			</Field>
			<Field label="Label">
				<Input
					value={data.label ?? ""}
					onChange={(e) => patch({ label: e.target.value })}
					className="h-8 text-sm"
				/>
			</Field>
			<Field label="Audio">
				<div className="flex gap-1">
					<Button
						type="button"
						size="sm"
						variant={data.muted ? "outline" : "default"}
						className="flex-1 text-xs h-8"
						onClick={() => patch({ muted: false })}
					>
						Sound on
					</Button>
					<Button
						type="button"
						size="sm"
						variant={data.muted ? "default" : "outline"}
						className="flex-1 text-xs h-8"
						onClick={() => patch({ muted: true })}
					>
						Muted
					</Button>
				</div>
			</Field>
			{!data.muted && (
				<RangeField
					label="Volume"
					value={Math.round((data.volume ?? 1) * 100)}
					min={0}
					max={100}
					formatValue={(v) => `${v}%`}
					onChange={(v) => patch({ volume: v / 100 })}
				/>
			)}
		</div>
	);
}

function ShapeContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-2.5">
			<Field label="Shape">
				<PropertySelect
					value={data.shape}
					onChange={(shape) => patch({ shape })}
					options={SHAPE_TYPES.map((s) => ({
						value: s,
						label: s.charAt(0).toUpperCase() + s.slice(1),
					}))}
					placeholder="Shape"
				/>
			</Field>
			<ColorField label="Fill" value={data.fill} fallback="#ea580c" onChange={(fill) => patch({ fill })} />
			{data.shape === "rect" && (
				<RangeField
					label="Corner radius"
					value={data.cornerRadius}
					min={0}
					max={80}
					onChange={(v) => patch({ cornerRadius: v })}
				/>
			)}
		</div>
	);
}

function IconContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-2.5">
			<Field label="Icon">
				<div className="grid grid-cols-6 gap-1 max-h-28 overflow-y-auto border border-border rounded-md p-1.5">
					{EDITOR_ICONS.map((icon) => (
						<button
							key={icon}
							type="button"
							className={cn(
								"h-8 w-8 flex items-center justify-center text-lg border rounded-sm transition-colors",
								data.icon === icon
									? "border-primary bg-primary/10"
									: "border-transparent hover:border-border hover:bg-muted",
							)}
							onClick={() => patch({ icon })}
						>
							{icon}
						</button>
					))}
				</div>
			</Field>
			<ColorField label="Fill" value={data.fill} fallback="#fbbf24" onChange={(fill) => patch({ fill })} />
			<RangeField
				label="Icon size"
				value={data.fontSize ?? 48}
				min={16}
				max={120}
				onChange={(v) => patch({ fontSize: v })}
			/>
			<RangeField
				label="Letter spacing"
				value={data.letterSpacing ?? 0}
				min={-4}
				max={20}
				step={0.5}
				onChange={(v) => patch({ letterSpacing: v })}
			/>
		</div>
	);
}

function AudioContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-2.5">
			<Field label="Audio URL">
				<Input
					value={data.src}
					onChange={(e) => patch({ src: e.target.value })}
					placeholder="https://..."
					className="h-8 text-sm"
				/>
			</Field>
			<Field label="Label">
				<Input
					value={data.label}
					onChange={(e) => patch({ label: e.target.value })}
					className="h-8 text-sm"
				/>
			</Field>
		</div>
	);
}

function LayerContentSection({ layer, sceneId, dispatch }) {
	const contentByType = {
		text: <TextContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		image: <ImageContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		video: <VideoContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		shape: <ShapeContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		icon: <IconContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		audio: <AudioContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
	};

	const titles = {
		text: "Text",
		image: "Source",
		video: "Source",
		shape: "Shape",
		icon: "Icon",
		audio: "Source",
	};

	return (
		<ContentSection title={titles[layer.type] ?? "Content"}>
			{contentByType[layer.type]}
		</ContentSection>
	);
}

function LayerAppearanceSection({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	if (layer.type === "image" || layer.type === "video") {
		return <AppearanceStyleSection data={data} patch={patch} showObjectFit />;
	}

	if (layer.type === "icon") {
		return (
			<AppearanceStyleSection
				data={data}
				patch={patch}
				showStroke
				showBorderFill
				showCornerRadius
			/>
		);
	}

	return null;
}

export default function PropertyPanel() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId, selectedLayerIds, selectedLayerId } = useAppSelector(
		(s) => s.videoEditor,
	);

	const scene = project.scenes.find((s) => s.id === activeSceneId);
	const layer =
		selectedLayerIds.length === 1
			? scene?.layers.find((l) => l.id === selectedLayerId)
			: null;

	if (selectedLayerIds.length > 1) {
		return (
			<div className="flex h-full w-full flex-col overflow-y-auto bg-card">
				<div className="px-3 py-2.5 border-b border-border bg-muted/20">
					<p className="text-sm font-semibold text-foreground">
						{selectedLayerIds.length} layers selected
					</p>
					<p className="text-[10px] text-muted-foreground mt-0.5">
						Ctrl+click timeline clips to multi-select · Delete removes all
					</p>
				</div>
				<SceneTimingSection scene={scene} dispatch={dispatch} />
			</div>
		);
	}

	if (!layer) {
		return (
			<div className="flex h-full w-full flex-col overflow-y-auto bg-card">
				<div className="px-3 py-2.5 border-b border-border bg-muted/20">
					<p className="text-sm font-semibold text-foreground">Canvas</p>
					<p className="text-[10px] text-muted-foreground mt-0.5">
						Background & scene settings
					</p>
				</div>
				<PanelSection title="Background" defaultOpen sectionId="background">
					<CanvasProperties canvas={project.canvas} dispatch={dispatch} />
				</PanelSection>
				<SceneTimingSection scene={scene} dispatch={dispatch} />
				<div className="px-3 py-3 mt-auto">
					<p className="text-[10px] text-muted-foreground leading-relaxed">
						Select a layer to edit frame, appearance, transform & timing. Space play/pause,
						Delete remove layer.
					</p>
				</div>
			</div>
		);
	}

	const patchLayer = (changes) =>
		dispatch(updateLayer({ sceneId: activeSceneId, layerId: layer.id, changes }));

	const hasAppearance = ["image", "video", "icon"].includes(layer.type);

	return (
		<div className="flex h-full w-full flex-col overflow-y-auto bg-card">
			<LayerPanelHeader layer={layer} />

			<FrameSection layer={layer} onPatch={patchLayer} />

			<LayerContentSection layer={layer} sceneId={activeSceneId} dispatch={dispatch} />

			{hasAppearance && (
				<LayerAppearanceSection layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
			)}

			<TransformSection layer={layer} onPatch={patchLayer} />

			<TimingSection
				layer={layer}
				scene={scene}
				sceneId={activeSceneId}
				layerId={layer.id}
				dispatch={dispatch}
			/>

			<AdvancedMotionSection
				layer={layer}
				scene={scene}
				sceneId={activeSceneId}
				layerId={layer.id}
			/>

			<SceneTimingSection scene={scene} dispatch={dispatch} />
		</div>
	);
}
