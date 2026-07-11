import { FRAME_DIMENSION_PRESETS } from "../dimensions";
import { STOCK_IMAGES } from "../stockImages";
import { STOCK_VIDEOS } from "../stockVideos";
import { STOCK_AUDIO } from "../stockAudio";
import { EDITOR_ICONS } from "../icons";
import { LAYER_ANIMATION_PRESETS, SCENE_TRANSITION_TYPES } from "../animations";
import { FONT_FAMILIES, SHAPE_TYPES } from "../constants";

/** Compact catalog injected into the AI system prompt */
export function buildAiEditorCatalog() {
	return {
		framePresets: FRAME_DIMENSION_PRESETS.map((p) => ({
			id: p.id,
			label: p.label,
			width: p.width,
			height: p.height,
			ratio: `${p.width}:${p.height}`,
		})),
		layerTypes: ["text", "image", "video", "audio", "shape", "icon"],
		shapeTypes: SHAPE_TYPES,
		fontFamilies: FONT_FAMILIES,
		animationPresets: LAYER_ANIMATION_PRESETS.map((p) => p.id),
		sceneTransitions: SCENE_TRANSITION_TYPES.map((p) => p.id),
		stockImages: STOCK_IMAGES.map((i) => ({
			id: i.id,
			label: i.label,
			tags: i.tags,
		})),
		stockVideos: STOCK_VIDEOS.map((v) => ({ id: v.id, label: v.label, src: v.src })),
		stockAudio: STOCK_AUDIO.map((a) => ({ id: a.id, label: a.label, src: a.src })),
		sampleIcons: EDITOR_ICONS.slice(0, 40),
		cssTokens: [
			"--background",
			"--foreground",
			"--primary",
			"--secondary",
			"--muted",
			"--accent",
			"--destructive",
			"--border",
			"--radius",
			"--font-sans",
		],
		editorPreviewSize: {
			width: 360,
			height: 640,
			note: "ONLY use these pixel dimensions for ALL layer x,y,width,height. Never 1080 or 1920.",
		},
	};
}
