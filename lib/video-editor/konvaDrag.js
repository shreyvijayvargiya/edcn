/** Konva drag helpers for video editor canvas */

export function getLayerNodePosition(layer) {
	if (layer.type === "shape") {
		const shape = layer.data?.shape;
		if (shape === "circle" || shape === "ellipse") {
			return { x: layer.x + layer.width / 2, y: layer.y + layer.height / 2 };
		}
	}
	return { x: layer.x, y: layer.y };
}

/** Option/Alt + drag → duplicate in place and drag the copy */
export function konvaAltDragHandlers(layer, interactive, onAltDragDuplicate) {
	if (!interactive || !onAltDragDuplicate) return {};
	return {
		onDragStart: (e) => {
			if (!e.evt.altKey) return;
			e.target.stopDrag();
			e.target.position(getLayerNodePosition(layer));
			onAltDragDuplicate(layer.id);
		},
	};
}
