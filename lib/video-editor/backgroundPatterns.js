/** CSS background patterns — preview tiles + Konva fillPattern tiles */

const DEFAULT_BG = "#18181b";
const DEFAULT_FG = "rgba(255,255,255,0.12)";

function dotTile(ctx, size, fg, bg, radius, spacing) {
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, size, size);
	ctx.fillStyle = fg;
	const step = spacing;
	for (let y = step / 2; y < size; y += step) {
		for (let x = step / 2; x < size; x += step) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

function lineTile(ctx, size, fg, bg, draw) {
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, size, size);
	ctx.strokeStyle = fg;
	ctx.lineWidth = 1;
	draw(ctx, size);
}

export const BACKGROUND_PATTERNS = [
	{
		id: "dots",
		label: "Dots",
		css: (fg, bg) =>
			`radial-gradient(${fg} 1px, ${bg} 1px)`,
		cssSize: "12px 12px",
		paint: (ctx, size, fg, bg) => dotTile(ctx, size, fg, bg, 1, 12),
	},
	{
		id: "large-dots",
		label: "Large Dots",
		css: (fg, bg) =>
			`radial-gradient(${fg} 2px, ${bg} 2px)`,
		cssSize: "20px 20px",
		paint: (ctx, size, fg, bg) => dotTile(ctx, size, fg, bg, 2, 20),
	},
	{
		id: "grid",
		label: "Grid",
		css: (fg, bg) =>
			`linear-gradient(${fg} 1px, transparent 1px), linear-gradient(90deg, ${fg} 1px, transparent 1px)`,
		cssSize: "16px 16px",
		paint: (ctx, size, fg, bg) =>
			lineTile(ctx, size, fg, bg, (c, s) => {
				for (let i = 0; i <= s; i += 16) {
					c.beginPath();
					c.moveTo(i, 0);
					c.lineTo(i, s);
					c.stroke();
					c.beginPath();
					c.moveTo(0, i);
					c.lineTo(s, i);
					c.stroke();
				}
			}),
	},
	{
		id: "grid-dots",
		label: "Grid Dots",
		css: (fg, bg) =>
			`radial-gradient(${fg} 1px, transparent 1px), linear-gradient(${bg} 16px, transparent 16px), linear-gradient(90deg, ${bg} 16px, transparent 16px)`,
		cssSize: "16px 16px",
		paint: (ctx, size, fg, bg) => {
			dotTile(ctx, size, fg, bg, 1, 16);
		},
	},
	{
		id: "diagonal-lines",
		label: "Diagonal Lines",
		css: (fg, bg) =>
			`repeating-linear-gradient(45deg, ${fg}, ${fg} 1px, ${bg} 1px, ${bg} 10px)`,
		cssSize: "auto",
		paint: (ctx, size, fg, bg) =>
			lineTile(ctx, size, fg, bg, (c, s) => {
				for (let i = -s; i < s * 2; i += 10) {
					c.beginPath();
					c.moveTo(i, 0);
					c.lineTo(i + s, s);
					c.stroke();
				}
			}),
	},
	{
		id: "diagonal-lines-reverse",
		label: "Diagonal Lines (Reverse)",
		css: (fg, bg) =>
			`repeating-linear-gradient(-45deg, ${fg}, ${fg} 1px, ${bg} 1px, ${bg} 10px)`,
		cssSize: "auto",
		paint: (ctx, size, fg, bg) =>
			lineTile(ctx, size, fg, bg, (c, s) => {
				for (let i = -s; i < s * 2; i += 10) {
					c.beginPath();
					c.moveTo(i, s);
					c.lineTo(i + s, 0);
					c.stroke();
				}
			}),
	},
	{
		id: "crosshatch",
		label: "Crosshatch",
		css: (fg, bg) =>
			`repeating-linear-gradient(45deg, ${fg} 0, ${fg} 1px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, ${fg} 0, ${fg} 1px, transparent 1px, transparent 8px)`,
		cssSize: "auto",
		paint: (ctx, size, fg, bg) => {
			lineTile(ctx, size, fg, bg, (c, s) => {
				for (let i = -s; i < s * 2; i += 8) {
					c.beginPath();
					c.moveTo(i, 0);
					c.lineTo(i + s, s);
					c.stroke();
					c.beginPath();
					c.moveTo(i, s);
					c.lineTo(i + s, 0);
					c.stroke();
				}
			});
		},
	},
	{
		id: "waves",
		label: "Waves",
		css: (fg, bg) =>
			`repeating-radial-gradient(circle at 0 100%, ${fg}, ${fg} 2px, ${bg} 2px, ${bg} 12px)`,
		cssSize: "24px 24px",
		paint: (ctx, size, fg, bg) =>
			lineTile(ctx, size, fg, bg, (c, s) => {
				c.lineWidth = 2;
				for (let y = 8; y < s; y += 16) {
					c.beginPath();
					for (let x = 0; x <= s; x += 4) {
						c.lineTo(x, y + Math.sin(x / 6) * 4);
					}
					c.stroke();
				}
			}),
	},
	{
		id: "hexagons",
		label: "Hexagons",
		css: (fg, bg) =>
			`radial-gradient(circle farthest-side at 0% 50%, ${bg} 23.5%, transparent 0) 21px 30px, radial-gradient(circle farthest-side at 0% 50%, ${fg} 24%, transparent 0) 19px 30px, linear-gradient(${bg} 14px, transparent 0) 0 -12px, linear-gradient(${fg} 14px, transparent 0) 0 -12px, linear-gradient(150deg, ${bg} 24%, ${fg} 0) 0 -12px, linear-gradient(30deg, ${bg} 24%, ${fg} 0) 0 -12px`,
		cssSize: "40px 60px",
		paint: (ctx, size, fg, bg) => {
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, size, size);
			ctx.strokeStyle = fg;
			ctx.lineWidth = 1;
			const r = 10;
			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 3; col++) {
					const cx = col * r * 1.8 + (row % 2 ? r : 0) + r;
					const cy = row * r * 1.5 + r;
					ctx.beginPath();
					for (let i = 0; i < 6; i++) {
						const a = (Math.PI / 3) * i - Math.PI / 6;
						const x = cx + r * 0.55 * Math.cos(a);
						const y = cy + r * 0.55 * Math.sin(a);
						if (i === 0) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
					}
					ctx.closePath();
					ctx.stroke();
				}
			}
		},
	},
	{
		id: "circles",
		label: "Circles",
		css: (fg, bg) =>
			`radial-gradient(circle, transparent 40%, ${fg} 41%, ${fg} 43%, transparent 44%)`,
		cssSize: "24px 24px",
		paint: (ctx, size, fg, bg) => {
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, size, size);
			ctx.strokeStyle = fg;
			for (let y = 12; y < size; y += 24) {
				for (let x = 12; x < size; x += 24) {
					ctx.beginPath();
					ctx.arc(x, y, 8, 0, Math.PI * 2);
					ctx.stroke();
				}
			}
		},
	},
	{
		id: "squares",
		label: "Squares",
		css: (fg, bg) =>
			`linear-gradient(${fg} 2px, transparent 2px) -1px -1px, linear-gradient(90deg, ${fg} 2px, transparent 2px) -1px -1px, ${bg}`,
		cssSize: "18px 18px",
		paint: (ctx, size, fg, bg) => {
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, size, size);
			ctx.strokeStyle = fg;
			ctx.lineWidth = 2;
			for (let y = 0; y < size; y += 18) {
				for (let x = 0; x < size; x += 18) {
					ctx.strokeRect(x + 2, y + 2, 12, 12);
				}
			}
		},
	},
	{
		id: "triangles",
		label: "Triangles",
		css: (fg, bg) =>
			`linear-gradient(135deg, ${fg} 12%, transparent 12%)`,
		cssSize: "16px 16px",
		paint: (ctx, size, fg, bg) => {
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, size, size);
			ctx.fillStyle = fg;
			for (let y = 0; y < size; y += 16) {
				for (let x = 0; x < size; x += 16) {
					ctx.beginPath();
					ctx.moveTo(x, y + 16);
					ctx.lineTo(x + 8, y);
					ctx.lineTo(x + 16, y + 16);
					ctx.closePath();
					ctx.fill();
				}
			}
		},
	},
	{
		id: "zigzag",
		label: "Zigzag",
		css: (fg, bg) =>
			`linear-gradient(135deg, ${fg} 25%, transparent 25%) -10px 0, linear-gradient(225deg, ${fg} 25%, transparent 25%) -10px 0, linear-gradient(315deg, ${fg} 25%, transparent 25%), linear-gradient(45deg, ${fg} 25%, transparent 25%)`,
		cssSize: "20px 20px",
		paint: (ctx, size, fg, bg) =>
			lineTile(ctx, size, fg, bg, (c, s) => {
				c.lineWidth = 2;
				for (let y = 0; y < s; y += 10) {
					c.beginPath();
					for (let x = 0; x <= s; x += 10) {
						c.lineTo(x, y + (x / 10 % 2 ? 6 : 0));
					}
					c.stroke();
				}
			}),
	},
	{
		id: "scattered-dots",
		label: "Scattered Dots",
		css: (fg, bg) =>
			`radial-gradient(${fg} 1.5px, transparent 1.5px) 0 0, radial-gradient(${fg} 1px, transparent 1px) 8px 8px`,
		cssSize: "16px 16px",
		paint: (ctx, size, fg, bg) => {
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, size, size);
			ctx.fillStyle = fg;
			const pts = [
				[4, 6],
				[14, 3],
				[22, 12],
				[8, 18],
				[18, 22],
				[26, 8],
			];
			for (const [x, y] of pts) {
				ctx.beginPath();
				ctx.arc(x % size, y % size, 1.5, 0, Math.PI * 2);
				ctx.fill();
			}
		},
	},
	{
		id: "vertical-lines",
		label: "Vertical Lines",
		css: (fg, bg) =>
			`repeating-linear-gradient(90deg, ${fg}, ${fg} 1px, ${bg} 1px, ${bg} 12px)`,
		cssSize: "auto",
		paint: (ctx, size, fg, bg) =>
			lineTile(ctx, size, fg, bg, (c, s) => {
				for (let x = 0; x <= s; x += 12) {
					c.beginPath();
					c.moveTo(x, 0);
					c.lineTo(x, s);
					c.stroke();
				}
			}),
	},
	{
		id: "horizontal-lines",
		label: "Horizontal Lines",
		css: (fg, bg) =>
			`repeating-linear-gradient(0deg, ${fg}, ${fg} 1px, ${bg} 1px, ${bg} 12px)`,
		cssSize: "auto",
		paint: (ctx, size, fg, bg) =>
			lineTile(ctx, size, fg, bg, (c, s) => {
				for (let y = 0; y <= s; y += 12) {
					c.beginPath();
					c.moveTo(0, y);
					c.lineTo(s, y);
					c.stroke();
				}
			}),
	},
];

const patternCache = new Map();

export function patternPreviewStyle(patternId, fg = DEFAULT_FG, bg = DEFAULT_BG) {
	const pattern = BACKGROUND_PATTERNS.find((p) => p.id === patternId);
	if (!pattern) return { backgroundColor: bg };
	return {
		backgroundColor: bg,
		backgroundImage: pattern.css(fg, bg),
		backgroundSize: pattern.cssSize,
	};
}

export function getPatternCanvas(patternId, fg = DEFAULT_FG, bg = DEFAULT_BG, tileSize = 32) {
	const key = `${patternId}:${fg}:${bg}:${tileSize}`;
	if (patternCache.has(key)) return patternCache.get(key);

	const pattern = BACKGROUND_PATTERNS.find((p) => p.id === patternId);
	if (!pattern) return null;

	const canvas = document.createElement("canvas");
	canvas.width = tileSize;
	canvas.height = tileSize;
	const ctx = canvas.getContext("2d");
	pattern.paint(ctx, tileSize, fg, bg);
	patternCache.set(key, canvas);
	return canvas;
}

export { DEFAULT_BG, DEFAULT_FG };
