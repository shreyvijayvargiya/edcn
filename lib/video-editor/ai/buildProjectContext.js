import { EDITOR_DEFAULT_WIDTH, EDITOR_DEFAULT_HEIGHT } from "../dimensions";

const MAX_CONTEXT_CHARS = 14_000;
const MAX_LAYERS_PER_SCENE = 12;

function layerSummary(layer, sceneDuration) {
	const base = {
		type: layer.type,
		x: layer.x,
		y: layer.y,
		width: layer.width,
		height: layer.height,
		startTime: layer.startTime ?? 0,
		clipDuration: layer.clipDuration ?? sceneDuration,
		opacity: layer.opacity ?? 1,
		animation: layer.animation?.preset ?? "none",
	};

	const { data } = layer;
	switch (layer.type) {
		case "text":
			return {
				...base,
				content: data?.content?.slice(0, 120),
				fontSize: data?.fontSize,
				fill: data?.fill,
				align: data?.align,
			};
		case "image":
			return {
				...base,
				src: data?.src ?? null,
				stockImageId: data?.stockImageId ?? null,
				objectFit: data?.objectFit,
			};
		case "video":
			return {
				...base,
				src: data?.src ?? null,
				label: data?.label,
				muted: data?.muted,
			};
		case "audio":
			return {
				...base,
				src: data?.src ?? null,
				label: data?.label,
			};
		case "shape":
			return { ...base, shape: data?.shape, fill: data?.fill };
		case "icon":
			return { ...base, icon: data?.icon, fill: data?.fill, fontSize: data?.fontSize };
		default:
			return base;
	}
}

function sceneSummary(scene, index, { activeSceneId, emphasize }) {
	const layers = (scene.layers ?? []).slice(0, MAX_LAYERS_PER_SCENE).map((l) =>
		layerSummary(l, scene.duration),
	);
	return {
		index,
		id: scene.id,
		name: scene.name,
		duration: scene.duration,
		isActive: scene.id === activeSceneId,
		emphasize: emphasize || scene.id === activeSceneId,
		transition: scene.transition?.type,
		enterAnimation: scene.enterAnimation?.preset,
		layerCount: scene.layers?.length ?? 0,
		layers,
	};
}

export function buildCompactProjectContext(project, { activeSceneId, mode = "edit" } = {}) {
	const canvas = project.canvas ?? {};
	const scenes = (project.scenes ?? []).map((s, i) =>
		sceneSummary(s, i, { activeSceneId, emphasize: mode === "edit" && s.id === activeSceneId }),
	);

	const ctx = {
		mode,
		name: project.name,
		canvas: {
			width: canvas.width ?? EDITOR_DEFAULT_WIDTH,
			height: canvas.height ?? EDITOR_DEFAULT_HEIGHT,
			presetId: canvas.presetId,
			background: canvas.background,
		},
		activeSceneId,
		sceneCount: scenes.length,
		totalDuration: scenes.reduce((n, s) => n + (s.duration ?? 0), 0),
		scenes,
		editorTools: [
			"text",
			"image",
			"video",
			"audio",
			"shape",
			"icon",
			"background-gradient",
			"layer-animation",
			"scene-transition",
			"advanced-motion",
		],
	};

	let context = ctx;
	let json = JSON.stringify(ctx);
	let truncated = false;

	if (json.length > MAX_CONTEXT_CHARS) {
		context = {
			...ctx,
			scenes: scenes.map((s) => ({
				...s,
				layers: s.emphasize ? s.layers : s.layers.slice(0, 4),
			})),
		};
		json = JSON.stringify(context);
		truncated = true;
	}

	return { context, json, truncated };
}

export function listProjectMedia(project, { origin = "", activeSceneId, limit = 6 } = {}) {
	const items = [];
	const scenes = project.scenes ?? [];
	const ordered = [
		...scenes.filter((s) => s.id === activeSceneId),
		...scenes.filter((s) => s.id !== activeSceneId),
	];

	for (const scene of ordered) {
		for (const layer of scene.layers ?? []) {
			if (items.length >= limit) return items;
			if (layer.type === "image" && layer.data?.src) {
				items.push({
					sceneName: scene.name,
					layerType: "image",
					src: layer.data.src,
					label: "Image layer",
				});
			}
			if (layer.type === "video" && layer.data?.src) {
				items.push({
					sceneName: scene.name,
					layerType: "video",
					src: layer.data.src,
					label: layer.data.label ?? "Video",
				});
			}
			if (layer.type === "audio" && layer.data?.src) {
				items.push({
					sceneName: scene.name,
					layerType: "audio",
					src: layer.data.src,
					label: layer.data.label ?? "Audio",
				});
			}
		}
	}

	return items.map((item) => ({
		...item,
		absoluteUrl: resolvePublicUrl(item.src, origin),
	}));
}

export function resolvePublicUrl(src, origin = "") {
	if (!src) return null;
	if (src.startsWith("data:")) return src;
	if (src.startsWith("http://") || src.startsWith("https://")) return src;
	if (src.startsWith("/") && origin) return `${origin.replace(/\/$/, "")}${src}`;
	return null;
}
