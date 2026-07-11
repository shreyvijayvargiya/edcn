/**
 * Shared label/tags search for stock media, UI presets, and recorded audio.
 * @param {Array<{ label?: string, tags?: string[], [key: string]: unknown }>} items
 * @param {string} [query]
 * @param {{ extraKeys?: string[] }} [options] — extra string fields to match (e.g. category, transcript)
 */
export function filterByLabelTags(items, query, { extraKeys = [] } = {}) {
	if (!query?.trim()) return items;
	const q = query.trim().toLowerCase();
	return items.filter((item) => {
		if (item.label?.toLowerCase().includes(q)) return true;
		if (item.tags?.some((tag) => String(tag).toLowerCase().includes(q))) return true;
		return extraKeys.some((key) => {
			const value = item[key];
			return typeof value === "string" && value.toLowerCase().includes(q);
		});
	});
}
