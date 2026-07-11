/** Registry of timeline video elements for offline export seeking. */

const videos = new Map();

/**
 * @param {string} layerId
 * @param {HTMLVideoElement} videoEl
 * @param {(previewTime: number) => number} getMediaTime maps scene preview time → video.currentTime
 */
export function registerExportVideo(layerId, videoEl, getMediaTime) {
	if (!layerId || !videoEl) return;
	videos.set(layerId, { videoEl, getMediaTime });
}

export function unregisterExportVideo(layerId) {
	videos.delete(layerId);
}

function seekVideo(video, time, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const target = Math.max(0, time);
		if (
			Number.isFinite(video.currentTime) &&
			Math.abs(video.currentTime - target) < 0.04
		) {
			resolve();
			return;
		}

		const onSeeked = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			resolve();
		};
		const onAbort = () => {
			cleanup();
			reject(new DOMException("Aborted", "AbortError"));
		};

		const cleanup = () => {
			video.removeEventListener("seeked", onSeeked);
			video.removeEventListener("error", onError);
			signal?.removeEventListener("abort", onAbort);
			clearTimeout(timeoutId);
		};

		const timeoutId = setTimeout(() => {
			cleanup();
			resolve();
		}, 250);

		video.addEventListener("seeked", onSeeked, { once: true });
		video.addEventListener("error", onError, { once: true });
		signal?.addEventListener("abort", onAbort, { once: true });

		try {
			video.pause();
			video.currentTime = target;
		} catch {
			cleanup();
			resolve();
		}
	});
}

/** Seek every registered export video to match the current preview time. */
export async function waitForExportMedia(previewTime, signal) {
	if (videos.size === 0) return;

	const tasks = [];
	for (const { videoEl, getMediaTime } of videos.values()) {
		if (videoEl.readyState < 1) continue;
		const mediaTime = getMediaTime(previewTime);
		tasks.push(seekVideo(videoEl, mediaTime, signal));
	}

	if (tasks.length) await Promise.all(tasks);
}

export function getExportVideoCount() {
	return videos.size;
}
