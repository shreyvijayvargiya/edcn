import { useCallback, useEffect, useRef, useState } from "react";
import {
	Monitor,
	AppWindow,
	PanelTop,
	Square,
	RotateCcw,
	Check,
	AlertCircle,
	Webcam,
	Mic,
	Volume2,
	MousePointerClick,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	addLayer,
	addRecordedVideo,
	closeRecordScreenModal,
} from "@/lib/store/slices/videoEditorSlice";
import {
	buildScreenRecordingLabel,
	startScreenRecording,
} from "@/lib/video-editor/screenRecorder";
import { DEFAULT_DEMO_ANNOTATIONS } from "@/lib/video-editor/demoAnnotations";
import { getMediaDuration, roundMediaDuration } from "@/lib/video-editor/media";
import { uid } from "@/lib/video-editor/utils";
import AudioWaveform from "./AudioWaveform";
import { cn } from "@/lib/utils";

const CAPTURE_MODES = [
	{ id: "screen", label: "Screen", icon: Monitor, hint: "Entire display" },
	{ id: "window", label: "Window", icon: AppWindow, hint: "One app window" },
	{ id: "tab", label: "Tab", icon: PanelTop, hint: "Browser tab" },
];

export default function RecordScreenModal() {
	const dispatch = useAppDispatch();
	const { activeSceneId, recordedVideos, ui, project } = useAppSelector((s) => s.videoEditor);
	const modal = ui.recordScreenModal;
	const open = Boolean(modal);

	const [prefer, setPrefer] = useState("screen");
	const [systemAudio, setSystemAudio] = useState(true);
	const [micAudio, setMicAudio] = useState(true);
	const [webcamPip, setWebcamPip] = useState(true);
	const [phase, setPhase] = useState("idle");
	const [analyser, setAnalyser] = useState(null);
	const [blob, setBlob] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [clickMarkers, setClickMarkers] = useState([]);
	const [error, setError] = useState(null);
	const [saving, setSaving] = useState(false);
	const [elapsed, setElapsed] = useState(0);

	const captureRef = useRef(null);
	const previewVideoRef = useRef(null);
	const timerRef = useRef(null);

	const reset = useCallback(() => {
		captureRef.current?.cleanup?.();
		captureRef.current = null;
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPhase("idle");
		setAnalyser(null);
		setBlob(null);
		setPreviewUrl(null);
		setClickMarkers([]);
		setError(null);
		setSaving(false);
		setElapsed(0);
	}, [previewUrl]);

	useEffect(() => {
		if (!open) reset();
	}, [open, reset]);

	const handleClose = () => {
		reset();
		dispatch(closeRecordScreenModal());
	};

	const startRecording = async () => {
		setError(null);
		try {
			const capture = await startScreenRecording({
				prefer,
				systemAudio,
				micAudio,
				webcamPip,
				onAnalyser: setAnalyser,
			});
			captureRef.current = capture;
			setPhase("recording");
			setElapsed(0);
			timerRef.current = setInterval(() => {
				setElapsed((e) => e + 0.1);
			}, 100);

			if (previewVideoRef.current && capture.previewStream) {
				previewVideoRef.current.srcObject = capture.previewStream;
				previewVideoRef.current.play().catch(() => {});
			}
		} catch (err) {
			setError(
				err?.name === "NotAllowedError"
					? "Screen share was blocked. Allow screen/window/tab access and try again."
					: "Could not start screen capture. Check browser permissions.",
			);
		}
	};

	const stampClick = (e) => {
		if (phase !== "recording" || !captureRef.current || !previewVideoRef.current) return;
		const rect = previewVideoRef.current.getBoundingClientRect();
		const nx = (e.clientX - rect.left) / rect.width;
		const ny = (e.clientY - rect.top) / rect.height;
		captureRef.current.addClickMarker(nx, ny);
	};

	const stopRecording = async () => {
		if (!captureRef.current) return;
		try {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			const result = await captureRef.current.stop();
			captureRef.current.cleanup();
			captureRef.current = null;
			setAnalyser(null);
			if (previewVideoRef.current) previewVideoRef.current.srcObject = null;

			const url = URL.createObjectURL(result.blob);
			setBlob(result.blob);
			setPreviewUrl(url);
			setClickMarkers(result.clickMarkers ?? []);
			setPhase("review");
		} catch {
			setError("Failed to save recording. Try again.");
			reset();
		}
	};

	const confirmRecording = async () => {
		if (!blob || !previewUrl) return;
		setSaving(true);
		setError(null);
		try {
			let duration = Math.max(1, elapsed || 1);
			try {
				const raw = await getMediaDuration(previewUrl, "video");
				duration = roundMediaDuration(raw);
			} catch {
				/* fallback */
			}

			const track = {
				id: `recvid-${uid()}`,
				label: buildScreenRecordingLabel(recordedVideos.length + 1, prefer),
				tags: ["recorded", "screen", prefer],
				src: previewUrl,
				duration,
				createdAt: Date.now(),
				mimeType: blob.type,
				clickMarkers,
			};
			dispatch(addRecordedVideo(track));

			if (modal?.insertAt !== undefined && activeSceneId) {
				const canvasW = project.canvas?.width ?? 360;
				const canvasH = project.canvas?.height ?? 640;
				dispatch(
					addLayer({
						sceneId: activeSceneId,
						insertAt: modal.insertAt ?? "end",
						type: "video",
						mediaDuration: duration,
						data: {
							src: previewUrl,
							label: track.label,
							mediaDuration: duration,
							muted: false,
							volume: 1,
							demoAnnotations: {
								...DEFAULT_DEMO_ANNOTATIONS,
								enabled: clickMarkers.length > 0,
								markers: clickMarkers.map((m, i) => ({
									id: `dm-${i}-${uid()}`,
									time: m.time,
									x: m.x,
									y: m.y,
									type: "click",
								})),
							},
						},
						overrides: {
							x: 0,
							y: 0,
							width: canvasW,
							height: canvasH,
						},
					}),
				);
			}

			setBlob(null);
			setPreviewUrl(null);
			dispatch(closeRecordScreenModal());
			setSaving(false);
			setPhase("idle");
		} catch {
			setError("Could not add recording. Try again.");
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
			<DialogContent className="max-w-lg sm:max-w-xl">
				<DialogHeader className="text-left sm:text-left">
					<DialogTitle>Record screen</DialogTitle>
					<DialogDescription>
						Capture a screen, window, or tab with system audio, mic, and optional webcam PIP.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-1">
					{phase === "idle" && (
						<>
							<div className="grid grid-cols-3 gap-2">
								{CAPTURE_MODES.map(({ id, label, icon: Icon, hint }) => (
									<button
										key={id}
										type="button"
										onClick={() => setPrefer(id)}
										className={cn(
											"flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-center transition-colors",
											prefer === id
												? "border-primary bg-primary/10"
												: "border-border hover:border-primary/50 hover:bg-muted/30",
										)}
									>
										<Icon className="h-5 w-5" />
										<span className="text-xs font-semibold">{label}</span>
										<span className="text-[9px] text-muted-foreground leading-tight">{hint}</span>
									</button>
								))}
							</div>

							<div className="space-y-2 rounded-lg border-2 border-border bg-muted/20 p-3">
								<label className="flex items-center gap-2 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={systemAudio}
										onChange={(e) => setSystemAudio(e.target.checked)}
										className="h-3.5 w-3.5 rounded border-border accent-primary"
									/>
									<Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
									<Label className="text-xs font-medium cursor-pointer">System / tab audio</Label>
								</label>
								<label className="flex items-center gap-2 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={micAudio}
										onChange={(e) => setMicAudio(e.target.checked)}
										className="h-3.5 w-3.5 rounded border-border accent-primary"
									/>
									<Mic className="h-3.5 w-3.5 text-muted-foreground" />
									<Label className="text-xs font-medium cursor-pointer">Microphone</Label>
								</label>
								<label className="flex items-center gap-2 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={webcamPip}
										onChange={(e) => setWebcamPip(e.target.checked)}
										className="h-3.5 w-3.5 rounded border-border accent-primary"
									/>
									<Webcam className="h-3.5 w-3.5 text-muted-foreground" />
									<Label className="text-xs font-medium cursor-pointer">Webcam PIP</Label>
								</label>
							</div>
						</>
					)}

					<div
						className={cn(
							"relative flex w-full flex-col items-center justify-center rounded-xl border-2 px-3 py-4",
							phase === "recording"
								? "border-primary/50 bg-primary/5"
								: "border-border bg-muted/20",
						)}
					>
						{phase === "recording" && (
							<span className="absolute right-3 top-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
								<span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
								{elapsed.toFixed(1)}s
							</span>
						)}

						{(phase === "recording" || phase === "idle") && (
							<video
								ref={previewVideoRef}
								muted
								playsInline
								onClick={stampClick}
								className={cn(
									"mb-3 w-full max-h-48 rounded-md bg-black object-contain",
									phase === "idle" && "hidden",
									phase === "recording" && "cursor-crosshair",
								)}
							/>
						)}

						{phase === "review" && previewUrl && (
							<video
								src={previewUrl}
								controls
								playsInline
								className="mb-3 w-full max-h-48 rounded-md bg-black object-contain"
							/>
						)}

						<AudioWaveform analyser={analyser} active={phase === "recording"} className="mb-3" />

						{phase === "recording" && (
							<p className="mb-2 flex items-center gap-1 text-[10px] text-muted-foreground">
								<MousePointerClick className="h-3 w-3" />
								Click the preview to stamp click highlights
							</p>
						)}

						<div className="flex flex-wrap items-center justify-center gap-2">
							{phase === "idle" && (
								<Button type="button" className="gap-2" onClick={startRecording}>
									<Monitor className="h-4 w-4" />
									Start capture
								</Button>
							)}
							{phase === "recording" && (
								<Button
									type="button"
									variant="destructive"
									className="gap-2"
									onClick={stopRecording}
								>
									<Square className="h-3.5 w-3.5 fill-current" />
									Stop
								</Button>
							)}
							{phase === "review" && (
								<>
									<Button type="button" variant="outline" className="gap-2" onClick={reset}>
										<RotateCcw className="h-4 w-4" />
										Re-record
									</Button>
									<Button
										type="button"
										className="gap-2"
										onClick={confirmRecording}
										disabled={saving}
									>
										<Check className="h-4 w-4" />
										{saving ? "Saving…" : "Confirm"}
									</Button>
								</>
							)}
						</div>
					</div>

					{error && (
						<div className="flex w-full items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
							<AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					{modal?.insertAt != null && (
						<p className="text-[10px] text-muted-foreground text-center">
							Confirm adds this clip to your library and the timeline (with audio).
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
