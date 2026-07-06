/** Curated sample videos bundled in /public for the left panel */

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
	if (!query?.trim()) return STOCK_VIDEOS;
	const q = query.trim().toLowerCase();
	return STOCK_VIDEOS.filter(
		(item) =>
			item.label.toLowerCase().includes(q) ||
			item.tags.some((tag) => tag.includes(q)),
	);
}
