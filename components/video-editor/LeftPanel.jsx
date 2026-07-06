import { useState, useEffect } from "react";
import {
	Type,
	Image as ImageIcon,
	Video,
	Music,
	Square,
	Star,
	Search,
	Paintbrush,
	Folder,
	FolderOpen,
	Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addLayer, clearCommandLeftTab } from "@/lib/store/slices/videoEditorSlice";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import { ICON_COMBOS } from "@/lib/video-editor/iconCombos";
import { TEXT_PRESETS } from "@/lib/video-editor/textPresets";
import { SHAPE_PRESETS, ICON_COLOR_PRESETS } from "@/lib/video-editor/shapePresets";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { getMediaDuration, roundMediaDuration } from "@/lib/video-editor/media";
import { getTextPresetTileClassName } from "@/lib/video-editor/inlineTextEdit";
import {
	filterStockImages,
	stockImageSrcUrl,
	stockImageThumbUrl,
	loadImageDimensions,
	fitImageOnCanvas,
} from "@/lib/video-editor/stockImages";
import { filterStockVideos } from "@/lib/video-editor/stockVideos";
import { filterStockAudio } from "@/lib/video-editor/stockAudio";
import { cn } from "@/lib/utils";
import { updateScene } from "@/lib/store/slices/videoEditorSlice";
import BackgroundPanel, { sceneBackgroundFromGradient } from "./BackgroundPanel";
import WorkspacePanel from "./WorkspacePanel";
import AssetsPanel from "./AssetsPanel";
import LeftPanelUserSection from "./LeftPanelUserSection";
import { Separator } from "@/components/ui/separator";

const WORKSPACE_TABS = [
	{ id: "workspace", label: "Projects", icon: Folder, activeIcon: FolderOpen },
	{ id: "assets", label: "Assets", icon: Library },
];

const EDITOR_TABS = [
	{ id: "text", label: "Text", icon: Type },
	{ id: "image", label: "Image", icon: ImageIcon },
	{ id: "video", label: "Video", icon: Video },
	{ id: "audio", label: "Audio", icon: Music },
	{ id: "shape", label: "Objects", icon: Square },
	{ id: "background", label: "Background", icon: Paintbrush },
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

			{combos.length > 0 && (
				<>
					<p className="text-sm font-bold text-foreground">Font combinations</p>
					<div className="grid grid-cols-2 gap-2">
						{combos.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => onAddText(preset)}
								className={cn(
									"aspect-square border-2 border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center p-2 gap-0.5 overflow-hidden",
									getTextPresetTileClassName(preset.preview, preset.subPreview),
								)}
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

function ImagePanel({ onUpload, onAddStock, search }) {
	const images = filterStockImages(search);

	return (
		<div className="flex flex-col gap-3 p-3">
			<Button variant="outline" className="w-full h-10 gap-2 shrink-0" onClick={onUpload}>
				<ImageIcon className="h-4 w-4 text-muted-foreground" />
				<span className="text-xs font-medium">Upload image</span>
			</Button>

			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-bold text-foreground">Stock photos</p>
				<span className="text-[10px] text-muted-foreground tabular-nums">
					{images.length}
				</span>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed -mt-2">
				Free photos via Picsum. Click to add to canvas.
			</p>

			{images.length === 0 ? (
				<p className="text-xs text-muted-foreground py-4 text-center">No photos match your search.</p>
			) : (
				<div className="grid grid-cols-2 gap-2">
					{images.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => onAddStock(item)}
							className="group relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-border bg-muted/30 hover:border-primary transition-colors text-left"
							title={item.label}
						>
							<img
								src={stockImageThumbUrl(item)}
								alt={item.label}
								loading="lazy"
								decoding="async"
								className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
							/>
							<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] font-semibold text-white truncate">
								{item.label}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function VideoPanel({ onUpload, onAddStock, search }) {
	const videos = filterStockVideos(search);

	return (
		<div className="flex flex-col gap-3 p-3">
			<Button variant="outline" className="w-full h-10 gap-2 shrink-0" onClick={onUpload}>
				<Video className="h-4 w-4 text-muted-foreground" />
				<span className="text-xs font-medium">Upload video</span>
			</Button>

			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-bold text-foreground">Sample videos</p>
				<span className="text-[10px] text-muted-foreground tabular-nums">{videos.length}</span>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed -mt-2">
				Click to add a clip to the canvas. Edit text and export on top.
			</p>

			{videos.length === 0 ? (
				<p className="text-xs text-muted-foreground py-4 text-center">No videos match your search.</p>
			) : (
				<div className="grid grid-cols-1 gap-2">
					{videos.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => onAddStock(item)}
							className="group relative aspect-video overflow-hidden rounded-lg border-2 border-border bg-muted/30 hover:border-primary transition-colors text-left"
							title={item.label}
						>
							<video
								src={item.src}
								muted
								playsInline
								preload="metadata"
								className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
							/>
							<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] font-semibold text-white truncate">
								{item.label}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function AudioPanel({ onUpload, onAddStock, search }) {
	const tracks = filterStockAudio(search);

	return (
		<div className="flex flex-col gap-3 p-3">
			<Button variant="outline" className="w-full h-10 gap-2 shrink-0" onClick={onUpload}>
				<Music className="h-4 w-4 text-muted-foreground" />
				<span className="text-xs font-medium">Upload audio</span>
			</Button>

			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-bold text-foreground">Sample audio</p>
				<span className="text-[10px] text-muted-foreground tabular-nums">{tracks.length}</span>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed -mt-2">
				Add sound effects or music beds to the timeline.
			</p>

			{tracks.length === 0 ? (
				<p className="text-xs text-muted-foreground py-4 text-center">No audio matches your search.</p>
			) : (
				<div className="flex flex-col gap-2">
					{tracks.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => onAddStock(item)}
							className="flex items-center gap-3 rounded-lg border-2 border-border px-2.5 py-2 hover:border-primary hover:bg-muted/20 transition-colors text-left"
							title={item.label}
						>
							<div className="h-10 w-10 shrink-0 rounded-md border border-border bg-primary/10 flex items-center justify-center">
								<Music className="h-4 w-4 text-primary" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
								<p className="text-[10px] text-muted-foreground capitalize">
									{item.tags.slice(0, 2).join(" · ")}
								</p>
							</div>
						</button>
					))}
				</div>
			)}
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

function IconsPanel({ onAddIcon, onAddIconCombo, search }) {
	const [color, setColor] = useState(ICON_COLOR_PRESETS[0]);
	const filtered = EDITOR_ICONS.filter((icon) => !search || icon.includes(search));
	const filteredCombos = ICON_COMBOS.filter(
		(c) => !search || c.label.toLowerCase().includes(search.toLowerCase()) || c.icon.includes(search),
	);

	return (
		<div className="flex flex-col gap-3 p-3">
			{filteredCombos.length > 0 && (
				<>
					<p className="text-sm font-bold text-foreground">Icon combinations</p>
					<div className="grid grid-cols-4 gap-1.5">
						{filteredCombos.map((combo) => (
							<button
								key={combo.id}
								type="button"
								onClick={() => onAddIconCombo(combo)}
								className="aspect-square border-2 border-border rounded-lg bg-muted/30 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-0.5 p-1"
								title={combo.label}
							>
								<span className="text-2xl leading-none" style={{ color: combo.fill }}>
									{combo.icon}
								</span>
								<span className="text-[8px] font-medium text-muted-foreground truncate w-full text-center">
									{combo.label}
								</span>
							</button>
						))}
					</div>
				</>
			)}

			<p className="text-sm font-bold text-foreground">All icons</p>
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
	const { activeSceneId, project, ui } = useAppSelector((s) => s.videoEditor);
	const commandLeftTab = ui?.leftTab;
	const commandNonce = ui?.commandNonce ?? 0;
	const activeScene = project.scenes.find((s) => s.id === activeSceneId);
	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const canvasH = project.canvas?.height ?? CANVAS_HEIGHT;
	const [activeTab, setActiveTab] = useState("workspace");
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (!commandLeftTab) return;
		setActiveTab(commandLeftTab);
		setSearch("");
		dispatch(clearCommandLeftTab());
	}, [commandLeftTab, commandNonce, dispatch]);

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

	const addIconCombo = (combo) => {
		if (!activeSceneId) return;
		const size = combo.fontSize ?? 48;
		dispatch(
			addLayer({
				sceneId: activeSceneId,
				type: "icon",
				data: { icon: combo.icon, fill: combo.fill, fontSize: size },
				overrides: {
					x: CANVAS_WIDTH / 2 - size / 2,
					y: CANVAS_HEIGHT / 2 - size / 2,
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

	const addStockImage = async (item) => {
		if (!activeSceneId) return;
		const src = stockImageSrcUrl(item);
		try {
			const { width, height } = await loadImageDimensions(src);
			const fit = fitImageOnCanvas(width, height, canvasW, canvasH);
			dispatch(
				addLayer({
					sceneId: activeSceneId,
					type: "image",
					data: { src },
					overrides: fit,
				}),
			);
		} catch {
			dispatch(
				addLayer({
					sceneId: activeSceneId,
					type: "image",
					data: { src },
					overrides: {
						x: Math.round(canvasW * 0.1),
						y: Math.round(canvasH * 0.15),
						width: Math.round(canvasW * 0.8),
						height: Math.round(canvasH * 0.35),
					},
				}),
			);
		}
	};

	const addStockVideo = async (item) => {
		if (!activeSceneId) return;
		let mediaDuration = item.duration;
		try {
			const rawDuration = await getMediaDuration(item.src, "video");
			mediaDuration = roundMediaDuration(rawDuration);
		} catch {
			/* use catalog duration */
		}
		dispatch(
			addLayer({
				sceneId: activeSceneId,
				type: "video",
				mediaDuration,
				data: {
					src: item.src,
					label: item.label,
					mediaDuration,
					muted: false,
					volume: 1,
				},
				overrides: { x: 0, y: 0, width: canvasW, height: canvasH },
			}),
		);
	};

	const addStockAudio = async (item) => {
		if (!activeSceneId) return;
		let mediaDuration = item.duration;
		try {
			const rawDuration = await getMediaDuration(item.src, "audio");
			mediaDuration = roundMediaDuration(rawDuration);
		} catch {
			/* use catalog duration */
		}
		dispatch(
			addLayer({
				sceneId: activeSceneId,
				type: "audio",
				mediaDuration,
				data: { src: item.src, label: item.label, mediaDuration },
			}),
		);
	};

	const uploadVideo = () => {
		openFilePicker("video/*", async (file) => {
			if (!activeSceneId) return;
			const url = URL.createObjectURL(file);
			try {
				const rawDuration = await getMediaDuration(url, "video");
				const mediaDuration = roundMediaDuration(rawDuration);
				dispatch(
					addLayer({
						sceneId: activeSceneId,
						type: "video",
						mediaDuration,
						data: {
							src: url,
							label: file.name,
							mediaDuration,
							muted: false,
							volume: 1,
						},
						overrides: {
							x: 0,
							y: 0,
							width: canvasW,
							height: canvasH,
						},
					}),
				);
			} catch {
				dispatch(
					addLayer({
						sceneId: activeSceneId,
						type: "video",
						data: { src: url, label: file.name, muted: false, volume: 1 },
						overrides: { x: 0, y: 0, width: canvasW, height: canvasH },
					}),
				);
			}
		});
	};

	const uploadAudio = () => {
		openFilePicker("audio/*", async (file) => {
			if (!activeSceneId) return;
			const url = URL.createObjectURL(file);
			try {
				const rawDuration = await getMediaDuration(url, "audio");
				const mediaDuration = roundMediaDuration(rawDuration);
				dispatch(
					addLayer({
						sceneId: activeSceneId,
						type: "audio",
						mediaDuration,
						data: { src: url, label: file.name, mediaDuration },
					}),
				);
			} catch {
				dispatch(
					addLayer({
						sceneId: activeSceneId,
						type: "audio",
						data: { src: url, label: file.name },
					}),
				);
			}
		});
	};

	const applySceneBackground = (background) => {
		if (!activeSceneId) return;
		dispatch(updateScene({ sceneId: activeSceneId, changes: { background } }));
	};

	const applyGradientBackground = (preset) => {
		applySceneBackground(sceneBackgroundFromGradient(preset));
	};

	const handleTabClick = (tab) => {
		setActiveTab(tab.id);
		setSearch("");
	};

	const showSearch =
		activeTab === "text" ||
		activeTab === "icon" ||
		activeTab === "image" ||
		activeTab === "video" ||
		activeTab === "audio";

	const renderTabButton = (tab, isActive) => {
		const Icon = isActive && tab.activeIcon ? tab.activeIcon : tab.icon;
		return (
			<button
				key={tab.id}
				type="button"
				onClick={() => handleTabClick(tab)}
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
	};

	return (
		<div className="flex h-full w-full min-h-0 bg-card">
			{/* Icon rail */}
			<nav className="w-14 shrink-0 flex flex-col min-h-0 border-r-2 border-border bg-muted/20">
				<div className="flex flex-col items-center py-2 gap-0.5 shrink-0">
					{WORKSPACE_TABS.map((tab) => {
						const isActive = activeTab === tab.id;
						return renderTabButton(tab, isActive);
					})}
					<Separator className="w-8 my-1" />
				</div>

				<div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center py-1 gap-0.5">
					{EDITOR_TABS.map((tab) => {
						const isActive = activeTab === tab.id;
						return renderTabButton(tab, isActive);
					})}
				</div>

				<LeftPanelUserSection />
			</nav>

			{/* Content panel */}
			<div className="flex-1 min-w-0 flex flex-col overflow-hidden">
					{showSearch && (
						<div className="px-2 pb-2 border-b-2 border-border shrink-0">
							<div className="relative">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={
										activeTab === "text"
											? "Search fonts and combinations"
											: activeTab === "image"
												? "Search stock photos"
												: activeTab === "video"
													? "Search sample videos"
													: activeTab === "audio"
														? "Search sample audio"
														: "Search icons"
									}
									className="h-8 pl-8 text-xs"
								/>
							</div>
						</div>
					)}

					<div className="flex-1 overflow-y-auto min-h-0">
						{activeTab === "workspace" && <WorkspacePanel />}
						{activeTab === "assets" && <AssetsPanel />}
						{activeTab === "text" && (
							<TextPanel onAddText={addText} search={search} />
						)}
						{activeTab === "image" && (
							<ImagePanel
								onUpload={uploadImage}
								onAddStock={addStockImage}
								search={search}
							/>
						)}
						{activeTab === "video" && (
							<VideoPanel
								onUpload={uploadVideo}
								onAddStock={addStockVideo}
								search={search}
							/>
						)}
						{activeTab === "audio" && (
							<AudioPanel
								onUpload={uploadAudio}
								onAddStock={addStockAudio}
								search={search}
							/>
						)}
						{activeTab === "shape" && <ShapesPanel onAddShape={addShape} />}
						{activeTab === "background" && (
							<BackgroundPanel
								scene={activeScene}
								onApplyGradient={applyGradientBackground}
								onApplyPattern={applySceneBackground}
							/>
						)}
						{activeTab === "icon" && (
							<IconsPanel
								onAddIcon={addIcon}
								onAddIconCombo={addIconCombo}
								search={search}
							/>
						)}
					</div>
				</div>

		</div>
	);
}
