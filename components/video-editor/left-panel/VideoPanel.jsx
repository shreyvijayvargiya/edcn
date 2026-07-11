import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterStockVideos } from "@/lib/video-editor/stockVideos";

export function VideoPanel({ onUpload, onAddStock, search }) {
	const videos = filterStockVideos(search);

	return (
		<div className="flex flex-col gap-3 p-3">
			<Button variant="outline" className="w-full h-10 gap-2 shrink-0" onClick={onUpload}>
				<Video className="h-4 w-4 text-muted-foreground" />
				<span className="text-xs font-medium">Upload video</span>
			</Button>

			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-bold text-foreground">Sample videos</p>
				<span className="text-[10px] text-muted-foreground tabular-nums">{videos.length}</span>
			</div>
			<p className="text-[10px] text-muted-foreground leading-relaxed -mt-2">
				Click to add a clip to the canvas. Edit text and export on top.
			</p>

			{videos.length === 0 ? (
				<p className="text-xs text-muted-foreground py-4 text-center">No videos match your search.</p>
			) : (
				<div className="grid grid-cols-1 gap-2">
					{videos.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => onAddStock(item)}
							className="group relative aspect-video overflow-hidden rounded-lg border-2 border-border bg-muted/30 hover:border-primary transition-colors text-left"
							title={item.label}
						>
							<video
								src={item.src}
								muted
								playsInline
								preload="metadata"
								className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
							/>
							<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] font-semibold text-white truncate">
								{item.label}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
