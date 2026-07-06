import { Group, Rect, Image } from "react-konva";
import {
	konvaAltDragHandlers,
	konvaVisualToLayerPosition,
	useKonvaDragHandlers,
	LayerHitRect,
} from "@/lib/video-editor/konvaDrag";
import {
	borderDashForStyle,
	computeImageDrawRect,
	clipRoundedRect,
} from "@/lib/video-editor/imageLayout";
import { mediaElementSize } from "@/lib/video-editor/mediaLayerStyle";

/**
 * Shared frame (ring, border, clip, shadow, object-fit) for image & video layers.
 */
export default function KonvaMediaFrame({
	layer,
	anim,
	mediaElement,
	placeholderFill = "rgba(0,0,0,0.08)",
	mediaImageRef,
	onSelect,
	onChange,
	registerRef,
	interactive,
	onAltDragDuplicate,
}) {
	const { data } = layer;
	const altDrag = konvaAltDragHandlers(layer, interactive, onAltDragDuplicate);
	const { x, y, pos, dragHandlers, selectHandlers } = useKonvaDragHandlers(
		layer,
		anim,
		onChange,
	);

	const borderRadius = data.borderRadius ?? 0;
	const borderWidth = data.borderWidth ?? 0;
	const ringWidth = data.ringWidth ?? 0;
	const ringOffset = data.ringOffset ?? 4;
	const ringPad = ringWidth > 0 ? ringOffset + ringWidth / 2 : 0;

	const size = mediaElementSize(mediaElement);
	const draw = size
		? computeImageDrawRect(
				size,
				layer.width,
				layer.height,
				data.objectFit ?? "cover",
				data.objectPosition ?? "center",
			)
		: { x: 0, y: 0, width: layer.width, height: layer.height };

	const handleTransformEnd = (e) => {
		const node = e.target;
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		const nextPos = konvaVisualToLayerPosition(layer, anim, node.x(), node.y());
		onChange({
			...nextPos,
			width: Math.max(20, node.width() * scaleX),
			height: Math.max(20, node.height() * scaleY),
			rotation: node.rotation() - (anim?.rotationOffset ?? 0),
		});
		node.scaleX(1);
		node.scaleY(1);
	};

	const shadowProps =
		(data.shadowBlur ?? 0) > 0
			? {
					shadowColor: data.shadowColor || "rgba(0,0,0,0.35)",
					shadowBlur: data.shadowBlur,
					shadowOffsetX: data.shadowOffsetX ?? 0,
					shadowOffsetY: data.shadowOffsetY ?? 0,
				}
			: {};

	return (
		<Group
			ref={registerRef}
			x={x}
			y={y}
			width={layer.width}
			height={layer.height}
			scaleX={pos.scaleX}
			scaleY={pos.scaleY}
			rotation={pos.rotation}
			opacity={pos.opacity}
			visible={layer.visible}
			draggable={interactive && !layer.locked}
			{...selectHandlers(onSelect)}
			{...altDrag}
			{...dragHandlers}
			onTransformEnd={handleTransformEnd}
		>
			{ringWidth > 0 && (
				<Rect
					x={-ringPad}
					y={-ringPad}
					width={layer.width + ringPad * 2}
					height={layer.height + ringPad * 2}
					cornerRadius={(data.ringRadius ?? borderRadius) + ringPad}
					stroke={data.ringColor || "#ffffff"}
					strokeWidth={ringWidth}
					fill="transparent"
					listening={false}
				/>
			)}

			<Group
				width={layer.width}
				height={layer.height}
				clipFunc={(ctx) =>
					clipRoundedRect(ctx, layer.width, layer.height, borderRadius)
				}
				listening={false}
				{...shadowProps}
			>
				{mediaElement ? (
					<Image
						ref={mediaImageRef}
						image={mediaElement}
						x={draw.x}
						y={draw.y}
						width={draw.width}
						height={draw.height}
						listening={false}
					/>
				) : (
					<Rect
						width={layer.width}
						height={layer.height}
						fill={placeholderFill}
						listening={false}
					/>
				)}
			</Group>

			{borderWidth > 0 && (
				<Rect
					width={layer.width}
					height={layer.height}
					cornerRadius={borderRadius}
					stroke={data.borderColor || "#ffffff"}
					strokeWidth={borderWidth}
					dash={borderDashForStyle(data.borderStyle ?? "solid")}
					fill="transparent"
					listening={false}
				/>
			)}

			<LayerHitRect width={layer.width} height={layer.height} />
		</Group>
	);
}
