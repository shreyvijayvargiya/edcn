import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addLayer } from "@/lib/store/slices/videoEditorSlice";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { TEXT_PRESETS } from "@/lib/video-editor/textPresets";
import { SHAPE_PRESETS, ICON_COLOR_PRESETS } from "@/lib/video-editor/shapePresets";
import { DEFAULT_ICON } from "@/lib/video-editor/icons";

function openFilePicker(accept, onFile) {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;
	input.onchange = (e) => {
		const file = e.target.files?.[0];
		if (file) onFile(file);
	};
	input.click();
}

/** Shared add-layer actions for timeline add strips */
export function useTimelineLayerActions() {
	const dispatch = useAppDispatch();
	const { activeSceneId } = useAppSelector((s) => s.videoEditor);

	const add = useCallback(
		(payload, insertAt) => {
			if (!activeSceneId) return;
			dispatch(addLayer({ sceneId: activeSceneId, insertAt, ...payload }));
		},
		[dispatch, activeSceneId],
	);

	const addText = useCallback(
		(insertAt) => {
			const preset = TEXT_PRESETS.find((p) => p.isPlain) ?? TEXT_PRESETS[0];
			add(
				{
					type: "text",
					data: preset.layer,
					overrides: {
						y: CANVAS_HEIGHT / 2 - 50,
						width: CANVAS_WIDTH - 60,
						height: preset.layer.content.includes("\n") ? 100 : 80,
					},
				},
				insertAt,
			);
		},
		[add],
	);

	const addShape = useCallback(
		(insertAt) => {
			const preset = SHAPE_PRESETS[0];
			add(
				{
					type: "shape",
					data: preset.data,
					overrides: {
						x: (CANVAS_WIDTH - preset.size.width) / 2,
						y: (CANVAS_HEIGHT - preset.size.height) / 2,
						width: preset.size.width,
						height: preset.size.height,
					},
				},
				insertAt,
			);
		},
		[add],
	);

	const addIcon = useCallback(
		(insertAt) => {
			add(
				{
					type: "icon",
					data: { icon: DEFAULT_ICON, fill: ICON_COLOR_PRESETS[0], fontSize: 48 },
					overrides: {
						x: CANVAS_WIDTH / 2 - 30,
						y: CANVAS_HEIGHT / 2 - 30,
					},
				},
				insertAt,
			);
		},
		[add],
	);

	const uploadImage = useCallback(
		(insertAt) => {
			openFilePicker("image/*", (file) => {
				const url = URL.createObjectURL(file);
				add({ type: "image", data: { src: url } }, insertAt);
			});
		},
		[add],
	);

	return {
		activeSceneId,
		addText,
		addShape,
		addIcon,
		uploadImage,
	};
}
