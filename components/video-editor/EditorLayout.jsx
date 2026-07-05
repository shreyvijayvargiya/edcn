import Toolbar from "./Toolbar";
import LeftPanel from "./LeftPanel";
import CanvasPreview from "./CanvasPreview";
import PropertyPanel from "./PropertyPanel";
import Timeline from "./Timeline";
import PreviewControls from "./PreviewControls";
import { StageRefProvider } from "./StageRefContext";
import AudioPlaybackSync from "./AudioPlaybackSync";

export default function EditorLayout() {
	return (
		<StageRefProvider>
			<AudioPlaybackSync />
			<div className="flex flex-col h-dvh overflow-hidden bg-background text-foreground">
				<Toolbar />
				<div className="flex flex-1 min-h-0">
					<LeftPanel />
					<main className="flex-1 flex flex-col min-w-0 min-h-0">
						<CanvasPreview />
						<PreviewControls />
					</main>
					<PropertyPanel />
				</div>
				<Timeline />
			</div>
		</StageRefProvider>
	);
}
