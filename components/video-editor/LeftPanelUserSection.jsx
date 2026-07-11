import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function LeftPanelUserSection() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="shrink-0 border-t-2 border-border p-2 flex flex-col items-center">
				<button
					type="button"
					onClick={() => setOpen(true)}
					className={cn(
						"h-9 w-9 rounded-full border-2 border-border bg-muted text-muted-foreground",
						"flex items-center justify-center",
						"hover:bg-muted/80 hover:text-foreground transition-colors",
					)}
					title="About"
				>
					<Info className="h-4 w-4" />
				</button>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>EDCN</DialogTitle>
						<DialogDescription>
							Open-source browser video editor — Next.js, Konva, and Redux. Projects
							save in your browser (localStorage). No account required.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-lg border-2 border-border bg-muted/20 p-3 space-y-2 text-xs text-muted-foreground">
						<p>
							Optional AI uses OpenRouter via <code className="text-foreground">/api/ai/chat</code>.
							Set <code className="text-foreground">OPENROUTER_API_KEY</code> in{" "}
							<code className="text-foreground">.env.local</code>, or paste a key in the AI panel.
						</p>
					</div>

					<Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
						Close
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}
