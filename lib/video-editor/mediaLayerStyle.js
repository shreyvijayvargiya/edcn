/** Shared CSS-like style fields for image & video layers */

import { DEFAULT_LAYER_CHROME } from "./layerChromeStyle";
import { DEFAULT_MEDIA_EFFECTS } from "./mediaEffects";

export const DEFAULT_MEDIA_LAYER_STYLE = {
	objectFit: "cover",
	objectPosition: "center",
	...DEFAULT_LAYER_CHROME,
	borderRadius: 8,
	ringRadius: 8,
	shadowBlur: 12,
};

export function cloneMediaEffects(overrides = {}) {
	return {
		...DEFAULT_MEDIA_EFFECTS,
		...overrides,
		colorGrade: { ...DEFAULT_MEDIA_EFFECTS.colorGrade, ...(overrides.colorGrade ?? {}) },
		blur: { ...DEFAULT_MEDIA_EFFECTS.blur, ...(overrides.blur ?? {}) },
		glow: { ...DEFAULT_MEDIA_EFFECTS.glow, ...(overrides.glow ?? {}) },
		vignette: { ...DEFAULT_MEDIA_EFFECTS.vignette, ...(overrides.vignette ?? {}) },
		mask: { ...DEFAULT_MEDIA_EFFECTS.mask, ...(overrides.mask ?? {}) },
		cropFeather: { ...DEFAULT_MEDIA_EFFECTS.cropFeather, ...(overrides.cropFeather ?? {}) },
		chromaKey: { ...DEFAULT_MEDIA_EFFECTS.chromaKey, ...(overrides.chromaKey ?? {}) },
		particles: { ...DEFAULT_MEDIA_EFFECTS.particles, ...(overrides.particles ?? {}) },
	};
}

/** Dimensions from HTMLImageElement or HTMLVideoElement */
export function mediaElementSize(el) {
	if (!el) return null;
	const w = el.naturalWidth ?? el.videoWidth ?? 0;
	const h = el.naturalHeight ?? el.videoHeight ?? 0;
	if (!w || !h) return null;
	return { naturalWidth: w, naturalHeight: h };
}
