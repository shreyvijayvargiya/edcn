import { STOCK_AUDIO } from "./stockAudio";
import { filterByLabelTags } from "./catalogFilter";

/** Merge session recordings with stock catalog for the audio panel list. */
export function mergeAudioLibrary(recordedTracks = [], search = "") {
	const recorded = filterByLabelTags(recordedTracks, search, {
		extraKeys: ["transcript"],
	}).map((t) => ({ ...t, isRecorded: true }));

	const stock = filterByLabelTags(STOCK_AUDIO, search);

	return { recorded, stock, total: recorded.length + stock.length };
}
