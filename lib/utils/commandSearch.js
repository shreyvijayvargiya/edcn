import Fuse from "fuse.js";
import { STOCK_IMAGES } from "@/lib/video-editor/stockImages";
import { STOCK_VIDEOS } from "@/lib/video-editor/stockVideos";
import { STOCK_AUDIO } from "@/lib/video-editor/stockAudio";
import { TEXT_PRESETS } from "@/lib/video-editor/textPresets";
import { SHAPE_PRESETS } from "@/lib/video-editor/shapePresets";
import { ICON_COMBOS } from "@/lib/video-editor/iconCombos";
import { LAYER_ANIMATION_PRESETS } from "@/lib/video-editor/animations";
import { collectProjectAssets } from "@/lib/video-editor/projectAssets";
import { layerClipLabel } from "@/lib/video-editor/timeline";

/** Display order for grouped results in the command palette */
export const COMMAND_CATEGORY_ORDER = [
	"Navigation",
	"Properties",
	"CSS customization",
	"Timeline",
	"Workspace",
	"Assets",
	"Stock library",
	"Actions",
];

const LEFT_TABS = [
	{ id: "workspace", label: "Projects", keywords: "workspace projects files" },
	{ id: "assets", label: "Project assets", keywords: "media library images videos" },
	{ id: "text", label: "Text", keywords: "typography fonts titles captions" },
	{ id: "image", label: "Images", keywords: "photos pictures stock upload" },
	{ id: "video", label: "Video", keywords: "clips footage upload sample" },
	{ id: "audio", label: "Audio", keywords: "sound music sfx upload" },
	{ id: "shape", label: "Objects", keywords: "shapes rectangles circles" },
	{ id: "background", label: "Background", keywords: "gradient pattern scene bg" },
	{ id: "icon", label: "Icons", keywords: "emoji symbols stickers" },
];

const PROPERTY_SECTIONS = [
	{ id: "frame", label: "Frame", description: "Width, height, X, Y", keywords: "size position dimensions w h" },
	{ id: "transform", label: "Transform", description: "Rotation & opacity", keywords: "rotate angle scale fade" },
	{ id: "timing", label: "Timing", description: "Clip start, duration, enter animation", keywords: "duration animation delay" },
	{ id: "advanced-motion", label: "Advanced motion", description: "Keyframes & frame swap", keywords: "motion keyframe morph" },
	{ id: "appearance", label: "Appearance", description: "Border, ring, shadow, stroke", keywords: "border shadow stroke ring" },
	{ id: "content", label: "Content", description: "Text, icon, image source", keywords: "text source icon image" },
	{ id: "background", label: "Canvas background", description: "Solid & gradient fill", keywords: "canvas bg color gradient" },
	{ id: "scene", label: "Scene settings", description: "Transitions, zoom, intro", keywords: "scene transition zoom" },
];

const CSS_THEME_ITEMS = [
	{ id: "theme-light", label: "Light theme", keywords: "appearance mode day" },
	{ id: "theme-dark", label: "Dark theme", keywords: "appearance mode night" },
	{ id: "css-primary", label: "Primary color", description: "CSS var --primary in globals.css", keywords: "purple brand accent" },
	{ id: "css-background", label: "Background color", description: "CSS var --background", keywords: "page bg surface" },
	{ id: "css-foreground", label: "Foreground text", description: "CSS var --foreground", keywords: "text color" },
	{ id: "css-border", label: "Border color", description: "CSS var --border", keywords: "outline stroke" },
	{ id: "css-radius", label: "Border radius", description: "CSS var --radius", keywords: "rounded corners" },
	{ id: "css-font-sans", label: "Sans font", description: "CSS var --font-sans (DM Sans)", keywords: "typography font family" },
	{ id: "css-muted", label: "Muted surface", description: "CSS var --muted", keywords: "subtle gray panel" },
	{ id: "css-destructive", label: "Destructive color", description: "CSS var --destructive", keywords: "error red delete" },
];

const ACTION_ITEMS = [
	{ id: "action-undo", label: "Undo", keywords: "revert history back" },
	{ id: "action-redo", label: "Redo", keywords: "repeat history forward" },
	{ id: "action-play", label: "Play / Pause", keywords: "playback preview space" },
	{ id: "action-export", label: "Export video", keywords: "download mp4 gif render" },
	{ id: "action-new-scene", label: "Add scene", keywords: "timeline scene plus" },
];

function item(id, label, category, extra = {}) {
	return {
		id,
		label,
		category,
		description: extra.description ?? "",
		keywords: extra.keywords ?? "",
		action: extra.action,
	};
}

/**
 * Build the full searchable command list from editor state.
 */
export function buildCommandSearchIndex({ project, workspaceEntries = [] }) {
	const commands = [];

	for (const tab of LEFT_TABS) {
		commands.push(
			item(`nav-${tab.id}`, tab.label, "Navigation", {
				description: `Open ${tab.label} in left panel`,
				keywords: tab.keywords,
				action: { type: "navigate-left", tab: tab.id },
			}),
		);
	}

	for (const section of PROPERTY_SECTIONS) {
		commands.push(
			item(`prop-${section.id}`, section.label, "Properties", {
				description: section.description,
				keywords: `${section.keywords} properties panel right`,
				action: {
					type: "focus-section",
					section: section.id,
					openRight: true,
				},
			}),
		);
	}

	for (const css of CSS_THEME_ITEMS) {
		const isTheme = css.id.startsWith("theme-");
		commands.push(
			item(`css-${css.id}`, css.label, "CSS customization", {
				description: css.description ?? "Theme & design tokens",
				keywords: `${css.keywords} css variables customization theme`,
				action: isTheme
					? { type: "theme", mode: css.id.replace("theme-", "") }
					: {
							type: "focus-section",
							section: css.id === "css-background" ? "background" : "background",
							openRight: true,
							hint: css.description,
						},
			}),
		);
	}

	for (const action of ACTION_ITEMS) {
		commands.push(
			item(action.id, action.label, "Actions", {
				keywords: action.keywords,
				action: { type: "editor-action", name: action.id.replace("action-", "") },
			}),
		);
	}

	for (const preset of LAYER_ANIMATION_PRESETS.filter((p) => p.id !== "none")) {
		commands.push(
			item(`anim-${preset.id}`, preset.label, "Properties", {
				description: preset.description,
				keywords: `animation enter ${preset.id} timing`,
				action: {
					type: "focus-section",
					section: "timing",
					openRight: true,
				},
			}),
		);
	}

	for (const preset of TEXT_PRESETS.slice(0, 12)) {
		commands.push(
			item(`text-preset-${preset.id}`, preset.label, "Stock library", {
				description: "Text style preset",
				keywords: `text font preset ${preset.label}`,
				action: { type: "navigate-left", tab: "text" },
			}),
		);
	}

	for (const preset of SHAPE_PRESETS) {
		commands.push(
			item(`shape-${preset.id}`, preset.label, "Stock library", {
				keywords: `shape ${preset.shape} object ${preset.label}`,
				action: { type: "navigate-left", tab: "shape" },
			}),
		);
	}

	for (const combo of ICON_COMBOS) {
		commands.push(
			item(`icon-combo-${combo.id}`, combo.label, "Stock library", {
				description: `Icon ${combo.icon}`,
				keywords: `icon emoji ${combo.label}`,
				action: { type: "navigate-left", tab: "icon" },
			}),
		);
	}

	for (const stock of STOCK_IMAGES) {
		commands.push(
			item(`stock-img-${stock.id}`, stock.label, "Stock library", {
				description: "Stock photo",
				keywords: `image photo stock ${stock.tags.join(" ")}`,
				action: { type: "navigate-left", tab: "image", stockId: stock.id },
			}),
		);
	}

	for (const stock of STOCK_VIDEOS) {
		commands.push(
			item(`stock-vid-${stock.id}`, stock.label, "Stock library", {
				description: "Sample video clip",
				keywords: `video clip stock sample`,
				action: { type: "navigate-left", tab: "video", stockId: stock.id },
			}),
		);
	}

	for (const stock of STOCK_AUDIO) {
		commands.push(
			item(`stock-aud-${stock.id}`, stock.label, "Stock library", {
				description: "Sample audio",
				keywords: `audio sound sfx ${stock.tags.join(" ")}`,
				action: { type: "navigate-left", tab: "audio", stockId: stock.id },
			}),
		);
	}

	for (const entry of workspaceEntries) {
		commands.push(
			item(`project-${entry.id}`, entry.name, "Workspace", {
				description: entry.isDemo ? "Demo project" : "Open workspace project",
				keywords: `project workspace ${entry.name}`,
				action: { type: "open-project", projectId: entry.id },
			}),
		);
	}

	if (project?.name) {
		commands.push(
			item("current-project", project.name, "Workspace", {
				description: "Current open project",
				keywords: "project title name",
				action: { type: "focus-section", section: "background", openRight: true },
			}),
		);
	}

	for (const scene of project?.scenes ?? []) {
		commands.push(
			item(`scene-${scene.id}`, scene.name || "Scene", "Timeline", {
				description: `${scene.duration?.toFixed(1) ?? 0}s · ${scene.layers?.length ?? 0} layers`,
				keywords: `scene timeline ${scene.name}`,
				action: {
					type: "select-scene",
					sceneId: scene.id,
					openRight: true,
					focusSection: "scene",
				},
			}),
		);

		for (const layer of scene.layers ?? []) {
			const label = layerClipLabel(layer);
			commands.push(
				item(`layer-${scene.id}-${layer.id}`, label, "Timeline", {
					description: `${layer.type} · ${scene.name}`,
					keywords: `layer ${layer.type} ${label} timeline object`,
					action: {
						type: "select-layer",
						sceneId: scene.id,
						layerId: layer.id,
						openRight: true,
						focusSection: layer.type === "text" ? "content" : "transform",
					},
				}),
			);
		}
	}

	for (const asset of collectProjectAssets(project)) {
		commands.push(
			item(`asset-${asset.id}`, asset.name, "Assets", {
				description: `${asset.type} · ${asset.sceneName}`,
				keywords: `asset ${asset.type} image video ${asset.name}`,
				action: {
					type: "select-layer",
					sceneId: asset.sceneId,
					layerId: asset.layerId,
					openLeft: true,
					leftTab: "assets",
					openRight: true,
					focusSection: "content",
				},
			}),
		);
	}

	return commands;
}

let fuseInstance = null;
let fuseSource = [];

export function rebuildCommandSearchFuse(commands) {
	fuseSource = commands;
	fuseInstance = new Fuse(commands, {
		keys: [
			{ name: "label", weight: 0.45 },
			{ name: "category", weight: 0.15 },
			{ name: "description", weight: 0.15 },
			{ name: "keywords", weight: 0.25 },
		],
		threshold: 0.38,
		ignoreLocation: true,
		minMatchCharLength: 1,
	});
}

export function searchCommands(query, commands) {
	if (!fuseInstance || fuseSource !== commands) {
		rebuildCommandSearchFuse(commands);
	}
	const q = query?.trim() ?? "";
	if (!q) {
		return groupCommandsByCategory(commands.slice(0, 40));
	}
	const results = fuseInstance.search(q, { limit: 50 }).map((r) => r.item);
	return groupCommandsByCategory(results);
}

export function groupCommandsByCategory(commands) {
	const groups = new Map();
	for (const cmd of commands) {
		if (!groups.has(cmd.category)) groups.set(cmd.category, []);
		groups.get(cmd.category).push(cmd);
	}
	return COMMAND_CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((category) => ({
		category,
		items: groups.get(category),
	}));
}

/**
 * Run a command action from the palette (navigation, selection, theme, etc.).
 */
export function executeCommandAction(
	action,
	{
		dispatch,
		openLeftPanel,
		openRightPanel,
		setTheme,
		toggleTheme,
		loadWorkspaceProject,
		onExport,
		onPreview,
	},
) {
	if (!action) return;

	if (action.openLeft) openLeftPanel?.();
	if (action.openRight) openRightPanel?.();

	switch (action.type) {
		case "navigate-left":
			openLeftPanel?.();
			dispatch({
				type: "videoEditor/runCommandNavigation",
				payload: { leftTab: action.tab },
			});
			break;
		case "focus-section":
			openRightPanel?.();
			dispatch({
				type: "videoEditor/runCommandNavigation",
				payload: { focusSection: action.section },
			});
			break;
		case "select-scene":
			openRightPanel?.();
			dispatch({
				type: "videoEditor/runCommandNavigation",
				payload: {
					sceneId: action.sceneId,
					focusSection: action.focusSection ?? "scene",
				},
			});
			break;
		case "select-layer": {
			if (action.openLeft || action.leftTab) openLeftPanel?.();
			if (action.openRight) openRightPanel?.();
			const payload = {
				sceneId: action.sceneId,
				layerId: action.layerId,
				focusSection: action.focusSection,
			};
			if (action.leftTab) payload.leftTab = action.leftTab;
			dispatch({
				type: "videoEditor/runCommandNavigation",
				payload,
			});
			break;
		}
		case "open-project":
			openLeftPanel?.();
			loadWorkspaceProject?.(action.projectId);
			dispatch({
				type: "videoEditor/runCommandNavigation",
				payload: { leftTab: "workspace" },
			});
			break;
		case "theme":
			if (action.mode === "dark") setTheme?.("dark");
			else if (action.mode === "light") setTheme?.("light");
			else toggleTheme?.();
			break;
		case "editor-action":
			switch (action.name) {
				case "undo":
					dispatch({ type: "videoEditor/undo" });
					break;
				case "redo":
					dispatch({ type: "videoEditor/redo" });
					break;
				case "play":
					dispatch({ type: "videoEditor/togglePlayback" });
					dispatch({ type: "videoEditor/setAudioUnlocked", payload: true });
					break;
				case "export":
					onExport?.();
					break;
				case "new-scene":
					dispatch({ type: "videoEditor/addScene" });
					break;
				default:
					break;
			}
			break;
		default:
			break;
	}
}
