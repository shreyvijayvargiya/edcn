import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Group, Text, Rect, Circle, Ellipse, Transformer } from "react-konva";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectLayer, updateLayer, duplicateLayerInPlace } from "@/lib/store/slices/videoEditorSlice";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { isLayerActiveAtTime } from "@/lib/video-editor/timeline";
import { buildSceneBackgroundFill, resolveSceneBackground } from "@/lib/video-editor/sceneBackground";
import {
	computeLayerAnimationState,
	computeSceneTransitionState,
	layerAnimProps,
	shapeAnimProps,
} from "@/lib/video-editor/animations";
import { konvaAltDragHandlers, useKonvaDragHandlers, konvaVisualToLayerPosition, konvaCenterToLayerPosition, LayerHitRect } from "@/lib/video-editor/konvaDrag";
import { useStageRef } from "./StageRefContext";
import CanvasHotkeys from "./CanvasHotkeys";
import KonvaVideoLayer from "./KonvaVideoLayer";
import KonvaMediaFrame from "./KonvaMediaFrame";
import InlineTextEditor from "./InlineTextEditor";
import { getCachedImage, loadKonvaImage } from "@/lib/video-editor/imageCache";

function useKonvaImage(src) {
	const [image, setImage] = useState(() => getCachedImage(src));

	useEffect(() => {
		if (!src) {
			setImage(null);
			return;
		}

		const cached = getCachedImage(src);
		if (cached) {
			setImage(cached);
			return;
		}

		let cancelled = false;
		loadKonvaImage(src).then((img) => {
			if (!cancelled) setImage(img);
		});
		return () => {
			cancelled = true;
		};
	}, [src]);

	return image;
}

function KonvaImageLayer({ layer, anim, isSelected, onSelect, onChange, registerRef, interactive, onAltDragDuplicate }) {
	const image = useKonvaImage(layer.data?.src);

	return (
		<KonvaMediaFrame
			layer={layer}
			anim={anim}
			mediaElement={image}
			onSelect={onSelect}
			onChange={onChange}
			registerRef={registerRef}
			interactive={interactive}
			onAltDragDuplicate={onAltDragDuplicate}
		/>
	);
}

function KonvaIconLayer({
	layer,
	anim,
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
	);

	const ringWidth = data.ringWidth ?? 0;
	const ringOffset = data.ringOffset ?? 4;
	const borderWidth = data.borderWidth ?? 0;
	const ringPad = ringWidth > 0 ? ringOffset + ringWidth / 2 : 0;

	const handleTransformEnd = (e) => {
		const node = e.target;
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		const pos = konvaVisualToLayerPosition(layer, anim, node.x(), node.y());
		onChange({
			...pos,
			width: Math.max(20, node.width() * scaleX),
			height: Math.max(20, node.height() * scaleY),
			rotation: node.rotation() - (anim?.rotationOffset ?? 0),
		});
		node.scaleX(1);
		node.scaleY(1);
	};

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
					cornerRadius={(data.ringRadius ?? 0) + ringPad}
					stroke={data.ringColor || "#ffffff"}
					strokeWidth={ringWidth}
					fill="transparent"
					listening={false}
				/>
			)}
			{borderWidth > 0 && (
				<Rect
					width={layer.width}
					height={layer.height}
					cornerRadius={data.borderRadius ?? 0}
					stroke={data.borderColor || "#ffffff"}
					strokeWidth={borderWidth}
					fill={
						data.borderFill && data.borderFill !== "transparent"
							? data.borderFill
							: undefined
					}
					listening={false}
				/>
			)}
			<Text
				width={layer.width}
				height={layer.height}
				text={data.icon}
				fontSize={data.fontSize ?? 48}
				fill={data.fill}
				align="center"
				verticalAlign="middle"
				letterSpacing={data.letterSpacing ?? 0}
				stroke={data.stroke || undefined}
				strokeWidth={data.strokeWidth ?? 0}
				shadowColor={
					data.shadowBlur > 0 ? data.shadowColor || "rgba(0,0,0,0.4)" : undefined
				}
				shadowBlur={data.shadowBlur ?? 0}
				shadowOffsetX={data.shadowOffsetX ?? 0}
				shadowOffsetY={data.shadowOffsetY ?? 0}
				listening={false}
			/>
			<LayerHitRect width={layer.width} height={layer.height} />
		</Group>
	);
}

function PlaceholderLayer({ layer, anim, isSelected, onSelect, onChange, registerRef, color, label, interactive, onAltDragDuplicate }) {
	const altDrag = konvaAltDragHandlers(layer, interactive, onAltDragDuplicate);
	const { x, y, pos, dragHandlers, selectHandlers } = useKonvaDragHandlers(
		layer,
		anim,
		onChange,
	);
	return (
		<>
			<Rect
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
				fill={color}
				cornerRadius={8}
				draggable={interactive && !layer.locked}
				{...selectHandlers(onSelect)}
				{...altDrag}
				{...dragHandlers}
				onTransformEnd={(e) => {
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
	isVideoPlaying,
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
	const isCenteredShape =
		layer.type === "shape" &&
		(data.shape === "circle" || data.shape === "ellipse");
	const shapePos = layer.type === "shape" ? shapeAnimProps(layer, anim) : null;
	const { x, y, pos, dragHandlers, selectHandlers } = useKonvaDragHandlers(
		layer,
		anim,
		onChange,
		{
			centered: isCenteredShape,
			getPosition: shapePos ? () => shapePos : undefined,
		},
	);

	if (layer.type === "text") {
		const displayText = isEditing ? data.content : (anim.displayText ?? data.content);
		return (
			<Text
				ref={registerRef}
				x={x}
				y={y}
				width={layer.width}
				text={displayText}
				fontSize={data.fontSize}
				fontFamily={data.fontFamily}
				fontStyle={data.fontWeight >= 600 ? "bold" : "normal"}
				fill={data.fill}
				align={data.align}
				letterSpacing={(data.letterSpacing ?? 0) + (anim.letterSpacingExtra ?? 0)}
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
				{...selectHandlers(onSelect)}
				onDblClick={(e) => {
					e.cancelBubble = true;
					if (interactive && !layer.locked && onStartEdit) onStartEdit();
				}}
				onDblTap={(e) => {
					e.cancelBubble = true;
					if (interactive && !layer.locked && onStartEdit) onStartEdit();
				}}
				{...altDrag}
				{...dragHandlers}
				onTransformEnd={(e) => {
					const node = e.target;
					const scaleX = node.scaleX();
					const scaleY = node.scaleY();
					const pos = konvaVisualToLayerPosition(layer, anim, node.x(), node.y());
					onChange({
						...pos,
						width: Math.max(40, node.width() * scaleX),
						height: Math.max(20, node.height() * scaleY),
						rotation: node.rotation() - (anim?.rotationOffset ?? 0),
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
				isVideoPlaying={isVideoPlaying}
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
			<KonvaIconLayer
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

	if (layer.type === "shape") {
		const isCentered = data.shape === "circle" || data.shape === "ellipse";
		const common = {
			ref: registerRef,
			x,
			y,
			scaleX: pos.scaleX,
			scaleY: pos.scaleY,
			rotation: pos.rotation,
			opacity: pos.opacity,
			visible: layer.visible,
			fill: data.fill,
			stroke: data.stroke || undefined,
			strokeWidth: data.strokeWidth ?? 0,
			draggable: interactive && !layer.locked,
			...selectHandlers(onSelect),
			...altDrag,
			...dragHandlers,
			onTransformEnd: (e) => {
				const node = e.target;
				const scaleX = node.scaleX();
				const scaleY = node.scaleY();
				const basePos = isCentered
					? konvaCenterToLayerPosition(layer, node.x(), node.y(), anim)
					: konvaVisualToLayerPosition(layer, anim, node.x(), node.y());
				onChange({
					...basePos,
					width: Math.max(10, (isCentered ? layer.width : node.width()) * scaleX),
					height: Math.max(10, (isCentered ? layer.height : node.height()) * scaleY),
					rotation: node.rotation() - (anim?.rotationOffset ?? 0),
				});
				node.scaleX(1);
				node.scaleY(1);
			},
		};

		if (data.shape === "circle") {
			return (
				<Circle
					{...common}
					radius={Math.min(layer.width, layer.height) / 2}
				/>
			);
		}
		if (data.shape === "ellipse") {
			return (
				<Ellipse
					{...common}
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
	const stageFocusRef = useRef(null);
	const transformerRef = useRef(null);
	const nodeRefs = useRef({});
	const altDragPendingRef = useRef(false);

	const [scale, setScale] = useState(0.5);
	const [canvasFocused, setCanvasFocused] = useState(false);
	const [editingLayerId, setEditingLayerId] = useState(null);

	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const canvasH = project.canvas?.height ?? CANVAS_HEIGHT;
	const activeScene = project.scenes.find((s) => s.id === activeSceneId);
	const bgFill = useMemo(
		() =>
			buildSceneBackgroundFill(
				resolveSceneBackground(activeScene, project.canvas),
				canvasW,
				canvasH,
			),
		[activeScene, project.canvas, canvasW, canvasH],
	);

	const previewTime = playback.previewLocalTime ?? 0;
	const interactive = !playback.isPlaying && !playback.isRendering;
	const applyAnimation = playback.isPlaying || playback.isRendering;
	const isVideoPlaying = playback.isPlaying && !playback.isRendering;
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
		if (interactive) return all;
		return all.filter((layer) =>
			isLayerActiveAtTime(layer, activeScene.duration, previewTime),
		);
	}, [activeScene, previewTime, interactive]);

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
	}, [selectedLayerId, interactive, editingLayerId]);

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
			className="flex-1 flex items-center justify-center bg-muted/40 overflow-hidden min-h-0 outline-none"
		>
			<CanvasHotkeys enabled={canvasFocused && interactive && !editingLayerId} />
			<div
				ref={stageFocusRef}
				tabIndex={0}
				onFocus={() => setCanvasFocused(true)}
				onBlur={() => setCanvasFocused(false)}
				onMouseDown={() => stageFocusRef.current?.focus({ preventScroll: true })}
				className="border-2 border-border shadow-md shrink-0 relative outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
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
									isVideoPlaying={isVideoPlaying}
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
