import { useRef, useCallback } from "react";

export default function useDragResize(onEnd) {
	const startRef = useRef(null);

	const onPointerDown = useCallback(
		(e, initial) => {
			e.stopPropagation();
			e.preventDefault();
			startRef.current = { x: e.clientX, ...initial };
			const onUp = (ev) => {
				const dx = ev.clientX - startRef.current.x;
				onEnd(dx, startRef.current);
				window.removeEventListener("pointerup", onUp);
				startRef.current = null;
			};
			window.addEventListener("pointerup", onUp);
		},
		[onEnd],
	);

	return onPointerDown;
}
