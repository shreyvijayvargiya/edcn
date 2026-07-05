import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addLayer } from "@/lib/store/slices/videoEditorSlice";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/video-editor/constants";
import { TEXT_PRESETS } from "@/lib/video-editor/textPresets";
import { SHAPE_PRESETS, ICON_COLOR_PRESETS } from "@/lib/video-editor/shapePresets";
import { DEFAULT_ICON } from "@/lib/video-editor/icons";
import { getMediaDuration, roundMediaDuration } from "@/lib/video-editor/media";

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
	const { activeSceneId, project } = useAppSelector((s) => s.videoEditor);
	const canvasW = project.canvas?.width ?? CANVAS_WIDTH;
	const canvasH = project.canvas?.height ?? CANVAS_HEIGHT;

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

	const uploadVideo = useCallback(
		(insertAt) => {
			openFilePicker("video/*", async (file) => {
				const url = URL.createObjectURL(file);
				try {
					const rawDuration = await getMediaDuration(url, "video");
					const mediaDuration = roundMediaDuration(rawDuration);
					add(
						{
							type: "video",
							mediaDuration,
							data: {
								src: url,
								label: file.name,
								mediaDuration,
								muted: false,
								volume: 1,
							},
							overrides: { x: 0, y: 0, width: canvasW, height: canvasH },
						},
						insertAt,
					);
				} catch {
					add(
						{
							type: "video",
							data: { src: url, label: file.name, muted: false, volume: 1 },
							overrides: { x: 0, y: 0, width: canvasW, height: canvasH },
						},
						insertAt,
					);
				}
			});
		},
		[add, canvasW, canvasH],
	);

	const uploadAudio = useCallback(
		(insertAt) => {
			openFilePicker("audio/*", async (file) => {
				const url = URL.createObjectURL(file);
				try {
					const rawDuration = await getMediaDuration(url, "audio");
					const mediaDuration = roundMediaDuration(rawDuration);
					add(
						{
							type: "audio",
							mediaDuration,
							data: { src: url, label: file.name, mediaDuration },
						},
						insertAt,
					);
				} catch {
					add({ type: "audio", data: { src: url, label: file.name } }, insertAt);
				}
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
		uploadVideo,
		uploadAudio,
	};
}
