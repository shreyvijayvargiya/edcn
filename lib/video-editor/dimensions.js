/** Output frame dimension presets for the video editor canvas */

export const FRAME_DIMENSION_PRESETS = [
	{
		id: "shorts",
		label: "Shorts",
		sublabel: "9:16 · 1080×1920",
		width: 1080,
		height: 1920,
		group: "Shorts",
	},
	{
		id: "reels",
		label: "Reels",
		sublabel: "9:16 · 1080×1920",
		width: 1080,
		height: 1920,
		group: "Shorts",
	},
	{
		id: "tiktok",
		label: "TikTok",
		sublabel: "9:16 · 1080×1920",
		width: 1080,
		height: 1920,
		group: "Shorts",
	},
	{
		id: "story",
		label: "Story",
		sublabel: "9:16 · 1080×1920",
		width: 1080,
		height: 1920,
		group: "Shorts",
	},
	{
		id: "youtube",
		label: "YouTube",
		sublabel: "16:9 · 1920×1080",
		width: 1920,
		height: 1080,
		group: "Video",
	},
	{
		id: "youtube-hd",
		label: "YouTube HD",
		sublabel: "16:9 · 1280×720",
		width: 1280,
		height: 720,
		group: "Video",
	},
	{
		id: "twitter",
		label: "X / Twitter",
		sublabel: "16:9 · 1280×720",
		width: 1280,
		height: 720,
		group: "Video",
	},
	{
		id: "facebook",
		label: "Facebook",
		sublabel: "16:9 · 1280×720",
		width: 1280,
		height: 720,
		group: "Video",
	},
	{
		id: "instagram-square",
		label: "Instagram Square",
		sublabel: "1:1 · 1080×1080",
		width: 1080,
		height: 1080,
		group: "Social",
	},
	{
		id: "instagram-portrait",
		label: "Instagram Portrait",
		sublabel: "4:5 · 1080×1350",
		width: 1080,
		height: 1350,
		group: "Social",
	},
	{
		id: "linkedin",
		label: "LinkedIn",
		sublabel: "1:1 · 1080×1080",
		width: 1080,
		height: 1080,
		group: "Social",
	},
];

export const DEFAULT_FRAME_PRESET_ID = "shorts";

/** Editor default uses a lighter Shorts size for faster preview */
export const EDITOR_DEFAULT_WIDTH = 360;
export const EDITOR_DEFAULT_HEIGHT = 640;

export function getFramePresetById(id) {
	return FRAME_DIMENSION_PRESETS.find((p) => p.id === id) ?? null;
}

export function resolveFramePreset(canvas) {
	if (!canvas) return getFramePresetById(DEFAULT_FRAME_PRESET_ID);

	if (canvas.presetId) {
		const byId = getFramePresetById(canvas.presetId);
		if (byId) return byId;
	}

	const bySize = FRAME_DIMENSION_PRESETS.find(
		(p) => p.width === canvas.width && p.height === canvas.height,
	);
	if (bySize) return bySize;

	const ratio = canvas.width / canvas.height;
	const byRatio = FRAME_DIMENSION_PRESETS.find(
		(p) => Math.abs(p.width / p.height - ratio) < 0.02,
	);
	if (byRatio) return byRatio;

	return {
		id: "custom",
		label: "Custom",
		sublabel: `${canvas.width}×${canvas.height}`,
		width: canvas.width,
		height: canvas.height,
		group: "Custom",
	};
}

export function groupFramePresets() {
	const groups = {};
	for (const preset of FRAME_DIMENSION_PRESETS) {
		if (!groups[preset.group]) groups[preset.group] = [];
		groups[preset.group].push(preset);
	}
	return groups;
}
