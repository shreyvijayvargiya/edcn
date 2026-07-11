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
import {
	CAPTION_STYLE_PRESETS,
	applyCaptionStylePreset,
	estimateWordTimings,
	wordsToPlainText,
	exportCaptionsToSrt,
	exportCaptionsToVtt,
	parseSrtOrVtt,
	downloadTextFile,
	createCaptionWord,
} from "@/lib/video-editor/captions";
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
	const ann = data.demoAnnotations ?? { enabled: false, markers: [] };

	const patchAnn = (next) =>
		patch({
			demoAnnotations: {
				enabled: false,
				cursorHighlight: true,
				zoomToClick: true,
				zoomScale: 1.35,
				zoomDuration: 0.55,
				markers: [],
				...ann,
				...next,
			},
		});

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

			<div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
				<label className="flex items-center gap-2 cursor-pointer select-none">
					<input
						type="checkbox"
						checked={Boolean(ann.enabled)}
						onChange={(e) => patchAnn({ enabled: e.target.checked })}
						className="h-3.5 w-3.5 rounded border-border accent-primary"
					/>
					<span className="text-[10px] font-semibold">Demo annotations</span>
				</label>
				{ann.enabled && (
					<>
						<label className="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={ann.cursorHighlight !== false}
								onChange={(e) => patchAnn({ cursorHighlight: e.target.checked })}
								className="h-3.5 w-3.5 rounded border-border accent-primary"
							/>
							<span className="text-[10px]">Click highlight rings</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={ann.zoomToClick !== false}
								onChange={(e) => patchAnn({ zoomToClick: e.target.checked })}
								className="h-3.5 w-3.5 rounded border-border accent-primary"
							/>
							<span className="text-[10px]">Zoom to click</span>
						</label>
						<RangeField
							label="Zoom scale"
							value={Math.round((ann.zoomScale ?? 1.35) * 100)}
							min={110}
							max={200}
							formatValue={(v) => `${v}%`}
							onChange={(v) => patchAnn({ zoomScale: v / 100 })}
						/>
						<p className="text-[9px] text-muted-foreground">
							{(ann.markers ?? []).length} click marker
							{(ann.markers ?? []).length === 1 ? "" : "s"} from screen recording
						</p>
					</>
				)}
			</div>
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

function CaptionContent({ layer, sceneId, dispatch }) {
	const { data } = layer;
	const patch = (d) =>
		dispatch(updateLayerData({ sceneId, layerId: layer.id, data: d }));

	const words = data.words ?? [];
	const plain = wordsToPlainText(words);

	const rebuildFromText = (text) => {
		const next = estimateWordTimings(text, layer.clipDuration ?? 5);
		patch({ words: next });
	};

	return (
		<div className="space-y-2.5">
			<Field label="Platform style">
				<div className="grid grid-cols-2 gap-1">
					{CAPTION_STYLE_PRESETS.map((s) => (
						<Button
							key={s.id}
							type="button"
							size="sm"
							variant={data.styleId === s.id ? "default" : "outline"}
							className="text-[10px] h-8 justify-start"
							onClick={() => patch(applyCaptionStylePreset(data, s.id))}
						>
							{s.label}
						</Button>
					))}
				</div>
			</Field>

			<label className="flex items-center gap-2 cursor-pointer select-none">
				<input
					type="checkbox"
					checked={data.karaoke !== false}
					onChange={(e) => patch({ karaoke: e.target.checked })}
					className="h-3.5 w-3.5 rounded border-border accent-primary"
				/>
				<span className="text-[10px] font-semibold">Karaoke highlight</span>
			</label>

			<Field label="Caption text">
				<Textarea
					value={plain}
					onChange={(e) => rebuildFromText(e.target.value)}
					rows={4}
					className="text-sm resize-none"
					placeholder="Type or paste caption words…"
				/>
			</Field>

			<div className="flex flex-wrap gap-1">
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="text-[10px] h-7"
					onClick={() => {
						const srt = exportCaptionsToSrt(words, data.wordsPerLine ?? 6);
						downloadTextFile("captions.srt", srt, "application/x-subrip");
					}}
					disabled={!words.length}
				>
					Export SRT
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="text-[10px] h-7"
					onClick={() => {
						const vtt = exportCaptionsToVtt(words, data.wordsPerLine ?? 6);
						downloadTextFile("captions.vtt", vtt, "text/vtt");
					}}
					disabled={!words.length}
				>
					Export VTT
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="text-[10px] h-7"
					onClick={() => {
						const input = document.createElement("input");
						input.type = "file";
						input.accept = ".srt,.vtt,text/vtt,application/x-subrip,text/plain";
						input.onchange = async () => {
							const file = input.files?.[0];
							if (!file) return;
							const text = await file.text();
							const parsed = parseSrtOrVtt(text);
							if (parsed.length) patch({ words: parsed });
						};
						input.click();
					}}
				>
					Import SRT/VTT
				</Button>
			</div>

			{words.length > 0 && (
				<div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-1.5">
					{words.map((w) => (
						<div key={w.id} className="grid grid-cols-[1fr_52px_52px] gap-1 items-center">
							<Input
								value={w.text}
								className="h-7 text-xs"
								onChange={(e) =>
									patch({
										words: words.map((x) =>
											x.id === w.id ? { ...x, text: e.target.value } : x,
										),
									})
								}
							/>
							<Input
								type="number"
								step={0.1}
								value={Math.round(w.start * 10) / 10}
								className="h-7 text-[10px]"
								onChange={(e) =>
									patch({
										words: words.map((x) =>
											x.id === w.id
												? { ...x, start: Number(e.target.value) || 0 }
												: x,
										),
									})
								}
							/>
							<Input
								type="number"
								step={0.1}
								value={Math.round(w.end * 10) / 10}
								className="h-7 text-[10px]"
								onChange={(e) =>
									patch({
										words: words.map((x) =>
											x.id === w.id
												? { ...x, end: Number(e.target.value) || 0 }
												: x,
										),
									})
								}
							/>
						</div>
					))}
				</div>
			)}

			{words.length === 0 && (
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="w-full text-[10px] h-8"
					onClick={() =>
						patch({
							words: [
								createCaptionWord("Your", 0, 0.4),
								createCaptionWord("captions", 0.4, 0.9),
								createCaptionWord("here", 0.9, 1.4),
							],
						})
					}
				>
					Add sample words
				</Button>
			)}

			<RangeField
				label="Font size"
				value={data.fontSize ?? 24}
				min={12}
				max={72}
				onChange={(v) => patch({ fontSize: v })}
			/>
			<ColorField
				label="Text color"
				value={data.fill ?? "#ffffff"}
				fallback="#ffffff"
				onChange={(fill) => patch({ fill })}
			/>
			<ColorField
				label="Highlight"
				value={data.highlightFill ?? "#39E508"}
				fallback="#39E508"
				onChange={(highlightFill) => patch({ highlightFill })}
			/>
			<RangeField
				label="Words per line"
				value={data.wordsPerLine ?? 4}
				min={2}
				max={12}
				onChange={(v) => patch({ wordsPerLine: v })}
			/>
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
		caption: <CaptionContent layer={layer} sceneId={sceneId} dispatch={dispatch} />,
	};

	const titles = {
		text: "Text",
		image: "Source",
		video: "Source",
		shape: "Shape",
		icon: "Icon",
		ui: "UI component",
		audio: "Source",
		caption: "Captions",
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
