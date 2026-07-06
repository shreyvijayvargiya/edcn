import { ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

/**
 * Grouped animation preset dropdown for the video editor property panel.
 * @param {{ label: string, options: { id: string, label: string, description?: string }[] }[]} groups
 */
export default function EditorAnimationDropdown({
	label,
	value,
	onChange,
	groups = [],
	placeholder = "Select…",
	disabled = false,
	className,
}) {
	const allOptions = groups.flatMap((g) => g.options);
	const selected = allOptions.find((o) => o.id === value);

	return (
		<div className={cn("space-y-1.5", className)}>
			{label ? (
				<p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
					{label}
				</p>
			) : null}
			<DropdownMenu>
				<DropdownMenuTrigger asChild disabled={disabled}>
					<Button
						type="button"
						variant="outline"
						className="w-full h-9 px-2.5 justify-between text-xs font-medium"
					>
						<span className="truncate text-left">
							{selected?.label ?? placeholder}
						</span>
						<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-2" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-80 overflow-y-auto">
					{groups.map((group, groupIndex) => (
						<DropdownMenuGroup key={group.label}>
							{groupIndex > 0 && <DropdownMenuSeparator />}
							<DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
								{group.label}
							</DropdownMenuLabel>
							{group.options.map((opt) => {
								const active = opt.id === value;
								return (
									<DropdownMenuItem
										key={opt.id}
										className={cn(
											"flex flex-col items-start gap-0.5 py-2 cursor-pointer",
											active && "bg-secondary font-semibold",
										)}
										onSelect={() => onChange(opt.id)}
									>
										<span className="text-sm leading-none">{opt.label}</span>
										{opt.description ? (
											<span className="text-[10px] text-muted-foreground leading-snug font-normal">
												{opt.description}
											</span>
										) : null}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
