import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Group, Text, Rect, Circle, Ellipse, Image, Transformer } from "react-konva";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectLayer, updateLayer, duplicateLayerInPlace } from "@/lib/store/slices/videoEditorSlice";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { isLayerActiveAtTime } from "@/lib/video-editor/timeline";
import { buildBackgroundFill } from "@/lib/video-editor/gradients";
import {
	computeLayerAnimationState,
	computeSceneTransitionState,
	layerAnimProps,
	shapeAnimProps,
} from "@/lib/video-editor/animations";
import { konvaAltDragHandlers } from "@/lib/video-editor/konvaDrag";
import { useStageRef } from "./StageRefContext";
import CanvasHotkeys from "./CanvasHotkeys";
import KonvaVideoLayer from "./KonvaVideoLayer";
import InlineTextEditor from "./InlineTextEditor";

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

function KonvaImageLayer({ layer, anim, isSelected, onSelect, onChange, registerRef, interactive, onAltDragDuplicate }) {
	const image = useKonvaImage(layer.data?.src);
	const { data } = layer;
	const altDrag = konvaAltDragHandlers(layer, interactive, onAltDragDuplicate);
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
			{...altDrag}
			onDragEnd={(e) =>
				onChange({ x: e.target.x(), y: e.target.y() })
			}
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

function PlaceholderLayer({ layer, anim, isSelected, onSelect, onChange, registerRef, color, label, interactive, onAltDragDuplicate }) {
	const altDrag = konvaAltDragHandlers(layer, interactive, onAltDragDuplicate);
	const pos = layerAnimProps(layer, anim);
	return (
		<>
			<Rect
				ref={registerRef}
				x={pos.x}
				y={pos.y}
				width={layer.width}
				height={layer.height}
				scaleX={pos.scaleX}
				scaleY={pos.scaleY}
				rotation={pos.rotation}
				opacity={pos.opacity}
				visible={layer.visible}
				fill={color}
				cornerRadius={8}
				draggable={interactive && !layer.locked}
				onClick={onSelect}
				onTap={onSelect}
				{...altDrag}
				onDragEnd={(e) =>
					onChange({ x: e.target.x(), y: e.target.y() })
				}
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
				stroke={isSelected ? "#ea580c" : "#52525b"}
				strokeWidth={isSelected ? 2 : 1}
				dash={[6, 4]}
			/>
			<Text
				x={layer.x}
				y={layer.y + layer.height / 2 - 10}
				width={layer.width}
				text={label}
				fontSize={14}
				fontFamily="DM Sans"
				fill="#ffffff"
				align="center"
				listening={false}
				opacity={layer.opacity}
				visible={layer.visible}
			/>
		</>
	);
}

function LayerNode({
	layer,
	sceneDuration,
	previewTime,
	applyAnimation,
	isPlaying,
	audioUnlocked,
	isSelected,
	onSelect,
	onChange,
	registerRef,
	interactive,
	onAltDragDuplicate,
	onStartEdit,
	isEditing,
}) {
	const { data } = layer;
	const altDrag = konvaAltDragHandlers(layer, interactive, onAltDragDuplicate);
	const anim = applyAnimation
		? computeLayerAnimationState(layer, previewTime)
		: computeLayerAnimationState(layer, Infinity);
	const pos = layerAnimProps(layer, anim);

	if (layer.type === "text") {
		const displayText = isEditing ? data.content : (anim.displayText ?? data.content);
		return (
			<Text
				ref={registerRef}
				x={pos.x}
				y={pos.y}
				width={layer.width}
				text={displayText}
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
				opacity={isEditing ? 0 : pos.opacity}
				visible={layer.visible && !isEditing}
				shadowColor={data.shadowColor}
				shadowBlur={data.shadowBlur}
				shadowOffsetX={data.shadowOffsetX}
				shadowOffsetY={data.shadowOffsetY}
				stroke={data.stroke || undefined}
				strokeWidth={data.strokeWidth || 0}
				draggable={interactive && !layer.locked && !isEditing}
				onClick={onSelect}
				onTap={onSelect}
				onDblClick={(e) => {
					e.cancelBubble = true;
					if (interactive && !layer.locked && onStartEdit) onStartEdit();
				}}
				onDblTap={(e) => {
					e.cancelBubble = true;
					if (interactive && !layer.locked && onStartEdit) onStartEdit();
				}}
				{...altDrag}
				onDragEnd={(e) =>
					onChange({ x: e.target.x(), y: e.target.y() })
				}
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
				onAltDragDuplicate={onAltDragDuplicate}
			/>
		);
	}

	if (layer.type === "video") {
		return (
			<KonvaVideoLayer
				layer={layer}
				anim={anim}
				sceneDuration={sceneDuration}
				previewTime={previewTime}
				isPlaying={isPlaying}
				audioUnlocked={audioUnlocked}
				isSelected={isSelected}
				onSelect={onSelect}
				onChange={onChange}
				registerRef={registerRef}
				interactive={interactive}
				onAltDragDuplicate={onAltDragDuplicate}
			/>
		);
	}

	if (layer.type === "audio") {
		return (
			<PlaceholderLayer
				layer={layer}
				anim={anim}
				isSelected={isSelected}
				onSelect={onSelect}
				onChange={onChange}
				registerRef={registerRef}
				color="rgba(16,185,129,0.35)"
				label={data?.label || "Audio"}
				interactive={interactive}
				onAltDragDuplicate={onAltDragDuplicate}
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
				{...altDrag}
				onDragEnd={(e) =>
					onChange({ x: e.target.x(), y: e.target.y() })
				}
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
			...altDrag,
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
	const altDragPendingRef = useRef(false);

	const [scale, setScale] = useState(0.5);
	const [canvasFocused, setCanvasFocused] = useState(false);
	const [editingLayerId, setEditingLayerId] = useState(null);

	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const canvasH = project.canvas?.height ?? CANVAS_HEIGHT;
	const bgFill = buildBackgroundFill(project.canvas?.background, canvasW, canvasH);

	const activeScene = project.scenes.find((s) => s.id === activeSceneId);
	const previewTime = playback.previewLocalTime ?? 0;
	const interactive = !playback.isPlaying && !playback.isRendering;
	const isPlaying = playback.isPlaying || playback.isRendering;
	const applyAnimation = isPlaying;
	const audioUnlocked = playback.audioUnlocked;

	const sceneTransition = useMemo(() => {
		if (!activeScene) {
			return {
				contentOpacity: 1,
				contentScale: 1,
				offsetX: 0,
				offsetY: 0,
				blackOverlay: 0,
				whiteOverlay: 0,
				clipRect: null,
			};
		}
		return computeSceneTransitionState(activeScene, previewTime, canvasW, canvasH);
	}, [activeScene, previewTime, canvasW, canvasH]);

	const layers = useMemo(() => {
		const all = activeScene?.layers ?? [];
		if (!activeScene) return all;
		return all.filter((layer) =>
			isLayerActiveAtTime(layer, activeScene.duration, previewTime),
		);
	}, [activeScene, previewTime]);

	const editingLayer = useMemo(() => {
		if (!editingLayerId || !activeScene) return null;
		const layer = activeScene.layers.find((l) => l.id === editingLayerId);
		return layer?.type === "text" ? layer : null;
	}, [editingLayerId, activeScene]);

	useEffect(() => {
		if (!interactive) setEditingLayerId(null);
	}, [interactive]);

	useEffect(() => {
		setEditingLayerId(null);
	}, [activeSceneId]);

	useEffect(() => {
		if (editingLayerId && selectedLayerId !== editingLayerId) {
			setEditingLayerId(null);
		}
	}, [selectedLayerId, editingLayerId]);

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
		if (interactive && selectedLayerId && !editingLayerId && nodeRefs.current[selectedLayerId]) {
			tr.nodes([nodeRefs.current[selectedLayerId]]);
		} else {
			tr.nodes([]);
		}
		tr.getLayer()?.batchDraw();
	}, [selectedLayerId, layers, interactive, editingLayerId]);

	const handleStageClick = (e) => {
		if (e.target === e.target.getStage()) {
			setEditingLayerId(null);
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

	const handleAltDragDuplicate = useCallback(
		(layerId) => {
			if (!activeSceneId) return;
			dispatch(duplicateLayerInPlace({ sceneId: activeSceneId, layerId }));
			altDragPendingRef.current = true;
		},
		[dispatch, activeSceneId],
	);

	useEffect(() => {
		if (!altDragPendingRef.current || !selectedLayerId) return;
		altDragPendingRef.current = false;
		const id = selectedLayerId;
		requestAnimationFrame(() => {
			nodeRefs.current[id]?.startDrag();
		});
	}, [selectedLayerId, layers]);

	return (
		<div
			ref={containerRef}
			tabIndex={0}
			onFocus={() => setCanvasFocused(true)}
			onBlur={() => setCanvasFocused(false)}
			onMouseDown={() => containerRef.current?.focus()}
			className="flex-1 flex items-center justify-center bg-muted/40 overflow-hidden min-h-0 outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset"
		>
			<CanvasHotkeys enabled={canvasFocused && interactive && !editingLayerId} />
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
						<Group
							x={canvasW / 2 + sceneTransition.offsetX}
							y={canvasH / 2 + sceneTransition.offsetY}
							offsetX={canvasW / 2}
							offsetY={canvasH / 2}
							scaleX={sceneTransition.contentScale}
							scaleY={sceneTransition.contentScale}
							opacity={sceneTransition.contentOpacity}
							clipFunc={
								sceneTransition.clipRect
									? (ctx) => {
											const r = sceneTransition.clipRect;
											ctx.rect(r.x, r.y, r.width, r.height);
										}
									: undefined
							}
						>
							<Rect x={0} y={0} width={canvasW} height={canvasH} listening={false} {...bgFill} />
							{layers.map((layer) => (
								<LayerNode
									key={layer.id}
									layer={layer}
									sceneDuration={activeScene?.duration ?? 5}
									previewTime={previewTime}
									applyAnimation={applyAnimation}
									isPlaying={isPlaying}
									audioUnlocked={audioUnlocked}
									isSelected={interactive && layer.id === selectedLayerId}
									isEditing={editingLayerId === layer.id}
									onSelect={() => {
										if (!interactive) return;
										dispatch(selectLayer(layer.id));
									}}
									onStartEdit={
										layer.type === "text" && interactive && !layer.locked
											? () => {
													dispatch(selectLayer(layer.id));
													setEditingLayerId(layer.id);
												}
											: undefined
									}
									onChange={handleLayerChange(layer.id)}
									registerRef={(node) => {
										nodeRefs.current[layer.id] = node;
									}}
									interactive={interactive}
									onAltDragDuplicate={handleAltDragDuplicate}
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
						{sceneTransition.blackOverlay > 0 && (
							<Rect
								x={0}
								y={0}
								width={canvasW}
								height={canvasH}
								fill="#000000"
								opacity={sceneTransition.blackOverlay}
								listening={false}
							/>
						)}
						{sceneTransition.whiteOverlay > 0 && (
							<Rect
								x={0}
								y={0}
								width={canvasW}
								height={canvasH}
								fill="#ffffff"
								opacity={sceneTransition.whiteOverlay}
								listening={false}
							/>
						)}
					</Layer>
				</Stage>
				{editingLayer && nodeRefs.current[editingLayer.id] ? (
					<InlineTextEditor
						layer={editingLayer}
						nodeRef={nodeRefs.current[editingLayer.id]}
						stageScale={scale}
						sceneId={activeSceneId}
						onClose={() => setEditingLayerId(null)}
					/>
				) : null}
			</div>
		</div>
	);
}
