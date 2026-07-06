import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	BACKGROUND_GRADIENT_PRESETS,
	backgroundGradientPresetCss,
} from "@/lib/video-editor/backgroundGradientPresets";
import { cn } from "@/lib/utils";

export default function BackgroundGradientSelect({ value, onChange }) {
	const selected = BACKGROUND_GRADIENT_PRESETS.find((p) => p.id === value);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="w-full h-10 px-2.5 justify-between gap-2"
				>
					<span className="flex items-center gap-2 min-w-0">
						{selected ? (
							<>
								<span
									className="h-6 w-10 shrink-0 rounded-sm border-2 border-border"
									style={{ background: backgroundGradientPresetCss(selected) }}
								/>
								<span className="truncate text-xs font-medium">
									{selected.label}
								</span>
							</>
						) : (
							<span className="text-xs text-muted-foreground">
								Choose gradient…
							</span>
						)}
					</span>
					<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-72 overflow-y-auto p-1"
			>
				{BACKGROUND_GRADIENT_PRESETS.map((preset) => {
					const active = preset.id === value;
					return (
						<DropdownMenuItem
							key={preset.id}
							className={cn(
								"flex flex-col items-stretch gap-1.5 p-2 cursor-pointer",
								active && "bg-primary/10",
							)}
							onSelect={() => onChange(preset.id)}
						>
							<span
								className="h-8 w-full rounded-sm border-2 border-border"
								style={{ background: backgroundGradientPresetCss(preset) }}
							/>
							<span className="flex items-center justify-between gap-2 text-xs">
								<span
									className={cn(
										"truncate font-medium",
										active && "text-primary",
									)}
								>
									{preset.label}
								</span>
								{active ? (
									<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
								) : null}
							</span>
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
