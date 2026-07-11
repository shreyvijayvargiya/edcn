export function layerAnimProps(layer, anim, effective = null) {
	const lx = effective?.x ?? layer.x;
	const ly = effective?.y ?? layer.y;
	const rot = effective?.rotation ?? layer.rotation ?? 0;
	const op = effective?.opacity ?? layer.opacity ?? 1;
	const scaleKf = effective?.scale ?? 1;
	const cx = layer.width / 2;
	const cy = layer.height / 2;
	const sx = (anim.scaleX ?? 1) * scaleKf;
	const sy = (anim.scaleY ?? 1) * scaleKf;
	return {
		x: lx + (anim.offsetX ?? 0) + (sx !== 1 ? cx * (1 - sx) : 0),
		y: ly + (anim.offsetY ?? 0) + (sy !== 1 ? cy * (1 - sy) : 0),
		scaleX: sx,
		scaleY: sy,
		rotation: rot + (anim.rotationOffset ?? 0),
		opacity: op * (anim.opacityMult ?? 1),
	};
}

export function shapeAnimProps(layer, anim, effective = null) {
	const isCentered = layer.data?.shape === "circle" || layer.data?.shape === "ellipse";
	const rot = effective?.rotation ?? layer.rotation ?? 0;
	const op = effective?.opacity ?? layer.opacity ?? 1;
	const scaleKf = effective?.scale ?? 1;
	const sx = (anim.scaleX ?? 1) * scaleKf;
	const sy = (anim.scaleY ?? 1) * scaleKf;
	if (isCentered) {
		const cx = (effective?.x ?? layer.x) + layer.width / 2;
		const cy = (effective?.y ?? layer.y) + layer.height / 2;
		return {
			x: cx + (anim.offsetX ?? 0),
			y: cy + (anim.offsetY ?? 0),
			scaleX: sx,
			scaleY: sy,
			rotation: rot + (anim.rotationOffset ?? 0),
			opacity: op * (anim.opacityMult ?? 1),
		};
	}
	return layerAnimProps(layer, anim, effective);
}
