import { easeOutCubic } from "./animations";
import { uid } from "./utils";

export const KEYFRAME_PROPERTIES = [
	{ id: "rotation", label: "Rotation", min: -360, max: 360, step: 1 },
	{ id: "opacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%" },
	{ id: "scale", label: "Scale", min: 0, max: 200, step: 1, unit: "%" },
];

export const DEFAULT_FRAME_SWAP = {
	enabled: false,
	frame2: "",
	swapAt: 1,
	crossfade: 0.25,
};

export const DEFAULT_MOTION = {
	frameSwap: { ...DEFAULT_FRAME_SWAP },
	keyframes: {
		enabled: false,
		items: [],
	},
};

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function layerRelTime(layer, localTime) {
	return Math.max(0, localTime - (layer.startTime || 0));
}

function interpolateTrack(items, property, relTime, fallback) {
	const track = items
		.filter((k) => k.property === property)
		.sort((a, b) => a.time - b.time);
	if (track.length === 0) return null;
	if (track.length === 1) return track[0].value;
	if (relTime <= track[0].time) return track[0].value;
	if (relTime >= track[track.length - 1].time) return track[track.length - 1].value;

	for (let i = 0; i < track.length - 1; i++) {
		const a = track[i];
		const b = track[i + 1];
		if (relTime >= a.time && relTime <= b.time) {
			const span = b.time - a.time;
			if (span <= 0) return b.value;
			const t = easeOutCubic((relTime - a.time) / span);
			return lerp(a.value, b.value, t);
		}
	}
	return fallback;
}

/** Stored opacity/scale are 0–1; UI uses 0–100 */
export function keyframeValueToUi(property, value) {
	if (property === "opacity" || property === "scale") return Math.round(value * 100);
	return Math.round(value);
}

export function keyframeValueFromUi(property, uiValue) {
	if (property === "opacity" || property === "scale") return uiValue / 100;
	return uiValue;
}

export function layerPropertyToKeyframeValue(layer, property) {
	if (property === "rotation") return layer.rotation ?? 0;
	if (property === "opacity") return layer.opacity ?? 1;
	if (property === "scale") return 1;
	return 0;
}

export function createKeyframe(property, time, value) {
	return { id: uid("kf"), property, time, value };
}

export function defaultRotationKeyframes(layer) {
	const relDur = Math.max(0.5, (layer.clipDuration ?? 5) * 0.5);
	return [
		createKeyframe("rotation", 0, layer.rotation ?? 0),
		createKeyframe("rotation", relDur, (layer.rotation ?? 0) + 90),
	];
}

/**
 * Interpolate keyframed properties relative to layer clip start.
 * Returns only properties that have keyframe tracks.
 */
export function computeKeyframeEffective(layer, localTime) {
	const motion = layer.motion;
	if (!motion?.keyframes?.enabled) return null;

	const items = motion.keyframes.items ?? [];
	if (items.length === 0) return null;

	const relTime = layerRelTime(layer, localTime);
	const effective = {};

	for (const { id: prop } of KEYFRAME_PROPERTIES) {
		const value = interpolateTrack(items, prop, relTime, null);
		if (value !== null) effective[prop] = value;
	}

	return Object.keys(effective).length > 0 ? effective : null;
}

/** Frame-swap crossfade state for icon / image layers */
export function computeFrameSwapState(layer, localTime) {
	const fs = layer.motion?.frameSwap;
	if (!fs?.enabled || !fs.frame2) return null;

	const relTime = layerRelTime(layer, localTime);
	const swapAt = Math.max(0, fs.swapAt ?? 1);
	const crossfade = Math.max(0.05, fs.crossfade ?? 0.25);

	if (relTime < swapAt) {
		return { frame1Opacity: 1, frame2Opacity: 0 };
	}
	if (relTime < swapAt + crossfade) {
		const t = (relTime - swapAt) / crossfade;
		return { frame1Opacity: 1 - t, frame2Opacity: t };
	}
	return { frame1Opacity: 0, frame2Opacity: 1 };
}

export function computeMotionState(layer, localTime) {
	return {
		effective: computeKeyframeEffective(layer, localTime),
		frameSwap: computeFrameSwapState(layer, localTime),
	};
}

export function supportsFrameSwap(layerType) {
	return layerType === "icon" || layerType === "image";
}

export function supportsKeyframes(layerType) {
	return ["text", "image", "video", "shape", "icon"].includes(layerType);
}
