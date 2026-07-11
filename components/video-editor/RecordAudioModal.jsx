import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Check, AlertCircle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
	addLayer,
	addRecordedAudio,
	closeRecordAudioModal,
} from "@/lib/store/slices/videoEditorSlice";
import {
	buildRecordingLabel,
	createSpeechRecognizer,
	getSpeechRecognitionCtor,
	startMicCapture,
} from "@/lib/video-editor/audioRecorder";
import { getMediaDuration, roundMediaDuration } from "@/lib/video-editor/media";
import { uid } from "@/lib/video-editor/utils";
import AudioWaveform from "./AudioWaveform";
import { cn } from "@/lib/utils";

export default function RecordAudioModal() {
	const dispatch = useAppDispatch();
	const { activeSceneId, recordedAudio, ui } = useAppSelector((s) => s.videoEditor);
	const modal = ui.recordAudioModal;
	const open = Boolean(modal);

	const [phase, setPhase] = useState("idle"); // idle | recording | review
	const [analyser, setAnalyser] = useState(null);
	const [transcript, setTranscript] = useState("");
	const [interim, setInterim] = useState("");
	const [blob, setBlob] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [error, setError] = useState(null);
	const [saving, setSaving] = useState(false);

	const captureRef = useRef(null);
	const recognitionRef = useRef(null);
	const finalTranscriptRef = useRef("");
	const userEditedRef = useRef(false);

	const reset = useCallback(() => {
		captureRef.current?.cleanup?.();
		captureRef.current = null;
		try {
			recognitionRef.current?.stop();
		} catch {
			/* ignore */
		}
		recognitionRef.current = null;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPhase("idle");
		setAnalyser(null);
		setTranscript("");
		setInterim("");
		finalTranscriptRef.current = "";
		userEditedRef.current = false;
		setBlob(null);
		setPreviewUrl(null);
		setError(null);
		setSaving(false);
	}, [previewUrl]);

	useEffect(() => {
		if (!open) reset();
	}, [open, reset]);

	const handleClose = () => {
		reset();
		dispatch(closeRecordAudioModal());
	};

	const startRecording = async () => {
		setError(null);
		try {
			const capture = await startMicCapture();
			captureRef.current = capture;
			setAnalyser(capture.analyser);
			setPhase("recording");
			setTranscript("");
			setInterim("");
			finalTranscriptRef.current = "";
			userEditedRef.current = false;

			const SpeechCtor = getSpeechRecognitionCtor();
			if (SpeechCtor) {
				const recognition = createSpeechRecognizer({
					onResult: ({ final, interim: interimText }) => {
						if (final && !userEditedRef.current) {
							finalTranscriptRef.current = `${finalTranscriptRef.current} ${final}`.trim();
							setTranscript(finalTranscriptRef.current);
						}
						if (!userEditedRef.current) setInterim(interimText);
					},
					onError: (err) => {
						if (err !== "no-speech" && err !== "aborted") {
							setError("Speech recognition unavailable — audio will still be saved.");
						}
					},
				});
				if (recognition) {
					recognitionRef.current = recognition;
					try {
						recognition.start();
					} catch {
						/* may already be running */
					}
				}
			}
		} catch (err) {
			setError(
				err?.name === "NotAllowedError"
					? "Microphone access denied. Allow mic permission and try again."
					: "Could not start recording. Check your microphone.",
			);
		}
	};

	const stopRecording = async () => {
		if (!captureRef.current) return;
		try {
			try {
				recognitionRef.current?.stop();
			} catch {
				/* ignore */
			}
			const { blob: recordedBlob } = await captureRef.current.stop();
			captureRef.current.cleanup();
			captureRef.current = null;
			setAnalyser(null);

			const url = URL.createObjectURL(recordedBlob);
			setBlob(recordedBlob);
			setPreviewUrl(url);
			if (!finalTranscriptRef.current && interim) {
				finalTranscriptRef.current = interim;
				setTranscript(interim);
			} else {
				finalTranscriptRef.current = transcript.trim();
			}
			setInterim("");
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
			let duration = 1;
			try {
				const raw = await getMediaDuration(previewUrl, "audio");
				duration = roundMediaDuration(raw);
			} catch {
				/* fallback */
			}

			const fullTranscript = transcript.trim();
			const track = {
				id: `rec-${uid()}`,
				label: buildRecordingLabel(fullTranscript, recordedAudio.length + 1),
				tags: ["recorded", "voice"],
				src: previewUrl,
				duration,
				transcript: fullTranscript,
				createdAt: Date.now(),
				mimeType: blob.type,
			};

			dispatch(addRecordedAudio(track));

			if (modal?.insertAt && activeSceneId) {
				dispatch(
					addLayer({
						sceneId: activeSceneId,
						insertAt: modal.insertAt,
						type: "audio",
						mediaDuration: duration,
						data: {
							src: previewUrl,
							label: track.label,
							mediaDuration: duration,
							transcript: fullTranscript,
						},
					}),
				);
			}

			// Keep blob URL alive in library — don't revoke on confirm
			setBlob(null);
			setPreviewUrl(null);
			dispatch(closeRecordAudioModal());
			setSaving(false);
			setPhase("idle");
		} catch {
			setError("Could not add recording. Try again.");
			setSaving(false);
		}
	};

	const speechSupported = Boolean(getSpeechRecognitionCtor());
	const interimSuffix =
		phase === "recording" && interim && !userEditedRef.current
			? `${transcript ? " " : ""}${interim}`
			: "";
	const textareaValue = transcript + interimSuffix;

	const handleTranscriptChange = (e) => {
		const next = e.target.value;
		userEditedRef.current = true;
		setTranscript(next);
		setInterim("");
		finalTranscriptRef.current = next.trim();
	};

	const placeholder =
		phase === "recording"
			? "Listening… edit or type your script here."
			: speechSupported
				? "Transcript appears while recording — you can edit anytime."
				: "Type a script or notes for this recording.";

	return (
		<Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
			<DialogContent className="max-w-md sm:max-w-lg">
				<DialogHeader className="text-left sm:text-left">
					<DialogTitle>Record audio</DialogTitle>
					<DialogDescription>
						Capture voiceover or narration. Transcript appears live while you speak.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-5 py-2">
					<div
						className={cn(
							"relative flex w-full flex-col items-center justify-center rounded-xl border-2 px-4 py-6",
							phase === "recording"
								? "border-primary/50 bg-primary/5"
								: "border-border bg-muted/20",
						)}
					>
						{phase === "recording" && (
							<span className="absolute right-3 top-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
								<span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
								Recording
							</span>
						)}

						<AudioWaveform
							analyser={analyser}
							active={phase === "recording"}
							className="mb-4"
						/>

						{phase === "review" && previewUrl && (
							<audio
								src={previewUrl}
								controls
								className="mb-3 h-9 w-full max-w-xs"
								preload="metadata"
							/>
						)}

						<div className="flex items-center gap-2">
							{phase === "idle" && (
								<Button type="button" className="gap-2" onClick={startRecording}>
									<Mic className="h-4 w-4" />
									Start recording
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

					<div className="w-full space-y-2">
						<p className="text-xs font-semibold text-foreground">Spoken text</p>
						<Textarea
							value={textareaValue}
							onChange={handleTranscriptChange}
							placeholder={placeholder}
							className="min-h-[5.5rem] max-h-36 resize-y text-sm leading-relaxed"
							rows={4}
						/>
						{!speechSupported && phase !== "review" && (
							<p className="text-[10px] text-muted-foreground">
								Use Chrome or Edge for live transcription. Recording still works without it.
							</p>
						)}
					</div>

					{error && (
						<div className="flex w-full items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
							<AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					{modal?.insertAt && (
						<p className="text-[10px] text-muted-foreground text-center">
							Confirm adds this clip to your library and the timeline.
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
