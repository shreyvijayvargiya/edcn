import { useState } from "react";
import { LayoutPanelLeft, SlidersHorizontal } from "lucide-react";
import Toolbar from "./Toolbar";
import LeftPanel from "./LeftPanel";
import CanvasPreview from "./CanvasPreview";
import PropertyPanel from "./PropertyPanel";
import Timeline from "./Timeline";
import SidebarOverlay from "./SidebarOverlay";
import { StageRefProvider } from "./StageRefContext";
import AudioPlaybackSync from "./AudioPlaybackSync";
import EditorHistoryHotkeys from "./EditorHistoryHotkeys";
import EditorLayerHotkeys from "./EditorLayerHotkeys";
import { useEditorPanelSizes } from "@/lib/video-editor/useEditorPanelSizes";
import CommandSearch from "./CommandSearch";
import RecordAudioModal from "./RecordAudioModal";

export default function EditorLayout() {
	const [leftOpen, setLeftOpen] = useState(false);
	const [rightOpen, setRightOpen] = useState(false);
	const [commandOpen, setCommandOpen] = useState(false);
	const {
		leftWidth,
		rightWidth,
		panelHeight,
		setLeftWidth,
		setRightWidth,
		setPanelHeight,
	} = useEditorPanelSizes();

	return (
		<StageRefProvider>
			<AudioPlaybackSync />
			<EditorHistoryHotkeys />
			<EditorLayerHotkeys />
			<RecordAudioModal />
			<CommandSearch
				open={commandOpen}
				onOpenChange={setCommandOpen}
				openLeftPanel={() => setLeftOpen(true)}
				openRightPanel={() => setRightOpen(true)}
			/>
			<div className="flex flex-col h-dvh overflow-hidden bg-background text-foreground">
				<Toolbar onOpenCommandSearch={() => setCommandOpen(true)} />
				<div className="relative flex flex-1 min-h-0 pb-[17.5rem]">
					<SidebarOverlay
						side="left"
						open={leftOpen}
						onOpenChange={setLeftOpen}
						width={leftWidth}
						panelHeight={panelHeight}
						onWidthChange={setLeftWidth}
						onHeightChange={setPanelHeight}
						toggleIcon={LayoutPanelLeft}
						label="Assets panel"
					>
						<LeftPanel />
					</SidebarOverlay>

					<main className="flex flex-1 flex-col min-w-0 min-h-0">
						<CanvasPreview />
					</main>

					<SidebarOverlay
						side="right"
						open={rightOpen}
						onOpenChange={setRightOpen}
						width={rightWidth}
						panelHeight={panelHeight}
						onWidthChange={setRightWidth}
						onHeightChange={setPanelHeight}
						toggleIcon={SlidersHorizontal}
						label="Properties panel"
					>
						<PropertyPanel />
					</SidebarOverlay>
				</div>
			</div>
			<Timeline />
		</StageRefProvider>
	);
}
