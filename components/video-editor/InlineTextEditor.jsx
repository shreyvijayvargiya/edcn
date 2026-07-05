import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { updateLayerData, updateLayer } from "@/lib/store/slices/videoEditorSlice";
import { getInlineTextareaStyle, estimateTextLayerHeight } from "@/lib/video-editor/inlineTextEdit";

export default function InlineTextEditor({
	layer,
	nodeRef,
	stageScale,
	sceneId,
	onClose,
}) {
	const dispatch = useAppDispatch();
	const textareaRef = useRef(null);
	const committedRef = useRef(false);

	const commit = useCallback(() => {
		if (committedRef.current) return;
		committedRef.current = true;

		const value = textareaRef.current?.value ?? layer.data?.content ?? "";
		dispatch(
			updateLayerData({
				sceneId,
				layerId: layer.id,
				data: { content: value },
			}),
		);

		const nextHeight = estimateTextLayerHeight(value, layer, stageScale);
		if (nextHeight > (layer.height ?? 0) * 0.9) {
			dispatch(
				updateLayer({
					sceneId,
					layerId: layer.id,
					changes: { height: nextHeight },
				}),
			);
		}

		onClose();
	}, [dispatch, sceneId, layer, stageScale, onClose]);

	const cancel = useCallback(() => {
		if (committedRef.current) return;
		committedRef.current = true;
		onClose();
	}, [onClose]);

	useEffect(() => {
		const ta = textareaRef.current;
		if (!ta) return;

		ta.focus();
		const len = ta.value.length;
		ta.setSelectionRange(len, len);

		const syncHeight = () => {
			ta.style.height = "0px";
			ta.style.height = `${Math.max(ta.scrollHeight, parseFloat(ta.style.minHeight) || 0)}px`;
		};
		syncHeight();
		ta.addEventListener("input", syncHeight);
		return () => ta.removeEventListener("input", syncHeight);
	}, []);

	useEffect(() => {
		const ta = textareaRef.current;
		if (!ta) return;

		const onKeyDown = (e) => {
			e.stopPropagation();
			if (e.key === "Escape") {
				e.preventDefault();
				cancel();
			} else if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				commit();
			}
		};

		ta.addEventListener("keydown", onKeyDown);
		return () => ta.removeEventListener("keydown", onKeyDown);
	}, [commit, cancel]);

	const node = nodeRef?.current ?? nodeRef;
	const style = getInlineTextareaStyle(layer, node, stageScale);
	if (!style) return null;

	return (
		<textarea
			ref={textareaRef}
			defaultValue={layer.data?.content ?? ""}
			className="absolute p-1 m-0 border-2 border-primary rounded-sm bg-white/95 text-foreground resize-none overflow-hidden outline-none shadow-md ring-2 ring-primary/20"
			style={style}
			onBlur={() => commit()}
			onMouseDown={(e) => e.stopPropagation()}
			onClick={(e) => e.stopPropagation()}
			spellCheck
			aria-label="Edit text on canvas"
		/>
	);
}
