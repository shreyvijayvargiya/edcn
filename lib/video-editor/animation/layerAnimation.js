import { DEFAULT_LAYER_ANIMATION } from "./animationPresets";
import {
	easeOutBack,
	easeOutCubic,
	easeOutElastic,
	wordRevealText,
	lineRevealText,
	scrambleText,
	animProgress,
} from "./animationEasing";

export function getLayerAnimationProgress(layer, localTime) {
	const preset = layer.animation?.preset ?? "none";
	if (preset === "none") return 1;
	return animProgress(
		localTime,
		layer.startTime || 0,
		layer.animation?.duration ?? DEFAULT_LAYER_ANIMATION.duration,
	);
}

function baseAnimState(layer, overrides = {}) {
	return {
		opacityMult: 1,
		offsetX: 0,
		offsetY: 0,
		scaleX: 1,
		scaleY: 1,
		rotationOffset: 0,
		displayText: layer.data?.content,
		clipWidth: null,
		letterSpacingExtra: 0,
		...overrides,
	};
}

export function computeLayerAnimationState(layer, localTime) {
	const progress = getLayerAnimationProgress(layer, localTime);
	const preset = layer.animation?.preset ?? "none";

	if (preset === "none" || progress >= 1) {
		return baseAnimState(layer);
	}

	const eased = easeOutCubic(progress);
	const inv = 1 - eased;

	switch (preset) {
		case "fade_in":
			return baseAnimState(layer, { opacityMult: eased });
		case "fade_out_in": {
			const flash = progress < 0.35 ? 1 - progress / 0.35 : (progress - 0.35) / 0.65;
			return baseAnimState(layer, { opacityMult: Math.max(0, Math.min(1, flash)) });
		}
		case "slide_up":
			return baseAnimState(layer, { opacityMult: eased, offsetY: inv * 56 });
		case "slide_down":
			return baseAnimState(layer, { opacityMult: eased, offsetY: -inv * 56 });
		case "slide_left":
			return baseAnimState(layer, { opacityMult: eased, offsetX: inv * 72 });
		case "slide_right":
			return baseAnimState(layer, { opacityMult: eased, offsetX: -inv * 72 });
		case "pop": {
			const s = 0.5 + 0.5 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: Math.min(1, progress * 1.15),
				scaleX: s,
				scaleY: s,
			});
		}
		case "bounce": {
			const s = 0.4 + 0.6 * easeOutBack(progress);
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "zoom_in": {
			const s = 0.35 + 0.65 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "zoom_out": {
			const s = 1.35 - 0.35 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "spin":
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: inv * -120,
				scaleX: 0.85 + 0.15 * eased,
				scaleY: 0.85 + 0.15 * eased,
			});
		case "typewriter": {
			const content = layer.data?.content ?? "";
			const chars = Math.max(0, Math.floor(content.length * eased));
			return baseAnimState(layer, { displayText: content.slice(0, chars) });
		}
		case "word_reveal": {
			const content = layer.data?.content ?? "";
			return baseAnimState(layer, {
				displayText: wordRevealText(content, eased),
				opacityMult: eased,
			});
		}
		case "line_reveal": {
			const content = layer.data?.content ?? "";
			return baseAnimState(layer, {
				displayText: lineRevealText(content, eased),
				opacityMult: eased,
				offsetY: inv * 20,
			});
		}
		case "scramble": {
			const content = layer.data?.content ?? "";
			return baseAnimState(layer, {
				displayText: scrambleText(content, eased),
				opacityMult: 0.5 + eased * 0.5,
			});
		}
		case "tracking_in":
			return baseAnimState(layer, {
				opacityMult: eased,
				letterSpacingExtra: inv * 24,
			});
		case "blur_in": {
			const s = 1.18 - 0.18 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "flip_in": {
			const sy = Math.max(0.02, eased);
			return baseAnimState(layer, { opacityMult: eased, scaleY: sy });
		}
		case "glitch":
			return baseAnimState(layer, {
				opacityMult: progress < 0.55 ? 0.55 + Math.sin(progress * 90) * 0.25 : eased,
				offsetX: progress < 0.7 ? Math.sin(progress * 120) * 10 * inv : 0,
				offsetY: progress < 0.7 ? Math.cos(progress * 95) * 6 * inv : 0,
			});
		case "neon_flicker": {
			const flicker =
				progress < 0.55
					? 0.35 + Math.abs(Math.sin(progress * 48)) * 0.65
					: 0.85 + eased * 0.15;
			return baseAnimState(layer, { opacityMult: flicker });
		}
		case "ken_burns":
			return baseAnimState(layer, {
				opacityMult: eased,
				scaleX: 1 + 0.14 * inv,
				scaleY: 1 + 0.14 * inv,
				offsetX: inv * -16,
				offsetY: inv * -12,
			});
		case "cinematic":
			return baseAnimState(layer, {
				opacityMult: eased,
				scaleX: 1 + 0.2 * inv,
				scaleY: 1 + 0.2 * inv,
				offsetX: inv * -20,
				offsetY: inv * -8,
			});
		case "reveal_wipe": {
			const sx = Math.max(0.02, eased);
			return baseAnimState(layer, {
				opacityMult: eased,
				scaleX: sx,
				scaleY: 1,
				offsetX: -(layer.width / 2) * (1 - sx),
			});
		}
		case "blur_focus": {
			const s = 1.12 - 0.12 * eased;
			return baseAnimState(layer, {
				opacityMult: 0.35 + eased * 0.65,
				scaleX: s,
				scaleY: s,
			});
		}
		case "flash": {
			const flash = progress < 0.25 ? 1 : 0.4 + eased * 0.6;
			return baseAnimState(layer, { opacityMult: flash });
		}
		case "draw_in": {
			const s = eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: s, scaleY: s });
		}
		case "rotate_in":
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: inv * -180,
				scaleX: 0.5 + 0.5 * eased,
				scaleY: 0.5 + 0.5 * eased,
			});
		case "elastic_in": {
			const s = easeOutElastic(progress);
			return baseAnimState(layer, { opacityMult: Math.min(1, progress * 1.2), scaleX: s, scaleY: s });
		}
		case "pulse_in": {
			const pulse = 0.6 + 0.4 * Math.sin(progress * Math.PI);
			return baseAnimState(layer, { opacityMult: eased, scaleX: pulse, scaleY: pulse });
		}
		case "morph_in": {
			const sx = 0.2 + 0.8 * eased;
			const sy = 1.4 - 0.4 * eased;
			return baseAnimState(layer, { opacityMult: eased, scaleX: sx, scaleY: sy });
		}
		case "stamp": {
			const s = 0.4 + 0.6 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: Math.min(1, progress * 1.3),
				scaleX: s * 1.15,
				scaleY: s * 0.9,
			});
		}
		case "wiggle":
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: progress < 0.75 ? Math.sin(progress * 28) * 18 * inv : 0,
				scaleX: 0.85 + 0.15 * eased,
				scaleY: 0.85 + 0.15 * eased,
			});
		case "drop_in": {
			const s = 0.5 + 0.5 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: eased,
				offsetY: inv * -90,
				scaleX: s,
				scaleY: s,
			});
		}
		case "spin_pop": {
			const s = 0.35 + 0.65 * easeOutBack(progress);
			return baseAnimState(layer, {
				opacityMult: eased,
				rotationOffset: inv * -360,
				scaleX: s,
				scaleY: s,
			});
		}
		case "float_in":
			return baseAnimState(layer, {
				opacityMult: eased,
				offsetY: inv * 40,
				scaleX: 0.92 + 0.08 * eased,
				scaleY: 0.92 + 0.08 * eased,
			});
		default:
			return baseAnimState(layer);
	}
}
