import { Music, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeAudioLibrary } from "@/lib/video-editor/recordedAudio";

export function AudioPanel({ onUpload, onAddStock, onRecord, recordedTracks, search }) {
	const { recorded, stock, total } = mergeAudioLibrary(recordedTracks, search);

	return (
		<div className="flex flex-col gap-3 p-3">
			<Button variant="outline" className="w-full h-10 gap-2 shrink-0" onClick={onUpload}>
				<Music className="h-4 w-4 text-muted-foreground" />
				<span className="text-xs font-medium">Upload audio</span>
			</Button>

			<Button className="w-full h-10 gap-2 shrink-0" onClick={onRecord}>
				<Mic className="h-4 w-4" />
				<span className="text-xs font-medium">Record audio</span>
			</Button>

			{recorded.length > 0 && (
				<>
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm font-bold text-foreground">Your recordings</p>
						<span className="text-[10px] text-muted-foreground tabular-nums">
							{recorded.length}
						</span>
					</div>
					<div className="flex flex-col gap-2">
						{recorded.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => onAddStock(item)}
								className="flex items-center gap-3 rounded-lg border-2 border-primary/30 px-2.5 py-2 hover:border-primary hover:bg-primary/5 transition-colors text-left"
								title={item.label}
							>
								<div className="h-10 w-10 shrink-0 rounded-md border border-primary/30 bg-primary/15 flex items-center justify-center">
									<Mic className="h-4 w-4 text-primary" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
									<p className="text-[10px] text-muted-foreground truncate">
										{item.transcript
											? item.transcript.slice(0, 48) + (item.transcript.length > 48 ? "…" : "")
											: "Recorded clip"}
									</p>
								</div>
							</button>
						))}
					</div>
				</>
			)}

			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-bold text-foreground">Sample audio</p>
				<span className="text-[10px] text-muted-foreground tabular-nums">{stock.length}</span>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed -mt-2">
				Add sound effects, music beds, or your recordings to the timeline.
			</p>

			{total === 0 ? (
				<p className="text-xs text-muted-foreground py-4 text-center">No audio matches your search.</p>
			) : stock.length === 0 && recorded.length > 0 ? null : (
				<div className="flex flex-col gap-2">
					{stock.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => onAddStock(item)}
							className="flex items-center gap-3 rounded-lg border-2 border-border px-2.5 py-2 hover:border-primary hover:bg-muted/20 transition-colors text-left"
							title={item.label}
						>
							<div className="h-10 w-10 shrink-0 rounded-md border border-border bg-primary/10 flex items-center justify-center">
								<Music className="h-4 w-4 text-primary" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
								<p className="text-[10px] text-muted-foreground capitalize">
									{item.tags.slice(0, 2).join(" · ")}
								</p>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
