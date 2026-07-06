/** Shared CSS-like style fields for image & video layers */

export const DEFAULT_MEDIA_LAYER_STYLE = {
	objectFit: "cover",
	objectPosition: "center",
	borderRadius: 8,
	borderWidth: 0,
	borderColor: "#ffffff",
	borderStyle: "solid",
	ringWidth: 0,
	ringColor: "#ffffff",
	ringRadius: 8,
	ringOffset: 4,
	shadowBlur: 12,
	shadowColor: "rgba(0,0,0,0.25)",
	shadowOffsetX: 0,
	shadowOffsetY: 4,
};

/** Dimensions from HTMLImageElement or HTMLVideoElement */
export function mediaElementSize(el) {
	if (!el) return null;
	const w = el.naturalWidth ?? el.videoWidth ?? 0;
	const h = el.naturalHeight ?? el.videoHeight ?? 0;
	if (!w || !h) return null;
	return { naturalWidth: w, naturalHeight: h };
}
