import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateLayerData } from "@/lib/store/slices/videoEditorSlice";
import {
	FONT_FAMILIES,
	FONT_WEIGHTS,
	TEXT_ALIGNMENTS,
	SHAPE_TYPES,
} from "@/lib/video-editor/constants";
import { FLEX_DIRECTIONS, FLEX_ALIGN } from "@/lib/video-editor/uiLayerStyle";
import { getUiPresetById } from "@/lib/video-editor/uiComponents";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import { cn } from "@/lib/utils";
import PropertySelect from "../PropertySelect";
import {
	Field,
	RangeField,
	ColorField,
	PanelSection,
	ContentSection,
	AppearanceStyleSection,
	Button,
} from "./PropertyPanelSections";

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

function UiContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));
	const preset = getUiPresetById(data.componentId);
	const id = data.componentId;

	return (
		<div className="space-y-2.5">
			<Field label="Component">
				<p className="text-xs font-semibold text-foreground">{preset?.label ?? id}</p>
			</Field>

			{(id === "cta-primary" ||
				id === "cta-outline" ||
				id === "cta-pill" ||
				id === "badge" ||
				id === "checkbox") && (
				<Field label="Label">
					<Input
						value={data.label ?? ""}
						onChange={(e) => patch({ label: e.target.value })}
						className="h-8 text-sm"
					/>
				</Field>
			)}

			{(id === "input-text" || id === "input-search") && (
				<Field label="Placeholder">
					<Input
						value={data.placeholder ?? ""}
						onChange={(e) => patch({ placeholder: e.target.value })}
						className="h-8 text-sm"
					/>
				</Field>
			)}

			{(id === "card" || id === "avatar-row" || id === "store-badge") && (
				<>
					<Field label="Title">
						<Input
							value={data.label ?? ""}
							onChange={(e) => patch({ label: e.target.value })}
							className="h-8 text-sm"
						/>
					</Field>
					<Field label="Subtitle">
						<Input
							value={data.subtitle ?? ""}
							onChange={(e) => patch({ subtitle: e.target.value })}
							className="h-8 text-sm"
						/>
					</Field>
				</>
			)}

			{id === "avatar-row" && (
				<Field label="Avatar initials">
					<Input
						value={data.avatarText ?? ""}
						onChange={(e) => patch({ avatarText: e.target.value })}
						className="h-8 text-sm"
						maxLength={3}
					/>
				</Field>
			)}

			{id === "slider" && (
				<>
					<Field label="Label">
						<Input
							value={data.label ?? ""}
							onChange={(e) => patch({ label: e.target.value })}
							className="h-8 text-sm"
						/>
					</Field>
					<RangeField
						label="Value"
						value={Math.round((data.sliderValue ?? 0.5) * 100)}
						min={0}
						max={100}
						formatValue={(v) => `${v}%`}
						onChange={(v) => patch({ sliderValue: v / 100 })}
					/>
				</>
			)}

			{id === "progress" && (
				<RangeField
					label="Progress"
					value={Math.round((data.progress ?? 0.5) * 100)}
					min={0}
					max={100}
					formatValue={(v) => `${v}%`}
					onChange={(v) => patch({ progress: v / 100 })}
				/>
			)}

			{(id === "toggle" || id === "checkbox") && (
				<Field label="State">
					<div className="flex gap-1">
						<Button
							type="button"
							size="sm"
							variant={data.checked ? "default" : "outline"}
							className="flex-1 text-xs h-8"
							onClick={() => patch({ checked: true })}
						>
							On
						</Button>
						<Button
							type="button"
							size="sm"
							variant={!data.checked ? "default" : "outline"}
							className="flex-1 text-xs h-8"
							onClick={() => patch({ checked: false })}
						>
							Off
						</Button>
					</div>
				</Field>
			)}

			{id === "calendar" && (
				<>
					<Field label="Month label">
						<Input
							value={data.label ?? ""}
							onChange={(e) => patch({ label: e.target.value })}
							className="h-8 text-sm"
						/>
					</Field>
					<RangeField
						label="Selected day"
						value={data.selectedDay ?? 1}
						min={1}
						max={28}
						onChange={(v) => patch({ selectedDay: v })}
					/>
				</>
			)}

			{id === "star-rating" && (
				<>
					<Field label="Score label">
						<Input
							value={data.label ?? ""}
							onChange={(e) => patch({ label: e.target.value })}
							className="h-8 text-sm"
						/>
					</Field>
					<RangeField
						label="Stars"
						value={data.rating ?? 5}
						min={1}
						max={5}
						onChange={(v) => patch({ rating: v })}
					/>
				</>
			)}

			{id === "pill-tabs" && (
				<>
					<Field label="Tab labels">
						<Input
							value={(data.tabs ?? []).join(", ")}
							onChange={(e) =>
								patch({
									tabs: e.target.value
										.split(",")
										.map((s) => s.trim())
										.filter(Boolean),
								})
							}
							className="h-8 text-sm"
							placeholder="Home, Features, Pricing"
						/>
					</Field>
					<RangeField
						label="Active tab"
						value={(data.activeTab ?? 0) + 1}
						min={1}
						max={Math.max(1, (data.tabs ?? []).length)}
						onChange={(v) => patch({ activeTab: v - 1 })}
					/>
				</>
			)}

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
				value={data.fontSize ?? 16}
				min={10}
				max={48}
				onChange={(v) => patch({ fontSize: v })}
			/>
		</div>
	);
}

export function UiLayoutSection({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<PanelSection title="Layout" defaultOpen sectionId="ui-layout">
			<RangeField
				label="Padding"
				value={data.padding ?? 12}
				min={0}
				max={48}
				onChange={(v) => patch({ padding: v })}
			/>
			<RangeField
				label="Gap"
				value={data.gap ?? 8}
				min={0}
				max={32}
				onChange={(v) => patch({ gap: v })}
			/>
			<Field label="Direction">
				<PropertySelect
					value={data.flexDirection ?? "column"}
					onChange={(flexDirection) => patch({ flexDirection })}
					options={FLEX_DIRECTIONS}
					placeholder="Direction"
				/>
			</Field>
			<div className="grid grid-cols-2 gap-2">
				<Field label="Align">
					<PropertySelect
						value={data.alignItems ?? "center"}
						onChange={(alignItems) => patch({ alignItems })}
						options={FLEX_ALIGN}
						placeholder="Align"
					/>
				</Field>
				<Field label="Justify">
					<PropertySelect
						value={data.justifyContent ?? "center"}
						onChange={(justifyContent) => patch({ justifyContent })}
						options={FLEX_ALIGN}
						placeholder="Justify"
					/>
				</Field>
			</div>
		</PanelSection>
	);
}

export function UiColorsSection({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	return (
		<PanelSection title="Colors" defaultOpen sectionId="ui-colors">
			<ColorField
				label="Background"
				value={data.background}
				fallback="#ea580c"
				onChange={(background) => patch({ background })}
			/>
			<ColorField
				label="Secondary"
				value={data.secondaryBackground}
				fallback="#f4f4f5"
				onChange={(secondaryBackground) => patch({ secondaryBackground })}
			/>
			<ColorField
				label="Text color"
				value={data.textColor}
				fallback="#ffffff"
				onChange={(textColor) => patch({ textColor })}
			/>
			<ColorField
				label="Muted text"
				value={data.mutedTextColor}
				fallback="#71717a"
				onChange={(mutedTextColor) => patch({ mutedTextColor })}
			/>
		</PanelSection>
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

export function LayerContentSection({ layer, sceneId, dispatch }) {
	const contentByType = {
		text: <TextContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		image: <ImageContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		video: <VideoContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		shape: <ShapeContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		icon: <IconContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		ui: <UiContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
		audio: <AudioContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
	};

	const titles = {
		text: "Text",
		image: "Source",
		video: "Source",
		shape: "Shape",
		icon: "Icon",
		ui: "UI component",
		audio: "Source",
	};

	return (
		<ContentSection title={titles[layer.type] ?? "Content"}>
			{contentByType[layer.type]}
		</ContentSection>
	);
}

export function LayerAppearanceSection({ layer, sceneId, dispatch }) {
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

	if (layer.type === "ui") {
		return (
			<AppearanceStyleSection
				data={data}
				patch={patch}
				showBorderFill
				showCornerRadius
			/>
		);
	}

	return null;
}
