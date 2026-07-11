import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 40;

/**
 * Live mic waveform — rounded bars driven by Web Audio analyser.
 * Falls back to a gentle idle animation when inactive.
 */
export default function AudioWaveform({ analyser, active = false, className }) {
	const barsRef = useRef([]);
	const rafRef = useRef(null);
	const phaseRef = useRef(0);

	useEffect(() => {
		const data = new Uint8Array(analyser?.frequencyBinCount ?? 128);

		const tick = () => {
			phaseRef.current += 0.08;
			const bars = barsRef.current;

			if (active && analyser) {
				analyser.getByteFrequencyData(data);
				for (let i = 0; i < BAR_COUNT; i += 1) {
					const idx = Math.floor((i / BAR_COUNT) * data.length);
					const level = data[idx] / 255;
					const h = 6 + level * 44;
					if (bars[i]) bars[i].style.height = `${h}px`;
				}
			} else {
				for (let i = 0; i < BAR_COUNT; i += 1) {
					const wave = Math.sin(phaseRef.current + i * 0.35) * 0.5 + 0.5;
					const h = 8 + wave * 10;
					if (bars[i]) bars[i].style.height = `${h}px`;
				}
			}

			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [analyser, active]);

	return (
		<div
			className={cn(
				"flex h-14 w-full max-w-sm items-center justify-center gap-[3px] px-2",
				className,
			)}
			aria-hidden
		>
			{Array.from({ length: BAR_COUNT }).map((_, i) => (
				<div
					key={i}
					ref={(el) => {
						barsRef.current[i] = el;
					}}
					className={cn(
						"w-[3px] shrink-0 rounded-full transition-[height] duration-75",
						active
							? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.45)]"
							: "bg-muted-foreground/25",
					)}
					style={{ height: "10px" }}
				/>
			))}
		</div>
	);
}
