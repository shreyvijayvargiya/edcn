/** Shared HTMLImageElement cache for Konva layers and export preloading. */

const cache = new Map();

export function getCachedImage(src) {
	if (!src) return null;
	const img = cache.get(src);
	return img?.complete ? img : null;
}

export function loadKonvaImage(src) {
	if (!src) return Promise.resolve(null);

	const cached = getCachedImage(src);
	if (cached) return Promise.resolve(cached);

	if (cache.has(src)) {
		const pending = cache.get(src);
		return new Promise((resolve) => {
			pending.addEventListener("load", () => resolve(pending), { once: true });
			pending.addEventListener("error", () => resolve(null), { once: true });
		});
	}

	return new Promise((resolve) => {
		const img = new window.Image();
		img.crossOrigin = "anonymous";
		cache.set(src, img);
		img.onload = () => resolve(img);
		img.onerror = () => {
			cache.delete(src);
			resolve(null);
		};
		img.src = src;
	});
}

export async function preloadImageSources(urls) {
	await Promise.all(urls.map((src) => loadKonvaImage(src)));
}

export function collectProjectImageSources(project) {
	const urls = new Set();
	for (const scene of project.scenes ?? []) {
		for (const layer of scene.layers ?? []) {
			if (layer.type === "image" && layer.data?.src) {
				urls.add(layer.data.src);
			}
		}
	}
	return [...urls];
}

export async function preloadProjectImages(project) {
	return preloadImageSources(collectProjectImageSources(project));
}
