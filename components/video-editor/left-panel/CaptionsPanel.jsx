import { Captions, Mic, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAPTION_STYLE_PRESETS } from "@/lib/video-editor/captions";
import { cn } from "@/lib/utils";

export function CaptionsPanel({
	onAddCaption,
	onAddFromTranscript,
	onImportFile,
	onStartAsr,
	search,
}) {
	const styles = CAPTION_STYLE_PRESETS.filter((s) => {
		if (!search?.trim()) return true;
		const q = search.toLowerCase();
		return (
			s.label.toLowerCase().includes(q) ||
			s.description.toLowerCase().includes(q) ||
			s.id.includes(q)
		);
	});

	return (
		<div className="flex flex-col gap-3 p-3">
			<Button className="w-full h-10 gap-2 shrink-0" onClick={() => onAddCaption()}>
				<Captions className="h-4 w-4" />
				<span className="text-xs font-medium">Add caption track</span>
			</Button>

			<div className="grid grid-cols-1 gap-2">
				<Button variant="outline" className="w-full h-9 gap-2 justify-start" onClick={onStartAsr}>
					<Mic className="h-4 w-4 text-muted-foreground" />
					<span className="text-xs">Dictate captions (ASR)</span>
				</Button>
				<Button
					variant="outline"
					className="w-full h-9 gap-2 justify-start"
					onClick={onAddFromTranscript}
				>
					<Sparkles className="h-4 w-4 text-muted-foreground" />
					<span className="text-xs">From audio transcript</span>
				</Button>
				<Button variant="outline" className="w-full h-9 gap-2 justify-start" onClick={onImportFile}>
					<FileText className="h-4 w-4 text-muted-foreground" />
					<span className="text-xs">Import SRT / VTT</span>
				</Button>
			</div>

			<div className="flex items-center justify-between gap-2 pt-1">
				<p className="text-sm font-bold text-foreground">Platform styles</p>
				<span className="text-[10px] text-muted-foreground tabular-nums">{styles.length}</span>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed -mt-2">
				TikTok, Reels, Shorts, YouTube, and podcast karaoke styles. Edit word timing in the
				property panel.
			</p>

			{styles.length === 0 ? (
				<p className="text-xs text-muted-foreground py-4 text-center">No styles match.</p>
			) : (
				<div className="grid grid-cols-1 gap-2">
					{styles.map((style) => (
						<button
							key={style.id}
							type="button"
							onClick={() => onAddCaption(style.id)}
							className={cn(
								"rounded-lg border-2 border-border px-3 py-2.5 text-left transition-colors",
								"hover:border-primary hover:bg-primary/5",
							)}
						>
							<p className="text-xs font-semibold text-foreground">{style.label}</p>
							<p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
							<p
								className="mt-2 truncate text-sm font-bold"
								style={{
									color: style.highlightFill,
									fontFamily: style.fontFamily,
									textShadow: "0 1px 2px rgba(0,0,0,0.5)",
								}}
							>
								Sample karaoke
							</p>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
