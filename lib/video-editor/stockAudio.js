/** Curated sample audio clips in /public/samples */

export const STOCK_AUDIO = [
	{
		id: "cartoon-boing",
		label: "Cartoon boing",
		tags: ["sfx", "cartoon", "short"],
		src: "/samples/cartoon-boing.ogg",
		duration: 1,
	},
	{
		id: "soft-bell",
		label: "Soft bell",
		tags: ["sfx", "bell", "short"],
		src: "/samples/soft-bell.ogg",
		duration: 2,
	},
	{
		id: "drum-hit",
		label: "Drum hit",
		tags: ["sfx", "drum", "short"],
		src: "/samples/drum-hit.ogg",
		duration: 1,
	},
];

export function filterStockAudio(query) {
	if (!query?.trim()) return STOCK_AUDIO;
	const q = query.trim().toLowerCase();
	return STOCK_AUDIO.filter(
		(item) =>
			item.label.toLowerCase().includes(q) ||
			item.tags.some((tag) => tag.includes(q)),
	);
}
