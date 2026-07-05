import { ChevronDown, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	groupFramePresets,
	resolveFramePreset,
} from "@/lib/video-editor/dimensions";
import { cn } from "@/lib/utils";

export default function FrameDimensionSelect({ canvas, onChange, disabled }) {
	const active = resolveFramePreset(canvas);
	const groups = groupFramePresets();
	const groupEntries = Object.entries(groups);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<Button
					variant="outline"
					size="sm"
					className={cn(
						"h-8 gap-1.5 px-2.5 text-xs font-semibold max-w-[180px] sm:max-w-[220px]",
						disabled && "opacity-50 pointer-events-none",
					)}
					title={`Frame size: ${active.sublabel}`}
				>
					<Monitor className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
					<span className="truncate">{active.label}</span>
					<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-auto" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				{groupEntries.map(([group, presets], groupIndex) => (
					<DropdownMenuGroup key={group}>
						{groupIndex > 0 && <DropdownMenuSeparator />}
						<DropdownMenuLabel>{group}</DropdownMenuLabel>
						{presets.map((preset) => {
							const selected = active.id === preset.id;
							return (
								<DropdownMenuItem
									key={preset.id}
									className={cn(
										"flex flex-col items-start gap-0.5 py-2 cursor-pointer",
										selected && "bg-secondary font-semibold",
									)}
									onSelect={() =>
										onChange({
											width: preset.width,
											height: preset.height,
											presetId: preset.id,
										})
									}
								>
									<span className="text-sm leading-none">{preset.label}</span>
									<span className="text-[10px] text-muted-foreground leading-none">
										{preset.sublabel}
									</span>
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuGroup>
				))}
				{active.id === "custom" && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuLabel>Custom</DropdownMenuLabel>
							<DropdownMenuItem disabled className="flex flex-col items-start gap-0.5 py-2">
								<span className="text-sm">{active.label}</span>
								<span className="text-[10px] text-muted-foreground">{active.sublabel}</span>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
