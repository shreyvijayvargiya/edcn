import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateLayer } from "@/lib/store/slices/videoEditorSlice";
import {
	PanelSection,
	FrameSection,
	TransformSection,
	TimingSection,
	SceneTimingSection,
	LayerPanelHeader,
} from "./property-panel/PropertyPanelSections";
import { AdvancedMotionSection } from "./property-panel/AdvancedMotionSection";
import CanvasProperties from "./property-panel/CanvasProperties";
import {
	LayerContentSection,
	LayerAppearanceSection,
	UiColorsSection,
	UiLayoutSection,
} from "./property-panel/LayerContentSections";

export default function PropertyPanel() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId, selectedLayerIds, selectedLayerId } = useAppSelector(
		(s) => s.videoEditor,
	);

	const scene = project.scenes.find((s) => s.id === activeSceneId);
	const layer =
		selectedLayerIds.length === 1
			? scene?.layers.find((l) => l.id === selectedLayerId)
			: null;

	if (selectedLayerIds.length > 1) {
		return (
			<div className="flex h-full w-full flex-col overflow-y-auto bg-card">
				<div className="px-3 py-2.5 border-b border-border bg-muted/20">
					<p className="text-sm font-semibold text-foreground">
						{selectedLayerIds.length} layers selected
					</p>
					<p className="text-[10px] text-muted-foreground mt-0.5">
						Ctrl+click timeline clips to multi-select · Delete removes all
					</p>
				</div>
				<SceneTimingSection scene={scene} dispatch={dispatch} />
			</div>
		);
	}

	if (!layer) {
		return (
			<div className="flex h-full w-full flex-col overflow-y-auto bg-card">
				<div className="px-3 py-2.5 border-b border-border bg-muted/20">
					<p className="text-sm font-semibold text-foreground">Canvas</p>
					<p className="text-[10px] text-muted-foreground mt-0.5">
						Background & scene settings
					</p>
				</div>
				<PanelSection title="Background" defaultOpen sectionId="background">
					<CanvasProperties canvas={project.canvas} dispatch={dispatch} />
				</PanelSection>
				<SceneTimingSection scene={scene} dispatch={dispatch} />
				<div className="px-3 py-3 mt-auto">
					<p className="text-[10px] text-muted-foreground leading-relaxed">
						Select a layer to edit frame, appearance, transform & timing. Space play/pause,
						Delete remove layer.
					</p>
				</div>
			</div>
		);
	}

	const patchLayer = (changes) =>
		dispatch(updateLayer({ sceneId: activeSceneId, layerId: layer.id, changes }));

	const hasAppearance = ["image", "video", "icon", "ui"].includes(layer.type);

	return (
		<div className="flex h-full w-full flex-col overflow-y-auto bg-card">
			<LayerPanelHeader layer={layer} />

			<FrameSection layer={layer} onPatch={patchLayer} />

			<LayerContentSection layer={layer} sceneId={activeSceneId} dispatch={dispatch} />

			{layer.type === "ui" && (
				<>
					<UiColorsSection layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
					<UiLayoutSection layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
				</>
			)}

			{hasAppearance && (
				<LayerAppearanceSection layer={layer} sceneId={activeSceneId} dispatch={dispatch} />
			)}

			<TransformSection layer={layer} onPatch={patchLayer} />

			<TimingSection
				layer={layer}
				scene={scene}
				sceneId={activeSceneId}
				layerId={layer.id}
				dispatch={dispatch}
			/>

			<AdvancedMotionSection
				layer={layer}
				scene={scene}
				sceneId={activeSceneId}
				layerId={layer.id}
			/>

			<SceneTimingSection scene={scene} dispatch={dispatch} />
		</div>
	);
}
