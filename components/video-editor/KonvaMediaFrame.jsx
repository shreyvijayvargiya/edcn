import { useEffect, useMemo, useRef } from "react";
import { Group, Rect, Image, Circle } from "react-konva";
import {
	konvaAltDragHandlers,
	konvaVisualToLayerPosition,
	useKonvaDragHandlers,
	LayerHitRect,
} from "@/lib/video-editor/konvaDrag";
import {
	borderDashForStyle,
	computeImageDrawRect,
} from "@/lib/video-editor/imageLayout";
import { layerAnimProps } from "@/lib/video-editor/animations";
import { mediaElementSize, DEFAULT_MEDIA_LAYER_STYLE } from "@/lib/video-editor/mediaLayerStyle";
import {
	resolveLayerChrome,
	konvaRingPad,
	konvaShadowProps,
} from "@/lib/video-editor/layerChromeStyle";
import {
	resolveMediaEffects,
	buildMaskClipFunc,
	mediaEffectsNeedPixelFilters,
	buildParticleSprites,
	vignetteFill,
} from "@/lib/video-editor/mediaEffects";
import { buildKonvaFilterConfig } from "@/lib/video-editor/konvaMediaFilters";
import { DemoClickRings } from "./KonvaCaptionLayer";

/**
 * Shared frame (ring, border, clip, shadow, object-fit, advanced effects) for image & video.
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
	effectsCacheRef,
	onSelect,
	onChange,
	registerRef,
	interactive,
	onAltDragDuplicate,
	previewTime = 0,
}) {
	const { data } = layer;
	const effectsGroupRef = useRef(null);
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
	const effects = useMemo(() => resolveMediaEffects(data), [data]);
	const filterConfig = useMemo(() => buildKonvaFilterConfig(effects), [effects]);
	const needFilters = mediaEffectsNeedPixelFilters(effects);

	const frameW = pos.width ?? layer.width;
	const frameH = pos.height ?? layer.height;

	const size = mediaElementSize(mediaElement);
	const draw = size
		? computeImageDrawRect(
				size,
				frameW,
				frameH,
				data.objectFit ?? "cover",
				data.objectPosition ?? "center",
			)
		: { x: 0, y: 0, width: frameW, height: frameH };

	const size2 = mediaElementSize(secondaryMediaElement);
	const draw2 = size2
		? computeImageDrawRect(
				size2,
				frameW,
				frameH,
				data.objectFit ?? "cover",
				data.objectPosition ?? "center",
			)
		: draw;

	const f1Opacity = frameSwap?.frame1Opacity ?? 1;
	const f2Opacity = frameSwap?.frame2Opacity ?? 0;

	const clipFunc = useMemo(
		() => buildMaskClipFunc(effects, frameW, frameH, borderRadius),
		[effects, frameW, frameH, borderRadius],
	);

	const particles = useMemo(
		() => buildParticleSprites(effects, frameW, frameH, previewTime),
		[effects, frameW, frameH, previewTime],
	);

	const vignette = useMemo(
		() => vignetteFill(effects, frameW, frameH),
		[effects, frameW, frameH],
	);

	const glowOn =
		effects.enabled && effects.glow?.enabled && (effects.glow.intensity ?? 0) > 0;

	const applyCache = () => {
		const node = effectsGroupRef.current;
		if (!node) return;
		if (!needFilters) {
			try {
				node.clearCache();
			} catch {
				/* ignore */
			}
			node.filters([]);
			return;
		}
		const { filters, attrs } = filterConfig;
		node.filters(filters);
		node.blurRadius(attrs.blurRadius);
		node.brightness(attrs.brightness);
		node.contrast(attrs.contrast);
		node.saturation(attrs.saturation);
		node.hue(attrs.hue);
		node.setAttr("_chromaKey", attrs._chromaKey);
		node.setAttr("_cropFeather", attrs._cropFeather);
		node.setAttr("_lut", attrs._lut);
		node.cache({ pixelRatio: 1 });
	};

	useEffect(() => {
		applyCache();
		effectsGroupRef.current?.getLayer()?.batchDraw();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		needFilters,
		filterConfig,
		frameW,
		frameH,
		mediaElement,
		draw.x,
		draw.y,
		draw.width,
		draw.height,
		borderRadius,
		effects.mask?.type,
		effects.mask?.feather,
	]);

	useEffect(() => {
		if (!effectsCacheRef) return;
		effectsCacheRef.current = {
			recache: applyCache,
			needsFilters: needFilters,
			getLayer: () => effectsGroupRef.current?.getLayer?.(),
		};
		return () => {
			effectsCacheRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [effectsCacheRef, needFilters, filterConfig, mediaElement]);

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

	const shadowProps = glowOn
		? {
				shadowColor: effects.glow.color || "#ffffff",
				shadowBlur: effects.glow.radius ?? 16,
				shadowOpacity: effects.glow.intensity ?? 0.55,
				shadowOffsetX: 0,
				shadowOffsetY: 0,
			}
		: konvaShadowProps(chrome);

	return (
		<Group
			ref={registerRef}
			x={x}
			y={y}
			width={frameW}
			height={frameH}
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
					width={frameW + ringPad * 2}
					height={frameH + ringPad * 2}
					cornerRadius={(ringRadius ?? borderRadius) + ringPad}
					stroke={ringColor || "#ffffff"}
					strokeWidth={ringWidth}
					fill="transparent"
					listening={false}
				/>
			)}

			<Group
				ref={effectsGroupRef}
				width={frameW}
				height={frameH}
				clipFunc={clipFunc}
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
						width={frameW}
						height={frameH}
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

				{vignette ? (
					<Rect width={frameW} height={frameH} listening={false} {...vignette} />
				) : null}

				{particles.map((p) => (
					<Circle
						key={p.id}
						x={p.x}
						y={p.y}
						radius={p.radius}
						fill={p.color}
						opacity={p.opacity}
						listening={false}
					/>
				))}
			</Group>

			{borderWidth > 0 && (
				<Rect
					width={frameW}
					height={frameH}
					cornerRadius={borderRadius}
					stroke={borderColor || "#ffffff"}
					strokeWidth={borderWidth}
					dash={borderDashForStyle(borderStyle ?? "solid")}
					fill="transparent"
					listening={false}
				/>
			)}

			<DemoClickRings
				layer={layer}
				previewTime={previewTime}
				width={frameW}
				height={frameH}
			/>

			<LayerHitRect width={frameW} height={frameH} />
		</Group>
	);
}
