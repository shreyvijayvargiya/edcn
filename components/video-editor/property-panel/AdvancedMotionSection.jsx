import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateLayer } from "@/lib/store/slices/videoEditorSlice";
import { EDITOR_ICONS } from "@/lib/video-editor/icons";
import {
	DEFAULT_MOTION,
	DEFAULT_FRAME_SWAP,
	KEYFRAME_PROPERTIES,
	createKeyframe,
	defaultRotationKeyframes,
	keyframeValueFromUi,
	keyframeValueToUi,
	layerPropertyToKeyframeValue,
	supportsFrameSwap,
	supportsKeyframes,
} from "@/lib/video-editor/motion";
import { PanelSection, Field, RangeField, Button } from "./PropertyPanelSections";
import { Plus, Minus, Wand2, FlipHorizontal2 } from "lucide-react";
import { cn } from "@/lib/utils";

function ensureMotion(layer) {
	return layer.motion ?? { ...DEFAULT_MOTION, frameSwap: { ...DEFAULT_FRAME_SWAP }, keyframes: { enabled: false, items: [] } };
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

	const fs = motion.frameSwap ?? DEFAULT_FRAME_SWAP;
	const kf = motion.keyframes ?? { enabled: false, items: [] };
	const [activeProp, setActiveProp] = useState("rotation");

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

	const enableRotationPreset = () => {
		patchKeyframes({ enabled: true, items: defaultRotationKeyframes(layer) });
		setActiveProp("rotation");
	};

	return (
		<PanelSection title="Advanced motion" icon={Wand2} defaultOpen={false}>
			<p className="text-[10px] text-muted-foreground leading-relaxed">
				Keyframe transforms over the clip, or swap icon/image frames — e.g. closed folder → open.
			</p>

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
									<p className="text-[9px] text-muted-foreground mt-1">
										Frame 1 is the current icon ({layer.data?.icon})
									</p>
								</Field>
							) : (
								<Field label="Frame 2 URL">
									<Input
										value={fs.frame2 ?? ""}
										onChange={(e) => patchFrameSwap({ frame2: e.target.value })}
										placeholder="https://..."
										className="h-8 text-sm"
									/>
									<p className="text-[9px] text-muted-foreground mt-1">
										Frame 1 is the current image source
									</p>
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
				<div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
					<label className="flex items-center gap-2 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={kf.enabled}
							onChange={(e) => {
								const enabled = e.target.checked;
								if (enabled && (kf.items ?? []).length === 0) {
									patchKeyframes({ enabled: true, items: defaultRotationKeyframes(layer) });
									setActiveProp("rotation");
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
							<div className="flex gap-1">
								{KEYFRAME_PROPERTIES.map((p) => (
									<Button
										key={p.id}
										type="button"
										size="sm"
										variant={activeProp === p.id ? "default" : "outline"}
										className="flex-1 text-[10px] h-7 px-1"
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
										onClick={enableRotationPreset}
									>
										90° preset
									</Button>
								)}
							</div>

							{propKeyframes.length === 0 ? (
								<p className="text-[9px] text-muted-foreground">
									No {propMeta?.label.toLowerCase()} keyframes. Add at playhead or use the preset.
								</p>
							) : (
								<div className="space-y-1.5">
									{propKeyframes.map((item) => (
										<div
											key={item.id}
											className="flex items-center gap-1 border border-border rounded-md p-1.5 bg-background/60"
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
														propMeta?.unit
															? (v) => `${v}${propMeta.unit}`
															: undefined
													}
													onChange={(v) =>
														updateKeyframe(item.id, {
															value: keyframeValueFromUi(activeProp, v),
														})
													}
												/>
											</div>
											<Button
												type="button"
												size="icon"
												variant="ghost"
												className="h-7 w-7 shrink-0 self-start"
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
			)}
		</PanelSection>
	);
}
