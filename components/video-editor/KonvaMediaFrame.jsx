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
import { layerAnimProps } from "@/lib/video-editor/animations";
import { mediaElementSize, DEFAULT_MEDIA_LAYER_STYLE } from "@/lib/video-editor/mediaLayerStyle";
import {
	resolveLayerChrome,
	konvaRingPad,
	konvaShadowProps,
} from "@/lib/video-editor/layerChromeStyle";

/**
 * Shared frame (ring, border, clip, shadow, object-fit) for image & video layers.
 */
export default function KonvaMediaFrame({
	layer,
	anim,
	effective = null,
	mediaElement,
	secondaryMediaElement = null,
	frameSwap = null,
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
		{
			getPosition: effective
				? () => layerAnimProps(layer, anim, effective)
				: undefined,
		},
	);

	const chrome = resolveLayerChrome(data, DEFAULT_MEDIA_LAYER_STYLE);
	const { borderRadius, borderWidth, ringWidth, ringColor, ringRadius, borderColor, borderStyle } =
		chrome;
	const ringPad = konvaRingPad(chrome);

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

	const size2 = mediaElementSize(secondaryMediaElement);
	const draw2 = size2
		? computeImageDrawRect(
				size2,
				layer.width,
				layer.height,
				data.objectFit ?? "cover",
				data.objectPosition ?? "center",
			)
		: draw;

	const f1Opacity = frameSwap?.frame1Opacity ?? 1;
	const f2Opacity = frameSwap?.frame2Opacity ?? 0;

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

	const shadowProps = konvaShadowProps(chrome);

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
					cornerRadius={(ringRadius ?? borderRadius) + ringPad}
					stroke={ringColor || "#ffffff"}
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
						opacity={f1Opacity}
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
				{frameSwap && secondaryMediaElement ? (
					<Image
						image={secondaryMediaElement}
						x={draw2.x}
						y={draw2.y}
						width={draw2.width}
						height={draw2.height}
						opacity={f2Opacity}
						listening={false}
					/>
				) : null}
			</Group>

			{borderWidth > 0 && (
				<Rect
					width={layer.width}
					height={layer.height}
					cornerRadius={borderRadius}
					stroke={borderColor || "#ffffff"}
					strokeWidth={borderWidth}
					dash={borderDashForStyle(borderStyle ?? "solid")}
					fill="transparent"
					listening={false}
				/>
			)}

			<LayerHitRect width={layer.width} height={layer.height} />
		</Group>
	);
}
