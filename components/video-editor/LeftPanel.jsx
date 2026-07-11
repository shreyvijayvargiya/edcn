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
	Sparkles,
	LayoutTemplate,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	addLayer,
	clearCommandLeftTab,
	openRecordAudioModal,
	updateScene,
} from "@/lib/store/slices/videoEditorSlice";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { getMediaDuration, roundMediaDuration } from "@/lib/video-editor/media";
import {
	stockImageSrcUrl,
	loadImageDimensions,
	fitImageOnCanvas,
} from "@/lib/video-editor/stockImages";
import { cn } from "@/lib/utils";
import BackgroundPanel from "./BackgroundPanel";
import { sceneBackgroundFromGradient } from "@/lib/video-editor/sceneBackground";
import WorkspacePanel from "./WorkspacePanel";
import AssetsPanel from "./AssetsPanel";
import LeftPanelUserSection from "./LeftPanelUserSection";
import AiVideoAgentPanel from "./AiVideoAgentPanel";
import { defaultUiPlacement } from "@/lib/video-editor/uiComponents";
import { Separator } from "@/components/ui/separator";
import { openFilePicker } from "./left-panel/openFilePicker";
import { TextPanel } from "./left-panel/TextPanel";
import { ImagePanel } from "./left-panel/ImagePanel";
import { VideoPanel } from "./left-panel/VideoPanel";
import { AudioPanel } from "./left-panel/AudioPanel";
import { ShapesPanel } from "./left-panel/ShapesPanel";
import { IconsPanel } from "./left-panel/IconsPanel";
import { UiPanel } from "./left-panel/UiPanel";

const WORKSPACE_TABS = [
	{ id: "workspace", label: "Projects", icon: Folder, activeIcon: FolderOpen },
	{ id: "assets", label: "Assets", icon: Library },
];

const EDITOR_TABS = [
	{ id: "ai", label: "AI", icon: Sparkles },
	{ id: "ui", label: "UI", icon: LayoutTemplate },
	{ id: "text", label: "Text", icon: Type },
	{ id: "image", label: "Image", icon: ImageIcon },
	{ id: "video", label: "Video", icon: Video },
	{ id: "audio", label: "Audio", icon: Music },
	{ id: "shape", label: "Objects", icon: Square },
	{ id: "background", label: "Background", icon: Paintbrush },
	{ id: "icon", label: "Icons", icon: Star },
];

export default function LeftPanel() {
	const dispatch = useAppDispatch();
	const { activeSceneId, project, ui, recordedAudio } = useAppSelector((s) => s.videoEditor);
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

	const addUi = (preset) => {
		if (!activeSceneId) return;
		dispatch(
			addLayer({
				sceneId: activeSceneId,
				type: "ui",
				data: preset.data,
				overrides: defaultUiPlacement(preset.size),
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
				data: {
					src: item.src,
					label: item.label,
					mediaDuration,
					...(item.transcript ? { transcript: item.transcript } : {}),
				},
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

	const openRecordModal = () => {
		dispatch(openRecordAudioModal({ insertAt: null }));
	};

	const handleTabClick = (tab) => {
		setActiveTab(tab.id);
		setSearch("");
	};

	const showSearch =
		activeTab === "text" ||
		activeTab === "ui" ||
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
				{activeTab !== "ai" && showSearch && (
						<div className="px-2 pb-2 border-b-2 border-border shrink-0">
							<div className="relative">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={
										activeTab === "text"
											? "Search fonts and combinations"
											: activeTab === "ui"
												? "Search UI components"
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

					<div
						className={cn(
							"flex-1 min-h-0",
							activeTab === "ai" ? "overflow-hidden flex flex-col" : "overflow-y-auto",
						)}
					>
						{activeTab === "ai" && <AiVideoAgentPanel />}
						{activeTab === "workspace" && <WorkspacePanel />}
						{activeTab === "assets" && <AssetsPanel />}
						{activeTab === "ui" && <UiPanel onAddUi={addUi} search={search} />}
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
								onRecord={openRecordModal}
								recordedTracks={recordedAudio}
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
