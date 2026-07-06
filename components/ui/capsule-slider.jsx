import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function formatDefaultValue(value, step) {
	if (step != null && step < 1) {
		const decimals = step >= 0.1 ? 1 : 2;
		return String(Number(Number(value).toFixed(decimals)));
	}
	return String(Math.round(value));
}

const CapsuleSlider = React.forwardRef(
	(
		{
			className,
			label,
			value,
			min = 0,
			max = 100,
			step = 1,
			onChange,
			formatValue,
			...props
		},
		ref
	) => {
		const display =
			formatValue?.(value) ?? formatDefaultValue(value, step);

		return (
			<div
				className={cn(
					"relative h-8 w-full overflow-hidden rounded-full border-2 border-border bg-card shadow-sm",
					className
				)}
			>
				<SliderPrimitive.Root
					ref={ref}
					className="absolute inset-0 flex touch-none select-none items-stretch"
					value={[value]}
					min={min}
					max={max}
					step={step}
					onValueChange={([next]) => onChange?.(next)}
					{...props}
				>
					<SliderPrimitive.Track className="relative h-full w-full grow bg-transparent">
						<SliderPrimitive.Range
							className={cn(
								"absolute h-full rounded-l-full bg-zinc-200 dark:bg-zinc-700",
								value > min && "border-r border-zinc-100 dark:border-zinc-500",
							)}
						/>
					</SliderPrimitive.Track>
					<SliderPrimitive.Thumb
						aria-label={label}
						className="block h-full w-px bg-transparent opacity-0 focus-visible:outline-none focus-visible:ring-0"
					/>
				</SliderPrimitive.Root>

				<div
					className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-4"
					aria-hidden
				>
					<span className="text-sm font-medium text-foreground">{label}</span>
					<span className="text-sm font-medium tabular-nums text-foreground">
						{display}
					</span>
				</div>
			</div>
		);
	}
);
CapsuleSlider.displayName = "CapsuleSlider";

export { CapsuleSlider };
