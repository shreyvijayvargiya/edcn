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
} from "@/lib/store/slices/videoEditorSlice";
import {
	FONT_FAMILIES,
	FONT_WEIGHTS,
	TEXT_ALIGNMENTS,
	SHAPE_TYPES,
} from "@/lib/video-editor/constants";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import { DEFAULT_CANVAS_BACKGROUND } from "@/lib/video-editor/gradients";
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

function CanvasProperties({ canvas, dispatch }) {
	const bg = canvas?.background ?? DEFAULT_CANVAS_BACKGROUND;
	const fill = bg.type === "solid" ? (bg.fill ?? "#18181b") : (bg.fill ?? "#18181b");

	const patchBg = (nextFill) => {
		dispatch(
			updateCanvas({
				background: { type: "solid", fill: nextFill },
			}),
		);
	};

	return (
		<div className="space-y-3">
			<Field label="Background color">
				<div className="flex gap-2">
					<input
						type="color"
						value={fill}
						onChange={(e) => patchBg(e.target.value)}
						className="h-9 w-12 border-2 border-border cursor-pointer"
					/>
					<Input
						value={fill}
						onChange={(e) => patchBg(e.target.value)}
						className="flex-1 text-sm font-mono"
					/>
				</div>
			</Field>
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
						Solid background · click canvas and press Space to play
					</p>
				</div>
				<div className="p-3">
					<CanvasProperties canvas={project.canvas} dispatch={dispatch} />
				</div>
				<Separator />
				<div className="p-3">
					<p className="text-xs text-muted-foreground">
						Select a layer to edit properties. Upgrade to Pro for export, video/audio,
						animations, gradients, and multi-scene editing.
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
			</div>
		</aside>
	);
}
