import { uid } from "../utils";

export function mergeAiWithExisting(sanitized, existingProject) {
	if (!sanitized?.scenes?.length || !existingProject?.scenes?.length) {
		return sanitized;
	}

	return {
		...sanitized,
		name: sanitized.name ?? existingProject.name,
		scenes: sanitized.scenes.map((aiScene, sceneIndex) => {
			const existingScene = existingProject.scenes[sceneIndex];
			if (!existingScene) return aiScene;

			const layers = (aiScene.layers ?? []).map((aiLayer, layerIndex) => {
				const existingLayer = existingScene.layers?.[layerIndex];
				if (!existingLayer) return aiLayer;

				const data = { ...aiLayer.data };
				if (["image", "video", "audio"].includes(aiLayer.type)) {
					const existingSrc = existingLayer.data?.src;
					const aiSrc = data.src;
					const keepExisting =
						existingSrc &&
						(!aiSrc ||
							aiSrc === existingSrc ||
							(existingSrc.startsWith("blob:") && !aiSrc.startsWith("http")));

					if (keepExisting) {
						data.src = existingSrc;
						if (existingLayer.data?.label && !data.label) {
							data.label = existingLayer.data.label;
						}
					}
				}
				return { ...aiLayer, data };
			});

			return {
				...aiScene,
				_preserveSceneId: existingScene.id,
				_preserveLayerIds: existingScene.layers?.map((l) => l.id) ?? [],
				layers,
			};
		}),
	};
}

export function applyPreservedIds(scene, sceneSpec) {
	const layers = scene.layers.map((layer, i) => {
		const preservedId = sceneSpec._preserveLayerIds?.[i];
		return preservedId ? { ...layer, id: preservedId } : layer;
	});

	return {
		...scene,
		id: sceneSpec._preserveSceneId ?? scene.id ?? uid("scene"),
		layers,
	};
}
