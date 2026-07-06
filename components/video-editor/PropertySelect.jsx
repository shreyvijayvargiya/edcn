import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Flat option list dropdown for the property panel.
 * @param {{ value: string|number, label: string }[]} options
 */
export default function PropertySelect({
	value,
	onChange,
	options,
	placeholder = "Select…",
	disabled = false,
	className,
}) {
	const selected = options.find((o) => o.value === value);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<Button
					type="button"
					variant="outline"
					className={cn(
						"w-full h-9 px-2.5 justify-between text-xs font-medium",
						className,
					)}
				>
					<span className="truncate text-left">{selected?.label ?? placeholder}</span>
					<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-2" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto"
			>
				{options.map((opt) => {
					const active = opt.value === value;
					return (
						<DropdownMenuItem
							key={String(opt.value)}
							className={cn(
								"flex items-center justify-between gap-2 text-xs cursor-pointer",
								active && "bg-primary/10 font-semibold text-primary",
							)}
							onSelect={() => onChange(opt.value)}
						>
							<span className="truncate">{opt.label}</span>
							{active ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
