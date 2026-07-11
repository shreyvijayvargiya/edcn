import { Group, Text, Rect, Circle } from "react-konva";
import { layerAnimProps } from "@/lib/video-editor/animations";
import { getCaptionDisplayState } from "@/lib/video-editor/captions";
import { computeDemoAnnotationState } from "@/lib/video-editor/demoAnnotations";
import {
	konvaAltDragHandlers,
	useKonvaDragHandlers,
	LayerHitRect,
} from "@/lib/video-editor/konvaDrag";

/**
 * Karaoke-style caption layer rendered in Konva.
 */
export default function KonvaCaptionLayer({
	layer,
	anim,
	effective,
	previewTime,
	isSelected,
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

	const w = pos.width ?? layer.width;
	const h = pos.height ?? layer.height;
	const relTime = Math.max(0, previewTime - (layer.startTime || 0));
	const { activeIndex, lineWords, lineStart } = getCaptionDisplayState(data, relTime);

	const pad = data.backgroundPad ?? 0;
	const fontSize = data.fontSize ?? 24;
	const lineText = lineWords
		.map((word) => (data.uppercase ? word.text.toUpperCase() : word.text))
		.join(" ");

	const fullWidthEstimate = Math.min(w - pad * 2, Math.max(40, lineText.length * fontSize * 0.55));
	const charTotal = Math.max(1, lineText.replace(/\s/g, "").length || 1);
	let charCursor = 0;
	const wordLayouts = lineWords.map((word, i) => {
		const display = data.uppercase ? word.text.toUpperCase() : word.text;
		const chars = Math.max(1, display.length);
		const wordW = (chars / charTotal) * fullWidthEstimate;
		const gap = i < lineWords.length - 1 ? fontSize * 0.28 : 0;
		const wx = charCursor;
		charCursor += wordW + gap;
		return { word, display, x: wx, width: wordW, globalIndex: lineStart + i };
	});

	const contentWidth = Math.min(w, charCursor + pad * 2);
	const align = data.align ?? "center";
	const baseX =
		align === "left" ? pad : align === "right" ? w - contentWidth : (w - contentWidth) / 2;

	return (
		<Group
			ref={registerRef}
			x={x}
			y={y}
			width={w}
			height={h}
			scaleX={pos.scaleX}
			scaleY={pos.scaleY}
			rotation={pos.rotation}
			opacity={pos.opacity}
			visible={layer.visible}
			draggable={interactive && !layer.locked}
			{...selectHandlers(onSelect)}
			{...altDrag}
			{...dragHandlers}
		>
			<LayerHitRect width={w} height={h} />
			{data.background && data.background !== "transparent" && (
				<Rect
					x={Math.max(0, baseX - pad)}
					y={Math.max(0, (h - fontSize * 1.6) / 2 - pad)}
					width={contentWidth}
					height={fontSize * 1.6 + pad * 2}
					fill={data.background}
					cornerRadius={8}
					listening={false}
				/>
			)}
			{data.karaoke !== false
				? wordLayouts.map(({ word, display, x: wx, globalIndex }) => {
						const isActive = globalIndex === activeIndex;
						const fill = isActive
							? data.highlightFill || data.fill || "#fff"
							: data.fill || "#fff";
						return (
							<Group key={word.id} listening={false}>
								{isActive && (
									<Rect
										x={baseX + wx - 2}
										y={(h - fontSize * 1.35) / 2}
										width={display.length * fontSize * 0.58 + 4}
										height={fontSize * 1.35}
										fill={data.highlightFill || "#39E508"}
										opacity={0.25}
										cornerRadius={4}
									/>
								)}
								<Text
									x={baseX + wx}
									y={(h - fontSize) / 2}
									text={display}
									fontSize={fontSize}
									fontFamily={data.fontFamily || "DM Sans"}
									fontStyle={(data.fontWeight ?? 700) >= 700 ? "bold" : "normal"}
									fill={fill}
									stroke={data.stroke || undefined}
									strokeWidth={data.strokeWidth || 0}
									shadowColor={data.shadowBlur > 0 ? data.shadowColor : undefined}
									shadowBlur={data.shadowBlur ?? 0}
									shadowOffsetY={2}
								/>
							</Group>
						);
					})
				: (
						<Text
							x={pad}
							y={(h - fontSize) / 2}
							width={w - pad * 2}
							text={lineText}
							fontSize={fontSize}
							fontFamily={data.fontFamily || "DM Sans"}
							fontStyle={(data.fontWeight ?? 700) >= 700 ? "bold" : "normal"}
							fill={data.fill || "#fff"}
							align={align}
							stroke={data.stroke || undefined}
							strokeWidth={data.strokeWidth || 0}
							shadowColor={data.shadowBlur > 0 ? data.shadowColor : undefined}
							shadowBlur={data.shadowBlur ?? 0}
							listening={false}
						/>
					)}
			{isSelected && interactive && (
				<Rect
					width={w}
					height={h}
					stroke="rgba(59,130,246,0.7)"
					strokeWidth={1}
					dash={[4, 3]}
					listening={false}
				/>
			)}
		</Group>
	);
}

/** Click rings drawn in layer space (0–1 coords → layer width/height). */
export function DemoClickRings({ layer, previewTime, width, height }) {
	const relTime = Math.max(0, previewTime - (layer.startTime || 0));
	const { rings } = computeDemoAnnotationState(layer.data, relTime);
	if (!rings.length) return null;
	return (
		<Group listening={false}>
			{rings.map((r) => (
				<Circle
					key={r.id}
					x={r.x * width}
					y={r.y * height}
					radius={10 + r.progress * 36}
					stroke={`rgba(255,200,0,${Math.max(0, 1 - r.progress)})`}
					strokeWidth={3}
					listening={false}
				/>
			))}
		</Group>
	);
}

/** Merge zoom-to-click into effective motion props for video layers. */
export function applyDemoZoomToEffective(layer, previewTime, effective) {
	const relTime = Math.max(0, previewTime - (layer.startTime || 0));
	const { zoom } = computeDemoAnnotationState(layer.data, relTime);
	if (!zoom) return effective;

	const base = effective ? { ...effective } : {};
	const scale = (base.scale ?? 1) * zoom.scale;
	const w = base.width ?? layer.width;
	const h = base.height ?? layer.height;
	const x = base.x ?? layer.x;
	const y = base.y ?? layer.y;
	base.scale = scale;
	base.x = x + w * zoom.focusX * (1 - zoom.scale);
	base.y = y + h * zoom.focusY * (1 - zoom.scale);
	return base;
}
