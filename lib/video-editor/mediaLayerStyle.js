/** Shared CSS-like style fields for image & video layers */

import { DEFAULT_LAYER_CHROME } from "./layerChromeStyle";

export const DEFAULT_MEDIA_LAYER_STYLE = {
	objectFit: "cover",
	objectPosition: "center",
	...DEFAULT_LAYER_CHROME,
	borderRadius: 8,
	ringRadius: 8,
	shadowBlur: 12,
};

/** Dimensions from HTMLImageElement or HTMLVideoElement */
export function mediaElementSize(el) {
	if (!el) return null;
	const w = el.naturalWidth ?? el.videoWidth ?? 0;
	const h = el.naturalHeight ?? el.videoHeight ?? 0;
	if (!w || !h) return null;
	return { naturalWidth: w, naturalHeight: h };
}
