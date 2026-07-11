import { listProjectMedia, resolvePublicUrl } from "./buildProjectContext";

const MAX_ATTACHMENTS = 5;
const MAX_IMAGE_BYTES = 180_000;

async function blobToDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

async function fetchAsDataUrl(url) {
	const res = await fetch(url);
	const blob = await res.blob();
	if (blob.size > MAX_IMAGE_BYTES) return null;
	return blobToDataUrl(blob);
}

export async function prepareMediaAttachments(project, { activeSceneId, origin }) {
	const media = listProjectMedia(project, { origin, activeSceneId, limit: MAX_ATTACHMENTS * 2 });
	const attachments = [];

	for (const item of media) {
		if (attachments.length >= MAX_ATTACHMENTS) break;
		if (item.layerType !== "image") continue;

		const src = item.src;
		let dataUrl = null;

		if (src.startsWith("data:")) {
			dataUrl = src;
		} else if (src.startsWith("blob:")) {
			try {
				dataUrl = await fetchAsDataUrl(src);
			} catch {
				/* skip */
			}
		} else {
			const absolute = resolvePublicUrl(src, origin);
			if (absolute) {
				try {
					dataUrl = await fetchAsDataUrl(absolute);
				} catch {
					attachments.push({ type: "image_url", url: absolute, label: item.label });
					continue;
				}
			}
		}

		if (dataUrl) {
			attachments.push({
				type: "image_url",
				url: dataUrl,
				label: `${item.sceneName}: image`,
			});
		}
	}

	const mediaNotes = media
		.filter((m) => m.layerType !== "image" || !attachments.some((a) => a.url?.includes(m.src)))
		.map((m) => ({
			scene: m.sceneName,
			type: m.layerType,
			label: m.label,
			src: m.absoluteUrl ?? m.src,
		}));

	return { attachments, mediaNotes };
}
