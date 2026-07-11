import {
	DEFAULT_SCENE_TRANSITION,
	DEFAULT_SCENE_ENTER_ANIMATION,
	MIN_TRANSITION_DURATION,
} from "./animationPresets";
import { easeOutBack, easeOutCubic, animProgress } from "./animationEasing";

function sceneEnterProgress(scene, localTime) {
	const preset = scene.enterAnimation?.preset ?? "none";
	if (preset === "none") return 1;
	const dur = scene.enterAnimation?.duration ?? DEFAULT_SCENE_ENTER_ANIMATION.duration;
	if (localTime >= dur) return 1;
	return animProgress(localTime, 0, dur);
}

function applySceneEnterTransform(state, scene, localTime, canvasW, canvasH) {
	const preset = scene.enterAnimation?.preset ?? "none";
	if (preset === "none") return state;

	const progress = sceneEnterProgress(scene, localTime);
	if (progress >= 1) return state;

	const eased = easeOutCubic(progress);
	const inv = 1 - eased;
	const next = { ...state };

	switch (preset) {
		case "fade_in":
			next.contentOpacity *= eased;
			break;
		case "slide_up":
			next.contentOpacity *= eased;
			next.offsetY += inv * canvasH * 0.12;
			break;
		case "slide_down":
			next.contentOpacity *= eased;
			next.offsetY -= inv * canvasH * 0.12;
			break;
		case "zoom_in":
			next.contentOpacity *= eased;
			next.contentScale *= 0.7 + 0.3 * eased;
			break;
		case "pop":
			next.contentOpacity *= Math.min(1, progress * 1.1);
			next.contentScale *= 0.55 + 0.45 * easeOutBack(progress);
			break;
		default:
			break;
	}
	return next;
}

/**
 * Scene-level visual state for preview/render.
 */
export function computeSceneTransitionState(scene, localTime, canvasW = 360, canvasH = 640) {
	const type = scene.transition?.type ?? "none";
	const dur = Math.max(
		MIN_TRANSITION_DURATION,
		scene.transition?.duration ?? DEFAULT_SCENE_TRANSITION.duration,
	);
	const sceneDur = scene.duration || 5;

	let state = {
		contentOpacity: 1,
		contentScale: 1,
		offsetX: 0,
		offsetY: 0,
		blackOverlay: 0,
		whiteOverlay: 0,
		clipRect: null,
	};

	if (type !== "none" && dur > 0) {
		// Enter (start of scene)
		if (localTime < dur) {
			const t = easeOutCubic(localTime / dur);
			const inv = 1 - t;
			switch (type) {
				case "crossfade":
					state.contentOpacity = t;
					break;
				case "dip_to_black":
					state.blackOverlay = inv;
					break;
				case "fade_white":
					state.whiteOverlay = inv;
					break;
				case "slide_up":
					state.contentOpacity = t;
					state.offsetY = inv * canvasH * 0.15;
					break;
				case "slide_down":
					state.contentOpacity = t;
					state.offsetY = -inv * canvasH * 0.15;
					break;
				case "slide_left":
					state.contentOpacity = t;
					state.offsetX = inv * canvasW * 0.2;
					break;
				case "slide_right":
					state.contentOpacity = t;
					state.offsetX = -inv * canvasW * 0.2;
					break;
				case "zoom_in":
					state.contentOpacity = t;
					state.contentScale = 0.75 + 0.25 * t;
					break;
				case "zoom_out":
					state.contentOpacity = t;
					state.contentScale = 1.25 - 0.25 * t;
					break;
				case "wipe_left":
					state.clipRect = { x: 0, y: 0, width: canvasW * t, height: canvasH };
					break;
				default:
					break;
			}
		}

		// Exit (end of scene)
		if (localTime > sceneDur - dur) {
			const t = easeOutCubic((localTime - (sceneDur - dur)) / dur);
			const inv = 1 - t;
			switch (type) {
				case "crossfade":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					break;
				case "dip_to_black":
					state.blackOverlay = Math.max(state.blackOverlay, t);
					break;
				case "fade_white":
					state.whiteOverlay = Math.max(state.whiteOverlay, t);
					break;
				case "slide_up":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetY -= t * canvasH * 0.15;
					break;
				case "slide_down":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetY += t * canvasH * 0.15;
					break;
				case "slide_left":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetX -= t * canvasW * 0.2;
					break;
				case "slide_right":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.offsetX += t * canvasW * 0.2;
					break;
				case "zoom_in":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.contentScale *= 1 + t * 0.2;
					break;
				case "zoom_out":
					state.contentOpacity = Math.min(state.contentOpacity, inv);
					state.contentScale *= 1 - t * 0.2;
					break;
				case "wipe_left":
					state.clipRect = { x: 0, y: 0, width: canvasW * inv, height: canvasH };
					break;
				default:
					break;
			}
		}
	}

	return applySceneEnterTransform(state, scene, localTime, canvasW, canvasH);
}
