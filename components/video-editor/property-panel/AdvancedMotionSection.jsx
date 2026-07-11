import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateLayer } from "@/lib/store/slices/videoEditorSlice";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import {
	DEFAULT_MOTION,
	DEFAULT_FRAME_SWAP,
	DEFAULT_ANCHOR,
	DEFAULT_MOTION_PATH,
	KEYFRAME_PROPERTIES,
	createKeyframe,
	createPathPoint,
	defaultRotationKeyframes,
	defaultPositionKeyframes,
	keyframeValueFromUi,
	keyframeValueToUi,
	layerPropertyToKeyframeValue,
	supportsFrameSwap,
	supportsKeyframes,
} from "@/lib/video-editor/motion";
import { EASING_OPTIONS } from "@/lib/video-editor/animations";
import { PanelSection, Field, RangeField, Button } from "./PropertyPanelSections";
import PropertySelect from "../PropertySelect";
import { Plus, Minus, Wand2, FlipHorizontal2, Route } from "lucide-react";
import { cn } from "@/lib/utils";

function ensureMotion(layer) {
	return {
		...DEFAULT_MOTION,
		frameSwap: { ...DEFAULT_FRAME_SWAP, ...(layer.motion?.frameSwap || {}) },
		keyframes: {
			enabled: false,
			items: [],
			...(layer.motion?.keyframes || {}),
		},
		anchor: { ...DEFAULT_ANCHOR, ...(layer.motion?.anchor || {}) },
		path: { ...DEFAULT_MOTION_PATH, ...(layer.motion?.path || {}) },
	};
}

export function AdvancedMotionSection({ layer, scene, sceneId, layerId }) {
	const dispatch = useAppDispatch();
	const previewLocalTime = useAppSelector((s) => s.videoEditor.playback.previewLocalTime ?? 0);

	if (!supportsKeyframes(layer.type) && !supportsFrameSwap(layer.type)) return null;

	const motion = ensureMotion(layer);
	const clipDuration = layer.clipDuration ?? scene?.duration ?? 5;
	const relPlayhead = Math.max(0, previewLocalTime - (layer.startTime || 0));

	const patchMotion = (patch) => {
		const next = { ...ensureMotion(layer), ...patch };
		dispatch(updateLayer({ sceneId, layerId, changes: { motion: next } }));
	};

	const patchFrameSwap = (patch) => {
		patchMotion({
			frameSwap: { ...DEFAULT_FRAME_SWAP, ...motion.frameSwap, ...patch },
		});
	};

	const patchKeyframes = (patch) => {
		patchMotion({
			keyframes: { enabled: false, items: [], ...motion.keyframes, ...patch },
		});
	};

	const patchAnchor = (patch) => {
		patchMotion({ anchor: { ...DEFAULT_ANCHOR, ...motion.anchor, ...patch } });
	};

	const patchPath = (patch) => {
		patchMotion({ path: { ...DEFAULT_MOTION_PATH, ...motion.path, ...patch } });
	};

	const fs = motion.frameSwap ?? DEFAULT_FRAME_SWAP;
	const kf = motion.keyframes ?? { enabled: false, items: [] };
	const [activeProp, setActiveProp] = useState("x");

	const propMeta = KEYFRAME_PROPERTIES.find((p) => p.id === activeProp);
	const propKeyframes = (kf.items ?? [])
		.filter((item) => item.property === activeProp)
		.sort((a, b) => a.time - b.time);

	const addKeyframeAtPlayhead = () => {
		const value = layerPropertyToKeyframeValue(layer, activeProp);
		const items = [...(kf.items ?? [])];
		const existing = items.findIndex(
			(item) => item.property === activeProp && Math.abs(item.time - relPlayhead) < 0.05,
		);
		if (existing >= 0) {
			items[existing] = { ...items[existing], value };
		} else {
			items.push(createKeyframe(activeProp, Math.round(relPlayhead * 10) / 10, value));
		}
		patchKeyframes({ enabled: true, items });
	};

	const updateKeyframe = (id, patch) => {
		const items = (kf.items ?? []).map((item) =>
			item.id === id ? { ...item, ...patch } : item,
		);
		patchKeyframes({ items });
	};

	const removeKeyframe = (id) => {
		const items = (kf.items ?? []).filter((item) => item.id !== id);
		patchKeyframes({ items, enabled: items.length > 0 && kf.enabled });
	};

	const pathPoints = motion.path?.points ?? [];

	return (
		<PanelSection title="Advanced motion" icon={Wand2} defaultOpen={false} sectionId="advanced-motion">
			<p className="text-[10px] text-muted-foreground leading-relaxed">
				Keyframe position, size, rotation, opacity & scale. Add paths, anchors, easing, or frame
				swap.
			</p>

			<div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
				<p className="text-[10px] font-semibold text-foreground">Anchor point</p>
				<div className="grid grid-cols-2 gap-2">
					<RangeField
						label="Anchor X"
						value={Math.round((motion.anchor?.x ?? 0.5) * 100)}
						min={0}
						max={100}
						step={1}
						formatValue={(v) => `${v}%`}
						onChange={(v) => patchAnchor({ x: v / 100 })}
					/>
					<RangeField
						label="Anchor Y"
						value={Math.round((motion.anchor?.y ?? 0.5) * 100)}
						min={0}
						max={100}
						step={1}
						formatValue={(v) => `${v}%`}
						onChange={(v) => patchAnchor({ y: v / 100 })}
					/>
				</div>
			</div>

			{supportsFrameSwap(layer.type) && (
				<div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
					<label className="flex items-center gap-2 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={fs.enabled}
							onChange={(e) => {
								const enabled = e.target.checked;
								const frame2 =
									fs.frame2 ||
									(layer.type === "icon"
										? layer.data?.icon === "📁"
											? "📂"
											: "📁"
										: "");
								patchFrameSwap({ enabled, frame2 });
							}}
							className="h-3.5 w-3.5 rounded border-border accent-primary"
						/>
						<span className="text-[10px] font-semibold text-foreground flex items-center gap-1">
							<FlipHorizontal2 className="h-3 w-3" />
							Frame swap
						</span>
					</label>

					{fs.enabled && (
						<>
							{layer.type === "icon" ? (
								<Field label="Frame 2 (swap to)">
									<div className="grid grid-cols-6 gap-1 max-h-24 overflow-y-auto border border-border rounded-md p-1.5">
										{EDITOR_ICONS.map((icon) => (
											<button
												key={icon}
												type="button"
												className={cn(
													"h-7 w-7 flex items-center justify-center text-base border rounded-sm transition-colors",
													fs.frame2 === icon
														? "border-primary bg-primary/10"
														: "border-transparent hover:border-border hover:bg-muted",
												)}
												onClick={() => patchFrameSwap({ frame2: icon })}
											>
												{icon}
											</button>
										))}
									</div>
								</Field>
							) : (
								<Field label="Frame 2 URL">
									<Input
										value={fs.frame2 ?? ""}
										onChange={(e) => patchFrameSwap({ frame2: e.target.value })}
										placeholder="https://..."
										className="h-8 text-sm"
									/>
								</Field>
							)}
							<RangeField
								label="Swap at (sec)"
								value={Math.round((fs.swapAt ?? 1) * 10) / 10}
								min={0}
								max={Math.max(0.1, clipDuration - 0.1)}
								step={0.1}
								onChange={(v) => patchFrameSwap({ swapAt: v })}
							/>
							<RangeField
								label="Crossfade (sec)"
								value={Math.round((fs.crossfade ?? 0.25) * 10) / 10}
								min={0.05}
								max={2}
								step={0.05}
								onChange={(v) => patchFrameSwap({ crossfade: v })}
							/>
						</>
					)}
				</div>
			)}

			{supportsKeyframes(layer.type) && (
				<>
					<div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
						<label className="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={kf.enabled}
								onChange={(e) => {
									const enabled = e.target.checked;
									if (enabled && (kf.items ?? []).length === 0) {
										patchKeyframes({ enabled: true, items: defaultPositionKeyframes(layer) });
										setActiveProp("x");
									} else {
										patchKeyframes({ enabled });
									}
								}}
								className="h-3.5 w-3.5 rounded border-border accent-primary"
							/>
							<span className="text-[10px] font-semibold text-foreground">Property keyframes</span>
						</label>

						{kf.enabled && (
							<>
								<div className="flex flex-wrap gap-1">
									{KEYFRAME_PROPERTIES.map((p) => (
										<Button
											key={p.id}
											type="button"
											size="sm"
											variant={activeProp === p.id ? "default" : "outline"}
											className="text-[10px] h-7 px-1.5"
											onClick={() => setActiveProp(p.id)}
										>
											{p.label}
										</Button>
									))}
								</div>

								<div className="flex gap-1">
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="flex-1 text-[10px] h-7"
										onClick={addKeyframeAtPlayhead}
									>
										<Plus className="h-3 w-3 mr-1" />
										At playhead ({relPlayhead.toFixed(1)}s)
									</Button>
									{activeProp === "rotation" && (
										<Button
											type="button"
											size="sm"
											variant="outline"
											className="text-[10px] h-7 px-2"
											onClick={() => {
												patchKeyframes({ enabled: true, items: defaultRotationKeyframes(layer) });
											}}
										>
											90°
										</Button>
									)}
								</div>

								{propKeyframes.length === 0 ? (
									<p className="text-[9px] text-muted-foreground">
										No {propMeta?.label.toLowerCase()} keyframes yet.
									</p>
								) : (
									<div className="space-y-1.5">
										{propKeyframes.map((item) => (
											<div
												key={item.id}
												className="flex items-start gap-1 border border-border rounded-md p-1.5 bg-background/60"
											>
												<div className="flex-1 min-w-0 space-y-1">
													<RangeField
														label="Time"
														value={Math.round(item.time * 10) / 10}
														min={0}
														max={clipDuration}
														step={0.1}
														onChange={(v) => updateKeyframe(item.id, { time: v })}
													/>
													<RangeField
														label={propMeta?.label ?? "Value"}
														value={keyframeValueToUi(activeProp, item.value)}
														min={propMeta?.min ?? 0}
														max={propMeta?.max ?? 100}
														step={propMeta?.step ?? 1}
														formatValue={
															propMeta?.unit ? (v) => `${v}${propMeta.unit}` : undefined
														}
														onChange={(v) =>
															updateKeyframe(item.id, {
																value: keyframeValueFromUi(activeProp, v),
															})
														}
													/>
													<Field label="Easing">
														<PropertySelect
															value={item.easing || "easeOutCubic"}
															onChange={(easing) => updateKeyframe(item.id, { easing })}
															options={EASING_OPTIONS.map((e) => ({
																value: e.id,
																label: e.label,
															}))}
															placeholder="Easing"
														/>
													</Field>
												</div>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													className="h-7 w-7 shrink-0"
													disabled={propKeyframes.length <= 1}
													onClick={() => removeKeyframe(item.id)}
												>
													<Minus className="h-3.5 w-3.5" />
												</Button>
											</div>
										))}
									</div>
								)}
							</>
						)}
					</div>

					<div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
						<label className="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={Boolean(motion.path?.enabled)}
								onChange={(e) => {
									const enabled = e.target.checked;
									const points =
										pathPoints.length >= 2
											? pathPoints
											: [
													createPathPoint(layer.x, layer.y, 0),
													createPathPoint(layer.x + 40, layer.y - 30, clipDuration * 0.5),
												];
									patchPath({ enabled, points });
								}}
								className="h-3.5 w-3.5 rounded border-border accent-primary"
							/>
							<span className="text-[10px] font-semibold text-foreground flex items-center gap-1">
								<Route className="h-3 w-3" />
								Motion path
							</span>
						</label>
						{motion.path?.enabled && (
							<>
								<div className="flex gap-1">
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="flex-1 text-[10px] h-7"
										onClick={() => {
											const pts = [
												...pathPoints,
												createPathPoint(
													layer.x + pathPoints.length * 20,
													layer.y - pathPoints.length * 10,
													Math.round(relPlayhead * 10) / 10,
												),
											];
											patchPath({ points: pts });
										}}
									>
										<Plus className="h-3 w-3 mr-1" />
										Point at playhead
									</Button>
								</div>
								{pathPoints.map((pt) => (
									<div
										key={pt.id}
										className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 items-end border border-border rounded-md p-1.5"
									>
										<RangeField
											label="T"
											value={Math.round(pt.time * 10) / 10}
											min={0}
											max={clipDuration}
											step={0.1}
											onChange={(v) =>
												patchPath({
													points: pathPoints.map((p) =>
														p.id === pt.id ? { ...p, time: v } : p,
													),
												})
											}
										/>
										<RangeField
											label="X"
											value={Math.round(pt.x)}
											min={-500}
											max={2000}
											step={1}
											onChange={(v) =>
												patchPath({
													points: pathPoints.map((p) =>
														p.id === pt.id ? { ...p, x: v } : p,
													),
												})
											}
										/>
										<RangeField
											label="Y"
											value={Math.round(pt.y)}
											min={-500}
											max={2000}
											step={1}
											onChange={(v) =>
												patchPath({
													points: pathPoints.map((p) =>
														p.id === pt.id ? { ...p, y: v } : p,
													),
												})
											}
										/>
										<Button
											type="button"
											size="icon"
											variant="ghost"
											className="h-7 w-7"
											disabled={pathPoints.length <= 2}
											onClick={() =>
												patchPath({ points: pathPoints.filter((p) => p.id !== pt.id) })
											}
										>
											<Minus className="h-3.5 w-3.5" />
										</Button>
									</div>
								))}
							</>
						)}
					</div>
				</>
			)}
		</PanelSection>
	);
}
