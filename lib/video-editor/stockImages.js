/**
 * Curated stock photos via Picsum Photos (free, no API key).
 * Thumbs load in the left panel; full URLs are used on the canvas.
 * @see https://picsum.photos/
 */

import { filterByLabelTags } from "./catalogFilter";

const PICSUM = "https://picsum.photos";

export const STOCK_IMAGES = [
	{ id: "mountain-lake", label: "Mountain lake", picsumId: 101, tags: ["nature", "mountain"] },
	{ id: "desert-road", label: "Desert road", picsumId: 102, tags: ["landscape", "road"] },
	{ id: "forest-path", label: "Forest path", picsumId: 103, tags: ["nature", "forest"] },
	{ id: "city-skyline", label: "City skyline", picsumId: 104, tags: ["city", "urban"] },
	{ id: "ocean-waves", label: "Ocean waves", picsumId: 106, tags: ["ocean", "beach"] },
	{ id: "coffee-desk", label: "Coffee desk", picsumId: 107, tags: ["workspace", "coffee"] },
	{ id: "sunset-hills", label: "Sunset hills", picsumId: 108, tags: ["sunset", "nature"] },
	{ id: "snow-peaks", label: "Snow peaks", picsumId: 110, tags: ["winter", "mountain"] },
	{ id: "tropical-beach", label: "Tropical beach", picsumId: 111, tags: ["beach", "tropical"] },
	{ id: "autumn-trees", label: "Autumn trees", picsumId: 113, tags: ["fall", "nature"] },
	{ id: "night-city", label: "Night city", picsumId: 114, tags: ["city", "night"] },
	{ id: "wildflowers", label: "Wildflowers", picsumId: 115, tags: ["flowers", "nature"] },
	{ id: "coastal-cliffs", label: "Coastal cliffs", picsumId: 116, tags: ["ocean", "cliff"] },
	{ id: "minimal-interior", label: "Minimal interior", picsumId: 117, tags: ["interior", "home"] },
	{ id: "rainy-street", label: "Rainy street", picsumId: 118, tags: ["city", "rain"] },
	{ id: "golden-field", label: "Golden field", picsumId: 119, tags: ["field", "sunset"] },
	{ id: "misty-forest", label: "Misty forest", picsumId: 120, tags: ["forest", "fog"] },
	{ id: "desert-dunes", label: "Desert dunes", picsumId: 121, tags: ["desert", "sand"] },
	{ id: "lake-reflection", label: "Lake reflection", picsumId: 122, tags: ["lake", "water"] },
	{ id: "urban-bridge", label: "Urban bridge", picsumId: 123, tags: ["city", "bridge"] },
	{ id: "mountain-meadow", label: "Mountain meadow", picsumId: 124, tags: ["meadow", "mountain"] },
	{ id: "palm-sunset", label: "Palm sunset", picsumId: 125, tags: ["palm", "sunset"] },
	{ id: "rocky-shore", label: "Rocky shore", picsumId: 126, tags: ["ocean", "rocks"] },
	{ id: "snowy-village", label: "Snowy village", picsumId: 127, tags: ["winter", "village"] },
	{ id: "green-valley", label: "Green valley", picsumId: 128, tags: ["valley", "green"] },
	{ id: "street-cafe", label: "Street café", picsumId: 129, tags: ["cafe", "city"] },
	{ id: "waterfall", label: "Waterfall", picsumId: 130, tags: ["waterfall", "nature"] },
	{ id: "canyon", label: "Canyon", picsumId: 131, tags: ["canyon", "desert"] },
	{ id: "harbor-boats", label: "Harbor boats", picsumId: 132, tags: ["harbor", "boats"] },
	{ id: "lavender-field", label: "Lavender field", picsumId: 133, tags: ["lavender", "flowers"] },
	{ id: "modern-building", label: "Modern building", picsumId: 134, tags: ["architecture", "modern"] },
	{ id: "countryside", label: "Countryside", picsumId: 135, tags: ["rural", "farm"] },
	{ id: "storm-clouds", label: "Storm clouds", picsumId: 136, tags: ["sky", "clouds"] },
	{ id: "river-bridge", label: "River bridge", picsumId: 137, tags: ["river", "bridge"] },
	{ id: "night-sky", label: "Night sky", picsumId: 139, tags: ["stars", "night"] },
	{ id: "sand-beach", label: "Sand beach", picsumId: 140, tags: ["beach", "sand"] },
	{ id: "wooden-dock", label: "Wooden dock", picsumId: 141, tags: ["lake", "dock"] },
	{ id: "red-rock", label: "Red rock", picsumId: 142, tags: ["desert", "rock"] },
	{ id: "morning-fog", label: "Morning fog", picsumId: 143, tags: ["fog", "morning"] },
	{ id: "city-lights", label: "City lights", picsumId: 144, tags: ["city", "lights"] },
	{ id: "pine-trees", label: "Pine trees", picsumId: 145, tags: ["forest", "pine"] },
	{ id: "ocean-horizon", label: "Ocean horizon", picsumId: 146, tags: ["ocean", "horizon"] },
	{ id: "rolling-hills", label: "Rolling hills", picsumId: 147, tags: ["hills", "landscape"] },
	{ id: "sunrise-glow", label: "Sunrise glow", picsumId: 149, tags: ["sunrise", "sky"] },
];

export function stockImageThumbUrl(item) {
	return `${PICSUM}/id/${item.picsumId}/400/300`;
}

export function stockImageSrcUrl(item) {
	return `${PICSUM}/id/${item.picsumId}/1920/1080`;
}

export function filterStockImages(query) {
	return filterByLabelTags(STOCK_IMAGES, query);
}

/** Load natural dimensions for fitting on canvas (CORS-safe for Picsum). */
export function loadImageDimensions(src) {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.crossOrigin = "anonymous";
		img.onload = () =>
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = src;
	});
}

/** Scale image to fit inside canvas with padding. */
export function fitImageOnCanvas(naturalW, naturalH, canvasW, canvasH, paddingRatio = 0.12) {
	const pad = paddingRatio;
	const maxW = canvasW * (1 - pad * 2);
	const maxH = canvasH * (1 - pad * 2);
	const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
	const width = Math.round(naturalW * scale);
	const height = Math.round(naturalH * scale);
	return {
		width,
		height,
		x: Math.round((canvasW - width) / 2),
		y: Math.round((canvasH - height) / 2),
	};
}
