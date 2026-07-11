import { buildBackgroundFill } from "./gradients";
import { getPatternCanvas, DEFAULT_BG, DEFAULT_FG } from "./backgroundPatterns";

/** Resolve per-scene or project-level background for Konva Rect fill */
export function resolveSceneBackground(scene, projectCanvas) {
	return scene?.background ?? projectCanvas?.background ?? null;
}

export function buildSceneBackgroundFill(background, width, height) {
	if (!background) {
		return buildBackgroundFill(null, width, height);
	}

	if (background.type === "pattern" && background.patternId) {
		const fg = background.patternFg ?? DEFAULT_FG;
		const bg = background.patternBg ?? DEFAULT_BG;
		const tile = getPatternCanvas(background.patternId, fg, bg);
		if (tile) {
			return {
				fill: bg,
				fillPatternImage: tile,
				fillPatternRepeat: "repeat",
			};
		}
	}

	return buildBackgroundFill(background, width, height);
}

export function sceneBackgroundFromGradient(preset) {
	return {
		type: "gradient",
		gradient: JSON.parse(JSON.stringify(preset.gradient)),
	};
}

export function sceneBackgroundFromPattern(patternId, patternFg = DEFAULT_FG, patternBg = DEFAULT_BG) {
	return {
		type: "pattern",
		patternId,
		patternFg,
		patternBg,
	};
}
