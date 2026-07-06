import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/** Full-height vertical grip on the inner edge of a side panel (width resize). */
export function PanelVerticalResizeHandle({ edge, onResizeStart, onResize, className }) {
	const dragRef = useRef(null);

	const onPointerDown = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			const el = e.currentTarget;
			el.setPointerCapture(e.pointerId);
			dragRef.current = { x: e.clientX, start: onResizeStart() };

			const onPointerMove = (ev) => {
				if (!dragRef.current) return;
				const dx = ev.clientX - dragRef.current.x;
				const delta = edge === "right" ? dx : -dx;
				onResize(dragRef.current.start + delta);
			};

			const onPointerUp = (ev) => {
				el.releasePointerCapture(ev.pointerId);
				el.removeEventListener("pointermove", onPointerMove);
				el.removeEventListener("pointerup", onPointerUp);
				el.removeEventListener("pointercancel", onPointerUp);
				dragRef.current = null;
			};

			el.addEventListener("pointermove", onPointerMove);
			el.addEventListener("pointerup", onPointerUp);
			el.addEventListener("pointercancel", onPointerUp);
		},
		[edge, onResize, onResizeStart],
	);

	return (
		<div
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize panel width"
			className={cn(
				"absolute top-0 bottom-0 z-40 hidden md:flex w-4 cursor-col-resize items-center justify-center",
				edge === "right" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2",
				className,
			)}
			onPointerDown={onPointerDown}
		>
			<div
				className={cn(
					"h-[calc(100%-1.5rem)] w-px rounded-full bg-zinc-300",
					"transition-colors hover:bg-zinc-400 active:bg-primary/70",
					"dark:bg-zinc-600 dark:hover:bg-zinc-500",
				)}
			/>
		</div>
	);
}

/** Horizontal grip on the bottom edge of a side panel (height resize). */
export function PanelHorizontalResizeHandle({ onResizeStart, onResize, className }) {
	const dragRef = useRef(null);

	const onPointerDown = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			const el = e.currentTarget;
			el.setPointerCapture(e.pointerId);
			dragRef.current = { y: e.clientY, start: onResizeStart() };

			const onPointerMove = (ev) => {
				if (!dragRef.current) return;
				const dy = ev.clientY - dragRef.current.y;
				onResize(dragRef.current.start + dy);
			};

			const onPointerUp = (ev) => {
				el.releasePointerCapture(ev.pointerId);
				el.removeEventListener("pointermove", onPointerMove);
				el.removeEventListener("pointerup", onPointerUp);
				el.removeEventListener("pointercancel", onPointerUp);
				dragRef.current = null;
			};

			el.addEventListener("pointermove", onPointerMove);
			el.addEventListener("pointerup", onPointerUp);
			el.addEventListener("pointercancel", onPointerUp);
		},
		[onResize, onResizeStart],
	);

	return (
		<div
			role="separator"
			aria-orientation="horizontal"
			aria-label="Resize panel height"
			className={cn(
				"absolute left-0 right-0 bottom-0 z-40 hidden md:flex h-4 cursor-row-resize items-center justify-center",
				className,
			)}
			onPointerDown={onPointerDown}
		>
			<div
				className={cn(
					"w-[calc(100%-1.5rem)] h-px rounded-full bg-zinc-300",
					"transition-colors hover:bg-zinc-400 active:bg-primary/70",
					"dark:bg-zinc-600 dark:hover:bg-zinc-500",
				)}
			/>
		</div>
	);
}
