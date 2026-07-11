/** Curated sample videos bundled in /public for the left panel */

import { filterByLabelTags } from "./catalogFilter";

export const STOCK_VIDEOS = [
	{
		id: "demo-clip",
		label: "Demo clip",
		tags: ["sample", "demo"],
		src: "/sample-video-1.mp4",
		duration: 10,
	},
];

export function filterStockVideos(query) {
	return filterByLabelTags(STOCK_VIDEOS, query);
}
