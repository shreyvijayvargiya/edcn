import { useState, useCallback, useMemo } from "react";
import { Rect } from "react-konva";
import { layerAnimProps } from "./animations";

export function getLayerNodePosition(layer) {
	if (layer.type === "shape") {
		const shape = layer.data?.shape;
		if (shape === "circle" || shape === "ellipse") {
			return { x: layer.x + layer.width / 2, y: layer.y + layer.height / 2 };
		}
	}
	return { x: layer.x, y: layer.y };
}

/** Konva visual position → layer top-left, accounting for enter-animation offsets */
export function konvaVisualToLayerPosition(layer, anim, visualX, visualY) {
	const cx = layer.width / 2;
	const cy = layer.height / 2;
	const sx = anim?.scaleX ?? 1;
	const sy = anim?.scaleY ?? 1;
	return {
		x: visualX - (anim?.offsetX ?? 0) - (sx !== 1 ? cx * (1 - sx) : 0),
		y: visualY - (anim?.offsetY ?? 0) - (sy !== 1 ? cy * (1 - sy) : 0),
	};
}

/** Center-anchored shape position → layer top-left */
export function konvaCenterToLayerPosition(layer, visualX, visualY, anim) {
	return {
		x: visualX - layer.width / 2 - (anim?.offsetX ?? 0),
		y: visualY - layer.height / 2 - (anim?.offsetY ?? 0),
	};
}

/**
 * Transparent hit target — groups with only listening={false} children
 * cannot receive pointer events in Konva.
 */
export function LayerHitRect({ width, height }) {
	return (
		<Rect
			width={width}
			height={height}
			fill="rgba(0,0,0,0.001)"
			listening
		/>
	);
}

/**
 * Drag + display position for controlled Konva nodes.
 * Uses local state during drag so React re-renders don't snap the node back.
 */
export function useKonvaDragHandlers(layer, anim, onChange, { centered = false, getPosition } = {}) {
	const [dragPos, setDragPos] = useState(null);
	const pos = getPosition ? getPosition(layer, anim) : layerAnimProps(layer, anim);

	const commitPosition = useCallback(
		(node) => {
			const changes = centered
				? konvaCenterToLayerPosition(layer, node.x(), node.y(), anim)
				: konvaVisualToLayerPosition(layer, anim, node.x(), node.y());
			onChange(changes);
		},
		[layer, anim, onChange, centered],
	);

	const dragHandlers = useMemo(
		() => ({
			onDragStart: (e) => {
				setDragPos({ x: e.target.x(), y: e.target.y() });
			},
			onDragMove: (e) => {
				setDragPos({ x: e.target.x(), y: e.target.y() });
			},
			onDragEnd: (e) => {
				commitPosition(e.target);
				setDragPos(null);
			},
		}),
		[commitPosition],
	);

	const selectHandlers = useCallback(
		(onSelect) => ({
			onClick: (e) => {
				e.cancelBubble = true;
				onSelect?.();
			},
			onTap: (e) => {
				e.cancelBubble = true;
				onSelect?.();
			},
		}),
		[],
	);

	return {
		x: dragPos?.x ?? pos.x,
		y: dragPos?.y ?? pos.y,
		pos,
		dragHandlers,
		selectHandlers,
	};
}

/** @deprecated Use useKonvaDragHandlers */
export function createKonvaDragHandlers({ layer, anim, onChange, centered = false }) {
	const sync = (node) => {
		const changes = centered
			? konvaCenterToLayerPosition(layer, node.x(), node.y(), anim)
			: konvaVisualToLayerPosition(layer, anim, node.x(), node.y());
		onChange(changes);
	};

	return {
		onDragMove: (e) => sync(e.target),
		onDragEnd: (e) => sync(e.target),
	};
}

/** Option/Alt + drag → duplicate in place and drag the copy */
export function konvaAltDragHandlers(layer, interactive, onAltDragDuplicate) {
	if (!interactive || !onAltDragDuplicate) return {};
	return {
		onDragStart: (e) => {
			if (!e.evt?.altKey) return;
			e.target.stopDrag();
			e.target.position(getLayerNodePosition(layer));
			onAltDragDuplicate(layer.id);
		},
	};
}
