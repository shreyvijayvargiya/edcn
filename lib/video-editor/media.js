/** Probe duration of a video or audio blob/url before adding to timeline */

export function getMediaDuration(src, kind = "video") {
	return new Promise((resolve, reject) => {
		const el = document.createElement(kind === "audio" ? "audio" : "video");
		el.preload = "metadata";
		el.muted = true;

		const cleanup = () => {
			el.removeAttribute("src");
			el.load();
		};

		el.onloadedmetadata = () => {
			const duration = el.duration;
			cleanup();
			if (Number.isFinite(duration) && duration > 0) {
				resolve(duration);
			} else {
				reject(new Error("Could not read media duration"));
			}
		};
		el.onerror = () => {
			cleanup();
			reject(new Error("Failed to load media metadata"));
		};
		el.src = src;
	});
}

export function roundMediaDuration(seconds) {
	return Math.round(seconds * 100) / 100;
}
