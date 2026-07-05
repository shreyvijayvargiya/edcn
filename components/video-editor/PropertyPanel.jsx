import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	updateLayer,
	updateLayerData,
	updateCanvas,
	updateLayerTiming,
	updateScene,
} from "@/lib/store/slices/videoEditorSlice";
import {
	FONT_FAMILIES,
	FONT_WEIGHTS,
	TEXT_ALIGNMENTS,
	SHAPE_TYPES,
} from "@/lib/video-editor/constants";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import {
	DEFAULT_CANVAS_BACKGROUND,
	gradientCssPreview,
} from "@/lib/video-editor/gradients";
import {
	LAYER_ANIMATION_GROUPS,
	SCENE_TRANSITION_GROUPS,
	SCENE_ENTER_ANIMATION_GROUPS,
	MIN_ANIMATION_DURATION,
	MAX_ANIMATION_DURATION,
	MIN_TRANSITION_DURATION,
	MAX_TRANSITION_DURATION,
} from "@/lib/video-editor/animations";
import EditorAnimationDropdown from "./EditorAnimationDropdown";
import { Plus, Minus, Sparkles, Clapperboard, Film } from "lucide-react";
import { cn } from "@/lib/utils";

function Field({ label, children }) {
	return (
		<div className="space-y-1.5">
			<Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
				{label}
			</Label>
			{children}
		</div>
	);
}

function RangeField({ label, value, min, max, step = 1, onChange }) {
	return (
		<Field label={label}>
			<div className="flex items-center gap-2">
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					className="flex-1 accent-primary"
				/>
				<span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
					{value}
				</span>
			</div>
		</Field>
	);
}

function LayerAnimationProperties({ layer, sceneId, dispatch }) {
	const anim = layer.animation ?? { preset: "none", duration: 0.6 };
	const patchAnim = (patch) =>
		dispatch(
			updateLayer({
				sceneId,
				layerId: layer.id,
				changes: { animation: { ...anim, ...patch } },
			}),
		);

	const isText = layer.type === "text";
	const groups = isText
		? LAYER_ANIMATION_GROUPS
		: LAYER_ANIMATION_GROUPS.map((g) => ({
				...g,
				options: g.options.filter((p) => p.id !== "typewriter"),
			})).filter((g) => g.options.length > 0);

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Sparkles className="h-3.5 w-3.5 text-primary" />
				<p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
					Enter animation
				</p>
			</div>
			<EditorAnimationDropdown
				value={anim.preset}
				onChange={(preset) => patchAnim({ preset })}
				groups={groups}
				placeholder="Select animation…"
			/>
			{anim.preset !== "none" && (
				<RangeField
					label="Duration (sec)"
					value={Math.round((anim.duration ?? 0.6) * 10) / 10}
					min={MIN_ANIMATION_DURATION}
					max={MAX_ANIMATION_DURATION}
					step={0.1}
					onChange={(v) => patchAnim({ duration: v })}
				/>
			)}
		</div>
	);
}

function SceneEnterAnimationProperties({ scene, dispatch }) {
	if (!scene) return null;
	const enter = scene.enterAnimation ?? { preset: "none", duration: 0.6 };
	const patch = (patch) =>
		dispatch(
			updateScene({ sceneId: scene.id, changes: { enterAnimation: { ...enter, ...patch } } }),
		);

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Film className="h-3.5 w-3.5 text-primary" />
				<p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
					Scene enter animation
				</p>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed">
				Intro for <span className="font-semibold">{scene.name}</span> at scene start
			</p>
			<EditorAnimationDropdown
				value={enter.preset}
				onChange={(preset) => patch({ preset })}
				groups={SCENE_ENTER_ANIMATION_GROUPS}
				placeholder="Select intro…"
			/>
			{enter.preset !== "none" && (
				<RangeField
					label="Intro duration (sec)"
					value={Math.round((enter.duration ?? 0.6) * 10) / 10}
					min={MIN_ANIMATION_DURATION}
					max={MAX_ANIMATION_DURATION}
					step={0.1}
					onChange={(v) => patch({ duration: v })}
				/>
			)}
		</div>
	);
}

function SceneTransitionProperties({ scene, dispatch }) {
	if (!scene) return null;
	const tr = scene.transition ?? { type: "none", duration: 0.5 };
	const patch = (patch) =>
		dispatch(updateScene({ sceneId: scene.id, changes: { transition: { ...tr, ...patch } } }));

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Clapperboard className="h-3.5 w-3.5 text-primary" />
				<p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
					Scene transition
				</p>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed">
				Between scenes · applies to <span className="font-semibold">{scene.name}</span>
			</p>
			<EditorAnimationDropdown
				value={tr.type}
				onChange={(type) => patch({ type })}
				groups={SCENE_TRANSITION_GROUPS}
				placeholder="Select transition…"
			/>
			{tr.type !== "none" && (
				<RangeField
					label="Transition duration (sec)"
					value={Math.round((tr.duration ?? 0.5) * 10) / 10}
					min={MIN_TRANSITION_DURATION}
					max={MAX_TRANSITION_DURATION}
					step={0.1}
					onChange={(v) => patch({ duration: v })}
				/>
			)}
		</div>
	);
}

function CanvasProperties({ canvas, dispatch }) {
	const bg = canvas?.background ?? DEFAULT_CANVAS_BACKGROUND;
	const isGradient = bg.type === "gradient";
	const gradient = bg.gradient ?? DEFAULT_CANVAS_BACKGROUND.gradient;
	const stops = gradient.stops ?? DEFAULT_CANVAS_BACKGROUND.gradient.stops;

	const patchBg = (patch) => {
		dispatch(
			updateCanvas({
				background: { ...bg, ...patch },
			}),
		);
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

	return (
		<div className="space-y-3">
			<Field label="Background type">
				<div className="flex gap-1">
					{["solid", "gradient"].map((t) => (
						<Button
							key={t}
							type="button"
							size="sm"
							variant={bg.type === t ? "default" : "outline"}
							className="flex-1 capitalize text-xs"
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
				<Field label="Solid color">
					<div className="flex gap-2">
						<input
							type="color"
							value={bg.fill ?? "#18181b"}
							onChange={(e) => patchBg({ fill: e.target.value })}
							className="h-9 w-12 border-2 border-border cursor-pointer"
						/>
						<Input
							value={bg.fill ?? "#18181b"}
							onChange={(e) => patchBg({ fill: e.target.value })}
							className="flex-1 text-sm font-mono"
						/>
					</div>
				</Field>
			) : (
				<>
					<Field label="Gradient type">
						<div className="flex gap-1">
							{["linear", "radial"].map((t) => (
								<Button
									key={t}
									type="button"
									size="sm"
									variant={gradient.type === t ? "default" : "outline"}
									className="flex-1 capitalize text-xs"
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
					<Field label="Preview">
						<div
							className="h-12 w-full border-2 border-border rounded-sm"
							style={{ background: gradientCssPreview(bg) }}
						/>
					</Field>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
								Color stops
							</p>
							<Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={addStop}>
								<Plus className="h-3.5 w-3.5" />
							</Button>
						</div>
						{stops.map((stop, i) => (
							<div key={i} className="flex items-center gap-1.5 border-2 border-border p-1.5">
								<input
									type="color"
									value={stop.color}
									onChange={(e) => updateStop(i, { color: e.target.value })}
									className="h-8 w-10 border border-border cursor-pointer shrink-0"
								/>
								<div className="flex-1 min-w-0">
									<Label className="text-[9px] text-muted-foreground">
										{Math.round(stop.offset * 100)}%
									</Label>
									<input
										type="range"
										min={0}
										max={100}
										value={Math.round(stop.offset * 100)}
										onChange={(e) =>
											updateStop(i, { offset: Number(e.target.value) / 100 })
										}
										className="w-full accent-primary h-1"
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

function TextProperties({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-3">
			<Field label="Content">
				<Textarea
					value={data.content}
					onChange={(e) => patch({ content: e.target.value })}
					rows={3}
					className="text-sm resize-none"
				/>
			</Field>
			<Field label="Font family">
				<select
					value={data.fontFamily}
					onChange={(e) => patch({ fontFamily: e.target.value })}
					className="w-full border-2 border-border bg-background px-2 py-1.5 text-sm"
				>
					{FONT_FAMILIES.map((f) => (
						<option key={f} value={f}>
							{f}
						</option>
					))}
				</select>
			</Field>
			<div className="grid grid-cols-2 gap-2">
				<RangeField
					label="Size"
					value={data.fontSize}
					min={12}
					max={120}
					onChange={(v) => patch({ fontSize: v })}
				/>
				<Field label="Weight">
					<select
						value={data.fontWeight}
						onChange={(e) => patch({ fontWeight: Number(e.target.value) })}
						className="w-full border-2 border-border bg-background px-2 py-1.5 text-sm"
					>
						{FONT_WEIGHTS.map((w) => (
							<option key={w.value} value={w.value}>
								{w.label}
							</option>
						))}
					</select>
				</Field>
			</div>
			<Field label="Alignment">
				<div className="flex gap-1">
					{TEXT_ALIGNMENTS.map((a) => (
						<Button
							key={a}
							type="button"
							size="sm"
							variant={data.align === a ? "default" : "outline"}
							className="flex-1 capitalize text-xs"
							onClick={() => patch({ align: a })}
						>
							{a}
						</Button>
					))}
				</div>
			</Field>
			<Field label="Color">
				<div className="flex gap-2">
					<input
						type="color"
						value={data.fill}
						onChange={(e) => patch({ fill: e.target.value })}
						className="h-9 w-12 border-2 border-border cursor-pointer"
					/>
					<Input
						value={data.fill}
						onChange={(e) => patch({ fill: e.target.value })}
						className="flex-1 text-sm font-mono"
					/>
				</div>
			</Field>
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
	);
}

function ImageProperties({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-3">
			<Field label="Image URL">
				<Input
					value={data.src}
					onChange={(e) => patch({ src: e.target.value })}
					placeholder="https://..."
					className="text-sm"
				/>
			</Field>
			<RangeField
				label="Border radius"
				value={data.borderRadius}
				min={0}
				max={100}
				onChange={(v) => patch({ borderRadius: v })}
			/>
		</div>
	);
}

function ShapeProperties({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-3">
			<Field label="Shape">
				<select
					value={data.shape}
					onChange={(e) => patch({ shape: e.target.value })}
					className="w-full border-2 border-border bg-background px-2 py-1.5 text-sm"
				>
					{SHAPE_TYPES.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</Field>
			<Field label="Fill">
				<input
					type="color"
					value={data.fill}
					onChange={(e) => patch({ fill: e.target.value })}
					className="h-9 w-full border-2 border-border cursor-pointer"
				/>
			</Field>
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

function IconProperties({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-3">
			<Field label="Pick icon">
				<div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto border-2 border-border p-1.5">
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
			<RangeField
				label="Size"
				value={data.fontSize}
				min={16}
				max={120}
				onChange={(v) => patch({ fontSize: v })}
			/>
			<Field label="Color">
				<input
					type="color"
					value={data.fill}
					onChange={(e) => patch({ fill: e.target.value })}
					className="h-9 w-full border-2 border-border cursor-pointer"
				/>
			</Field>
		</div>
	);
}

function MediaProperties({ layer, sceneId, dispatch, kind }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<div className="space-y-3">
			<Field label={`${kind} URL`}>
				<Input
					value={data.src}
					onChange={(e) => patch({ src: e.target.value })}
					placeholder="https://..."
					className="text-sm"
				/>
			</Field>
			<Field label="Label">
				<Input
					value={data.label}
					onChange={(e) => patch({ label: e.target.value })}
					className="text-sm"
				/>
			</Field>
		</div>
	);
}

export default function PropertyPanel() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId, selectedLayerId } = useAppSelector(
		(s) => s.videoEditor,
	);

	const scene = project.scenes.find((s) => s.id === activeSceneId);
	const layer = scene?.layers.find((l) => l.id === selectedLayerId);

	if (!layer) {
		return (
			<aside className="w-64 shrink-0 border-l-2 border-border bg-card flex flex-col overflow-y-auto">
				<div className="p-3 border-b-2 border-border">
					<p className="text-sm font-semibold text-foreground">Canvas</p>
					<p className="text-[10px] text-muted-foreground mt-0.5">
						Background & gradient · click canvas to focus shortcuts
					</p>
				</div>
				<div className="p-3">
					<CanvasProperties canvas={project.canvas} dispatch={dispatch} />
				</div>
				<Separator />
				<div className="p-3">
					<SceneEnterAnimationProperties scene={scene} dispatch={dispatch} />
				</div>
				<Separator />
				<div className="p-3">
					<SceneTransitionProperties scene={scene} dispatch={dispatch} />
				</div>
				<Separator />
				<div className="p-3">
					<p className="text-xs text-muted-foreground">
						Select a layer to edit properties and enter animations. Shortcuts: Space
						play/pause, Delete remove, ⌘] forward, ⌘[ backward.
					</p>
				</div>
			</aside>
		);
	}

	const patchLayer = (changes) =>
		dispatch(updateLayer({ sceneId: activeSceneId, layerId: layer.id, changes }));

	return (
		<aside className="w-64 shrink-0 border-l-2 border-border bg-card flex flex-col overflow-y-auto">
			<div className="p-3 space-y-3">
				<RangeField
					label="Opacity"
					value={Math.round(layer.opacity * 100)}
					min={0}
					max={100}
					onChange={(v) => patchLayer({ opacity: v / 100 })}
				/>
				<RangeField
					label="Rotation"
					value={Math.round(layer.rotation)}
					min={-180}
					max={180}
					onChange={(v) => patchLayer({ rotation: v })}
				/>
				<RangeField
					label="Start (sec)"
					value={Math.round((layer.startTime || 0) * 10) / 10}
					min={0}
					max={Math.max(0, (scene?.duration ?? 5) - 0.25)}
					step={0.1}
					onChange={(v) =>
						dispatch(
							updateLayerTiming({
								sceneId: activeSceneId,
								layerId: layer.id,
								startTime: v,
							}),
						)
					}
				/>
				<RangeField
					label="Duration (sec)"
					value={Math.round((layer.clipDuration ?? scene?.duration ?? 5) * 10) / 10}
					min={0.25}
					max={scene?.duration ?? 5}
					step={0.1}
					onChange={(v) =>
						dispatch(
							updateLayerTiming({
								sceneId: activeSceneId,
								layerId: layer.id,
								clipDuration: v,
							}),
						)
					}
				/>

				<Separator />

				{layer.type === "text" && (
					<TextProperties layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
				)}
				{layer.type === "image" && (
					<ImageProperties layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
				)}
				{layer.type === "shape" && (
					<ShapeProperties layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
				)}
				{layer.type === "icon" && (
					<IconProperties layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
				)}
				{layer.type === "video" && (
					<MediaProperties
						layer={layer}
						sceneId={activeSceneId}
						dispatch={dispatch}
						kind="Video"
					/>
				)}
				{layer.type === "audio" && (
					<MediaProperties
						layer={layer}
						sceneId={activeSceneId}
						dispatch={dispatch}
						kind="Audio"
					/>
				)}

				<Separator />

				<LayerAnimationProperties
					layer={layer}
					sceneId={activeSceneId}
					dispatch={dispatch}
				/>
			</div>
			<Separator />
			<div className="p-3">
				<SceneEnterAnimationProperties scene={scene} dispatch={dispatch} />
			</div>
			<Separator />
			<div className="p-3">
				<SceneTransitionProperties scene={scene} dispatch={dispatch} />
			</div>
		</aside>
	);
}
