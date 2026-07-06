import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, FileVideo, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function GifExportPanel({
	startTime,
	endTime,
	maxDuration,
	disabled,
	onStartTimeChange,
	onEndTimeChange,
	onExport,
	onBack,
}) {
	return (
		<motion.div
			initial={{ height: 0, opacity: 0 }}
			animate={{ height: "auto", opacity: 1 }}
			exit={{ height: 0, opacity: 0 }}
			transition={{ duration: 0.18, ease: "easeOut" }}
			className="overflow-hidden"
			onPointerDown={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
		>
			<div className="px-2 pb-2 pt-1 space-y-2">
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
							GIF start (sec)
						</Label>
						<Input
							type="number"
							min={0}
							max={Math.max(0, endTime - 0.1)}
							step={0.1}
							value={startTime}
							disabled={disabled}
							onChange={(e) =>
								onStartTimeChange(
									Math.max(
										0,
										Math.min(Number(e.target.value) || 0, endTime - 0.1),
									),
								)
							}
							className="h-8 text-xs tabular-nums"
						/>
					</div>
					<div>
						<Label className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
							GIF end (sec)
						</Label>
						<Input
							type="number"
							min={startTime + 0.1}
							max={maxDuration}
							step={0.1}
							value={endTime}
							disabled={disabled}
							onChange={(e) =>
								onEndTimeChange(
									Math.max(
										startTime + 0.1,
										Math.min(
											Number(e.target.value) || maxDuration,
											maxDuration,
										),
									),
								)
							}
							className="h-8 text-xs tabular-nums"
						/>
					</div>
				</div>
				<p className="text-[10px] text-muted-foreground">
					{(endTime - startTime).toFixed(1)}s · max 15s
				</p>
				<div className="flex gap-2">
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="h-8 flex-1 text-xs"
						disabled={disabled}
						onClick={onBack}
					>
						Back
					</Button>
					<Button
						type="button"
						size="sm"
						className="h-8 flex-1 gap-1.5 text-xs"
						disabled={disabled}
						onClick={onExport}
					>
						<Download className="h-3.5 w-3.5" />
						Export GIF
					</Button>
				</div>
			</div>
		</motion.div>
	);
}

export default function ExportMenu({
	disabled,
	isExporting,
	gifStart,
	gifEnd,
	maxDuration,
	onGifStartChange,
	onGifEndChange,
	onExportMp4,
	onExportGif,
}) {
	const [open, setOpen] = useState(false);
	const [gifMode, setGifMode] = useState(false);

	const closeMenu = () => {
		setOpen(false);
		setGifMode(false);
	};

	const handleOpenChange = (next) => {
		setOpen(next);
		if (!next) setGifMode(false);
	};

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<Button size="sm" disabled={disabled} className="gap-1.5">
					{isExporting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Download className="h-4 w-4" />
					)}
					<span className="hidden sm:inline">
						{isExporting ? "Exporting…" : "Export"}
					</span>
					<ChevronDown className="h-3.5 w-3.5 opacity-70" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-64 p-1"
				onCloseAutoFocus={(e) => {
					if (gifMode) e.preventDefault();
				}}
			>
				<DropdownMenuItem
					className="gap-2.5 cursor-pointer"
					disabled={isExporting}
					onSelect={() => {
						onExportMp4();
						closeMenu();
					}}
				>
					<FileVideo className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium">MP4 video</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2.5 cursor-pointer"
					disabled={isExporting}
					onSelect={(e) => {
						e.preventDefault();
						setGifMode(true);
					}}
				>
					<ImageIcon className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium">GIF animation</span>
				</DropdownMenuItem>

				<AnimatePresence>
					{gifMode && (
						<>
							<DropdownMenuSeparator />
							<GifExportPanel
								startTime={gifStart}
								endTime={gifEnd}
								maxDuration={maxDuration}
								disabled={disabled || isExporting}
								onStartTimeChange={onGifStartChange}
								onEndTimeChange={onGifEndChange}
								onBack={() => setGifMode(false)}
								onExport={() => {
									onExportGif();
									closeMenu();
								}}
							/>
						</>
					)}
				</AnimatePresence>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
