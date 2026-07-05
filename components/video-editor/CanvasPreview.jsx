import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Group, Text, Rect, Circle, Ellipse, Image, Transformer } from "react-konva";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectLayer, updateLayer } from "@/lib/store/slices/videoEditorSlice";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { isLayerActiveAtTime } from "@/lib/video-editor/timeline";
import { buildBackgroundFill } from "@/lib/video-editor/gradients";
import { computeLayerAnimationState, layerAnimProps, shapeAnimProps } from "@/lib/video-editor/animations";
import { useStageRef } from "./StageRefContext";
import CanvasHotkeys from "./CanvasHotkeys";

function useKonvaImage(src) {
	const [image, setImage] = useState(null);
	useEffect(() => {
		if (!src) {
			setImage(null);
			return;
		}
		const img = new window.Image();
		img.crossOrigin = "anonymous";
		img.onload = () => setImage(img);
		img.onerror = () => setImage(null);
		img.src = src;
	}, [src]);
	return image;
}

function KonvaImageLayer({ layer, anim, isSelected, onSelect, onChange, registerRef, interactive }) {
	const image = useKonvaImage(layer.data?.src);
	const { data } = layer;
	const pos = layerAnimProps(layer, anim);

	return (
		<Image
			ref={registerRef}
			image={image}
			x={pos.x}
			y={pos.y}
			width={layer.width}
			height={layer.height}
			scaleX={pos.scaleX}
			scaleY={pos.scaleY}
			rotation={pos.rotation}
			opacity={pos.opacity}
			visible={layer.visible}
			draggable={interactive && !layer.locked}
			onClick={onSelect}
			onTap={onSelect}
			onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
			onTransformEnd={(e) => {
				const node = e.target;
				const scaleX = node.scaleX();
				const scaleY = node.scaleY();
				onChange({
					x: node.x(),
					y: node.y(),
					width: Math.max(20, node.width() * scaleX),
					height: Math.max(20, node.height() * scaleY),
					rotation: node.rotation(),
				});
				node.scaleX(1);
				node.scaleY(1);
			}}
			cornerRadius={data?.borderRadius ?? 0}
			shadowBlur={data?.shadowBlur ?? 0}
			shadowColor={data?.shadowColor ?? "black"}
			stroke={isSelected ? "#ea580c" : undefined}
			strokeWidth={isSelected ? 2 : 0}
		/>
	);
}

function LayerNode({
	layer,
	previewTime,
	applyAnimation,
	isSelected,
	onSelect,
	onChange,
	registerRef,
	interactive,
}) {
	if (layer.type === "video" || layer.type === "audio") {
		return null;
	}

	const { data } = layer;
	const anim = applyAnimation
		? computeLayerAnimationState(layer, previewTime)
		: computeLayerAnimationState(layer, Infinity);
	const pos = layerAnimProps(layer, anim);

	if (layer.type === "text") {
		return (
			<Text
				ref={registerRef}
				x={pos.x}
				y={pos.y}
				width={layer.width}
				text={data.content}
				fontSize={data.fontSize}
				fontFamily={data.fontFamily}
				fontStyle={data.fontWeight >= 600 ? "bold" : "normal"}
				fill={data.fill}
				align={data.align}
				letterSpacing={data.letterSpacing}
				lineHeight={data.lineHeight}
				scaleX={pos.scaleX}
				scaleY={pos.scaleY}
				rotation={pos.rotation}
				opacity={pos.opacity}
				visible={layer.visible}
				shadowColor={data.shadowColor}
				shadowBlur={data.shadowBlur}
				shadowOffsetX={data.shadowOffsetX}
				shadowOffsetY={data.shadowOffsetY}
				stroke={data.stroke || undefined}
				strokeWidth={data.strokeWidth || 0}
				draggable={interactive && !layer.locked}
				onClick={onSelect}
				onTap={onSelect}
				onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
				onTransformEnd={(e) => {
					const node = e.target;
					const scaleX = node.scaleX();
					const scaleY = node.scaleY();
					onChange({
						x: node.x(),
						y: node.y(),
						width: Math.max(40, node.width() * scaleX),
						height: Math.max(20, node.height() * scaleY),
						rotation: node.rotation(),
					});
					node.scaleX(1);
					node.scaleY(1);
				}}
			/>
		);
	}

	if (layer.type === "image") {
		return (
			<KonvaImageLayer
				layer={layer}
				anim={anim}
				isSelected={isSelected}
				onSelect={onSelect}
				onChange={onChange}
				registerRef={registerRef}
				interactive={interactive}
			/>
		);
	}

	if (layer.type === "icon") {
		return (
			<Text
				ref={registerRef}
				x={pos.x}
				y={pos.y}
				width={layer.width}
				height={layer.height}
				text={data.icon}
				fontSize={data.fontSize ?? 48}
				fill={data.fill}
				align="center"
				verticalAlign="middle"
				scaleX={pos.scaleX}
				scaleY={pos.scaleY}
				rotation={pos.rotation}
				opacity={pos.opacity}
				visible={layer.visible}
				draggable={interactive && !layer.locked}
				onClick={onSelect}
				onTap={onSelect}
				onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
				onTransformEnd={(e) => {
					const node = e.target;
					const scaleX = node.scaleX();
					const scaleY = node.scaleY();
					onChange({
						x: node.x(),
						y: node.y(),
						width: Math.max(20, node.width() * scaleX),
						height: Math.max(20, node.height() * scaleY),
						rotation: node.rotation(),
					});
					node.scaleX(1);
					node.scaleY(1);
				}}
			/>
		);
	}

	if (layer.type === "shape") {
		const isCentered = data.shape === "circle" || data.shape === "ellipse";
		const shapePos = shapeAnimProps(layer, anim);
		const shapeDragEnd = (e) => {
			const nx = e.target.x();
			const ny = e.target.y();
			onChange(
				isCentered
					? { x: nx - layer.width / 2, y: ny - layer.height / 2 }
					: { x: nx, y: ny },
			);
		};
		const common = {
			ref: registerRef,
			x: shapePos.x,
			y: shapePos.y,
			scaleX: shapePos.scaleX,
			scaleY: shapePos.scaleY,
			rotation: shapePos.rotation,
			opacity: shapePos.opacity,
			visible: layer.visible,
			fill: data.fill,
			stroke: data.stroke || undefined,
			strokeWidth: data.strokeWidth ?? 0,
			draggable: interactive && !layer.locked,
			onClick: onSelect,
			onTap: onSelect,
			onDragEnd: shapeDragEnd,
			onTransformEnd: (e) => {
				const node = e.target;
				const scaleX = node.scaleX();
				const scaleY = node.scaleY();
				onChange({
					x: node.x(),
					y: node.y(),
					width: Math.max(10, node.width() * scaleX),
					height: Math.max(10, node.height() * scaleY),
					rotation: node.rotation(),
				});
				node.scaleX(1);
				node.scaleY(1);
			},
		};

		if (data.shape === "circle") {
			return (
				<Circle
					{...common}
					x={layer.x + layer.width / 2}
					y={layer.y + layer.height / 2}
					radius={Math.min(layer.width, layer.height) / 2}
				/>
			);
		}
		if (data.shape === "ellipse") {
			return (
				<Ellipse
					{...common}
					x={layer.x + layer.width / 2}
					y={layer.y + layer.height / 2}
					radiusX={layer.width / 2}
					radiusY={layer.height / 2}
				/>
			);
		}
		return (
			<Rect
				{...common}
				width={layer.width}
				height={layer.height}
				cornerRadius={data.cornerRadius ?? 0}
			/>
		);
	}

	return null;
}

export default function CanvasPreview() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId, selectedLayerId, playback } = useAppSelector(
		(s) => s.videoEditor,
	);
	const stageRef = useStageRef();
	const containerRef = useRef(null);
	const transformerRef = useRef(null);
	const nodeRefs = useRef({});

	const [scale, setScale] = useState(0.5);
	const [canvasFocused, setCanvasFocused] = useState(false);

	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const canvasH = project.canvas?.height ?? CANVAS_HEIGHT;
	const bgFill = buildBackgroundFill(project.canvas?.background, canvasW, canvasH);

	const activeScene = project.scenes.find((s) => s.id === activeSceneId);
	const previewTime = playback.previewLocalTime ?? 0;
	const interactive = !playback.isPlaying && !playback.isRendering;
	const applyAnimation = false;

	const layers = useMemo(() => {
		const all = activeScene?.layers ?? [];
		if (!activeScene) return all;
		return all.filter(
			(layer) =>
				layer.type !== "video" &&
				layer.type !== "audio" &&
				isLayerActiveAtTime(layer, activeScene.duration, previewTime),
		);
	}, [activeScene, previewTime]);

	const recalcScale = useCallback(() => {
		const el = containerRef.current;
		if (!el) return;
		const pad = 48;
		const maxW = el.clientWidth - pad;
		const maxH = el.clientHeight - pad;
		if (maxW <= 0 || maxH <= 0) return;
		const s = Math.min(maxW / canvasW, maxH / canvasH, 1.2);
		setScale(Math.max(0.25, s));
	}, [canvasW, canvasH]);

	useEffect(() => {
		recalcScale();
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => recalcScale());
		ro.observe(el);
		window.addEventListener("resize", recalcScale);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", recalcScale);
		};
	}, [recalcScale]);

	useEffect(() => {
		const tr = transformerRef.current;
		if (!tr) return;
		if (interactive && selectedLayerId && nodeRefs.current[selectedLayerId]) {
			tr.nodes([nodeRefs.current[selectedLayerId]]);
		} else {
			tr.nodes([]);
		}
		tr.getLayer()?.batchDraw();
	}, [selectedLayerId, layers, interactive]);

	const handleStageClick = (e) => {
		if (e.target === e.target.getStage()) {
			dispatch(selectLayer(null));
		}
	};

	const handleLayerChange = (layerId) => (changes) => {
		dispatch(
			updateLayer({
				sceneId: activeSceneId,
				layerId,
				changes,
			}),
		);
	};

	return (
		<div
			ref={containerRef}
			tabIndex={0}
			onFocus={() => setCanvasFocused(true)}
			onBlur={() => setCanvasFocused(false)}
			onMouseDown={() => containerRef.current?.focus()}
			className="flex-1 flex items-center justify-center bg-muted/40 overflow-hidden min-h-0 outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset"
		>
			<CanvasHotkeys enabled={canvasFocused && interactive} />
			<div
				className="border-2 border-border shadow-md shrink-0 relative"
				style={{
					width: canvasW * scale,
					height: canvasH * scale,
				}}
			>
				<Stage
					ref={stageRef}
					width={canvasW * scale}
					height={canvasH * scale}
					scaleX={scale}
					scaleY={scale}
					onMouseDown={interactive ? handleStageClick : undefined}
					onTouchStart={interactive ? handleStageClick : undefined}
				>
					<Layer>
						<Group>
							<Rect x={0} y={0} width={canvasW} height={canvasH} listening={false} {...bgFill} />
							{layers.map((layer) => (
								<LayerNode
									key={layer.id}
									layer={layer}
									previewTime={previewTime}
									applyAnimation={applyAnimation}
									isSelected={interactive && layer.id === selectedLayerId}
									onSelect={() => {
										if (!interactive) return;
										dispatch(selectLayer(layer.id));
									}}
									onChange={handleLayerChange(layer.id)}
									registerRef={(node) => {
										nodeRefs.current[layer.id] = node;
									}}
									interactive={interactive}
								/>
							))}
							{interactive && (
								<Transformer
									ref={transformerRef}
									rotateEnabled
									enabledAnchors={[
										"top-left",
										"top-right",
										"bottom-left",
										"bottom-right",
										"middle-left",
										"middle-right",
										"top-center",
										"bottom-center",
									]}
									borderStroke="#ea580c"
									anchorStroke="#ea580c"
									anchorFill="#ffffff"
									anchorSize={8}
									borderStrokeWidth={2}
									boundBoxFunc={(oldBox, newBox) => {
										if (newBox.width < 10 || newBox.height < 10) return oldBox;
										return newBox;
									}}
								/>
							)}
						</Group>
					</Layer>
				</Stage>
			</div>
		</div>
	);
}
