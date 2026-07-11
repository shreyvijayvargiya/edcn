import {
	BringToFront,
	ClipboardPaste,
	Copy,
	CopyPlus,
	Eye,
	EyeOff,
	Lock,
	SendToBack,
	Scissors,
	Trash2,
	Unlock,
	Volume2,
	VolumeX,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLayerClipDuration } from "@/lib/video-editor/timeline";
import { cn } from "@/lib/utils";

function MenuRow({ icon: Icon, label, shortcut, destructive, disabled, onAction }) {
	return (
		<DropdownMenuItem
			className={cn(
				"gap-2 cursor-pointer",
				destructive && "text-destructive focus:text-destructive",
			)}
			disabled={disabled}
			onSelect={(e) => {
				e.preventDefault();
				if (disabled) return;
				onAction?.();
			}}
		>
			<Icon className="h-4 w-4 shrink-0" />
			<span className="flex-1">{label}</span>
			{shortcut ? <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut> : null}
		</DropdownMenuItem>
	);
}

export default function TimelineClipContextMenu({
	open,
	position,
	scene,
	layer,
	playheadTime,
	hasClipboard,
	onClose,
	onSplit,
	onDuplicate,
	onCopy,
	onPaste,
	onToggleVisible,
	onToggleLock,
	onToggleMute,
	onBringToFront,
	onSendToBack,
	onDelete,
}) {
	const hasLayer = Boolean(layer);
	const canSplit =
		hasLayer &&
		scene &&
		(() => {
			const start = layer.startTime || 0;
			const end = start + getLayerClipDuration(layer, scene.duration);
			return playheadTime > start + 0.25 && playheadTime < end - 0.25;
		})();

	const isVisible = layer?.visible !== false;
	const isLocked = Boolean(layer?.locked);
	const canMute = layer?.type === "video" || layer?.type === "audio";
	const isMuted =
		layer?.type === "video" || layer?.type === "audio"
			? Boolean(layer?.data?.muted)
			: false;

	const layerCount = scene?.layers?.length ?? 0;
	const canReorder = hasLayer && layerCount > 1;

	const run = (fn) => {
		fn?.();
		onClose();
	};

	if (!open) return null;

	return (
		<DropdownMenu open={open} onOpenChange={(next) => !next && onClose()}>
			<DropdownMenuTrigger asChild>
				<span
					className="fixed z-[100] h-px w-px opacity-0"
					style={{ left: position.x, top: position.y }}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-[13.5rem] border-2 p-1"
				align="start"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				<DropdownMenuLabel>{hasLayer ? "Clip" : "Timeline"}</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{hasLayer && (
					<>
						<MenuRow
							icon={Scissors}
							label="Cut at playhead"
							disabled={!canSplit}
							onAction={() => run(() => onSplit?.(layer.id, playheadTime))}
						/>
						<MenuRow
							icon={CopyPlus}
							label="Duplicate"
							shortcut="⌘D"
							onAction={() => run(() => onDuplicate?.(layer.id))}
						/>
						<MenuRow
							icon={Copy}
							label="Copy"
							shortcut="⌘C"
							onAction={() => run(() => onCopy?.(layer.id))}
						/>
					</>
				)}

				<MenuRow
					icon={ClipboardPaste}
					label="Paste"
					shortcut="⌘V"
					disabled={!hasClipboard}
					onAction={() => run(() => onPaste?.())}
				/>

				{hasLayer && (
					<>
						<DropdownMenuSeparator />
						<MenuRow
							icon={isVisible ? EyeOff : Eye}
							label={isVisible ? "Hide" : "Show"}
							onAction={() => run(() => onToggleVisible?.(layer.id))}
						/>
						<MenuRow
							icon={isLocked ? Unlock : Lock}
							label={isLocked ? "Unlock" : "Lock"}
							onAction={() => run(() => onToggleLock?.(layer.id))}
						/>
						{canMute && (
							<MenuRow
								icon={isMuted ? Volume2 : VolumeX}
								label={isMuted ? "Unmute" : "Mute"}
								onAction={() => run(() => onToggleMute?.(layer.id, !isMuted))}
							/>
						)}

						<DropdownMenuSeparator />
						<MenuRow
							icon={BringToFront}
							label="Bring to front"
							shortcut="⌘]"
							disabled={!canReorder}
							onAction={() => run(() => onBringToFront?.(layer.id))}
						/>
						<MenuRow
							icon={SendToBack}
							label="Send to back"
							shortcut="⌘["
							disabled={!canReorder}
							onAction={() => run(() => onSendToBack?.(layer.id))}
						/>

						<DropdownMenuSeparator />
						<MenuRow
							icon={Trash2}
							label="Delete"
							shortcut="⌫"
							destructive
							onAction={() => run(() => onDelete?.(layer.id))}
						/>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
