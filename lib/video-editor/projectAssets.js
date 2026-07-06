const MEDIA_TYPES = new Set(["image", "video"]);

export function getLayerAssetName(layer) {
	if (!layer) return "Untitled asset";
	if (layer.data?.label) return layer.data.label;
	if (layer.data?.name) return layer.data.name;
	if (layer.type === "image") return "Image";
	if (layer.type === "video") return "Video clip";
	return "Asset";
}

export function collectProjectAssets(project) {
	if (!project?.scenes) return [];

	const assets = [];

	for (const scene of project.scenes) {
		for (const layer of scene.layers ?? []) {
			if (!MEDIA_TYPES.has(layer.type)) continue;
			const src = layer.data?.src;
			if (!src) continue;

			assets.push({
				id: `${scene.id}:${layer.id}`,
				layerId: layer.id,
				sceneId: scene.id,
				sceneName: scene.name || "Scene",
				type: layer.type,
				src,
				name: getLayerAssetName(layer),
			});
		}
	}

	return assets;
}

export function assetRenamePatch(layer, name) {
	const trimmed = name.trim();
	if (!trimmed) return null;
	if (layer.type === "image") {
		return { name: trimmed };
	}
	return { label: trimmed };
}
