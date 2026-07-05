import { useState } from "react";
import {
	Type,
	Image as ImageIcon,
	Square,
	Star,
	Search,
	Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addLayer } from "@/lib/store/slices/videoEditorSlice";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import { TEXT_PRESETS } from "@/lib/video-editor/textPresets";
import { SHAPE_PRESETS, ICON_COLOR_PRESETS } from "@/lib/video-editor/shapePresets";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { cn } from "@/lib/utils";

const TABS = [
	{ id: "text", label: "Text", icon: Type },
	{ id: "image", label: "Image", icon: ImageIcon },
	{ id: "shape", label: "Objects", icon: Square },
	{ id: "icon", label: "Icons", icon: Star },
];

function openFilePicker(accept, onFile) {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;
	input.onchange = (e) => {
		const file = e.target.files?.[0];
		if (file) onFile(file);
	};
	input.click();
}

function TextPanel({ onAddText, search }) {
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
				<Button className="w-full justify-start gap-2 h-10" onClick={() => onAddText(plain)}>
					<Type className="h-4 w-4" />
					Add a text box
				</Button>
			)}
			<Button variant="outline" className="w-full justify-start gap-2 h-10" disabled>
				<Sparkles className="h-4 w-4" />
				Magic Write
			</Button>

			{combos.length > 0 && (
				<>
					<p className="text-sm font-bold text-foreground">Font combinations</p>
					<div className="grid grid-cols-2 gap-2">
						{combos.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => onAddText(preset)}
								className="aspect-square border-2 border-border rounded-lg bg-muted/30 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center p-2 gap-0.5 overflow-hidden"
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

function ImagePanel({ onUpload }) {
	return (
		<div className="flex flex-col gap-3 p-3">
			<p className="text-sm font-bold text-foreground">Images</p>
			<Button variant="outline" className="w-full h-24 flex-col gap-2" onClick={onUpload}>
				<ImageIcon className="h-6 w-6 text-muted-foreground" />
				<span className="text-xs">Upload image</span>
			</Button>
			<p className="text-[10px] text-muted-foreground leading-relaxed">
				Upload PNG, JPG, or WebP. The image is added as a layer on the canvas.
			</p>
		</div>
	);
}

function ShapesPanel({ onAddShape }) {
	return (
		<div className="flex flex-col gap-3 p-3">
			<p className="text-sm font-bold text-foreground">Objects</p>
			<div className="grid grid-cols-2 gap-2">
				{SHAPE_PRESETS.map((preset) => (
					<button
						key={preset.id}
						type="button"
						onClick={() => onAddShape(preset)}
						className="aspect-square border-2 border-border rounded-lg bg-muted/20 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 p-3"
					>
						<div
							className="w-12 h-10 shrink-0"
							style={{
								background: preset.preview.bg,
								borderRadius: preset.preview.borderRadius,
								border: preset.preview.border,
							}}
						/>
						<span className="text-[10px] font-medium text-muted-foreground capitalize">
							{preset.shape}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

function IconsPanel({ onAddIcon, search }) {
	const [color, setColor] = useState(ICON_COLOR_PRESETS[0]);
	const filtered = EDITOR_ICONS.filter((icon) => !search || icon.includes(search));

	return (
		<div className="flex flex-col gap-3 p-3">
			<p className="text-sm font-bold text-foreground">Icons</p>
			<div className="flex flex-wrap gap-1.5">
				{ICON_COLOR_PRESETS.map((c) => (
					<button
						key={c}
						type="button"
						onClick={() => setColor(c)}
						className={cn(
							"h-6 w-6 rounded-full border-2 shrink-0 transition-transform",
							color === c ? "border-primary scale-110" : "border-border",
						)}
						style={{ background: c }}
						title={c}
					/>
				))}
			</div>
			<div className="grid grid-cols-6 gap-1">
				{filtered.map((icon) => (
					<button
						key={icon}
						type="button"
						onClick={() => onAddIcon(icon, color)}
						className="h-9 w-9 flex items-center justify-center text-xl border-2 border-border rounded-md hover:border-primary hover:bg-primary/5 transition-colors"
						style={{ color }}
						title={`Add ${icon}`}
					>
						{icon}
					</button>
				))}
			</div>
		</div>
	);
}

export default function LeftPanel() {
	const dispatch = useAppDispatch();
	const { activeSceneId } = useAppSelector((s) => s.videoEditor);
	const [activeTab, setActiveTab] = useState("text");
	const [search, setSearch] = useState("");

	const addText = (preset) => {
		if (!activeSceneId) return;
		dispatch(
			addLayer({
				sceneId: activeSceneId,
				type: "text",
				data: preset.layer,
				overrides: {
					y: CANVAS_HEIGHT / 2 - 50,
					width: CANVAS_WIDTH - 60,
					height: preset.layer.content.includes("\n") ? 100 : 80,
				},
			}),
		);
	};

	const addShape = (preset) => {
		if (!activeSceneId) return;
		dispatch(
			addLayer({
				sceneId: activeSceneId,
				type: "shape",
				data: preset.data,
				overrides: {
					x: (CANVAS_WIDTH - preset.size.width) / 2,
					y: (CANVAS_HEIGHT - preset.size.height) / 2,
					width: preset.size.width,
					height: preset.size.height,
				},
			}),
		);
	};

	const addIcon = (icon, fill) => {
		if (!activeSceneId) return;
		dispatch(
			addLayer({
				sceneId: activeSceneId,
				type: "icon",
				data: { icon, fill, fontSize: 48 },
				overrides: {
					x: CANVAS_WIDTH / 2 - 30,
					y: CANVAS_HEIGHT / 2 - 30,
				},
			}),
		);
	};

	const uploadImage = () => {
		openFilePicker("image/*", (file) => {
			if (!activeSceneId) return;
			const url = URL.createObjectURL(file);
			dispatch(addLayer({ sceneId: activeSceneId, type: "image", data: { src: url } }));
		});
	};

	const showSearch = activeTab === "text" || activeTab === "icon";

	return (
		<aside className="flex shrink-0 border-r-2 border-border bg-card">
			<nav className="w-14 shrink-0 flex flex-col items-center py-2 gap-0.5 border-r-2 border-border bg-muted/20">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => {
								setActiveTab(tab.id);
								setSearch("");
							}}
							className={cn(
								"w-11 flex flex-col items-center justify-center gap-0.5 py-2 rounded-md text-[9px] font-semibold transition-colors",
								isActive
									? "bg-primary/15 text-primary"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
							title={tab.label}
						>
							<Icon className="h-5 w-5" />
							<span className="leading-none">{tab.label}</span>
						</button>
					);
				})}
			</nav>

			<div className="w-56 flex flex-col overflow-hidden">
				{showSearch && (
					<div className="p-2 border-b-2 border-border shrink-0">
						<div className="relative">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={
									activeTab === "text"
										? "Search fonts and combinations"
										: "Search icons"
								}
								className="h-8 pl-8 text-xs"
							/>
						</div>
					</div>
				)}

				<div className="flex-1 overflow-y-auto min-h-0">
					{activeTab === "text" && (
						<TextPanel onAddText={addText} search={search} />
					)}
					{activeTab === "image" && <ImagePanel onUpload={uploadImage} />}
					{activeTab === "shape" && <ShapesPanel onAddShape={addShape} />}
					{activeTab === "icon" && (
						<IconsPanel onAddIcon={addIcon} search={search} />
					)}
				</div>
			</div>
		</aside>
	);
}
