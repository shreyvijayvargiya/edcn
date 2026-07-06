import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "edcn-editor-panel-sizes";

export const PANEL_SIZE_LIMITS = {
	leftWidth: { min: 220, max: 520, default: 280 },
	rightWidth: { min: 220, max: 480, default: 264 },
	panelHeight: { min: 320, max: 900, default: null },
};

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function readStoredSizes() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function getDefaultHeight() {
	if (typeof window === "undefined") return 560;
	const toolbar = 64;
	const timeline = 288;
	const margin = 16;
	return Math.max(PANEL_SIZE_LIMITS.panelHeight.min, window.innerHeight - toolbar - timeline - margin);
}

export function useEditorPanelSizes() {
	const [leftWidth, setLeftWidth] = useState(PANEL_SIZE_LIMITS.leftWidth.default);
	const [rightWidth, setRightWidth] = useState(PANEL_SIZE_LIMITS.rightWidth.default);
	const [panelHeight, setPanelHeight] = useState(PANEL_SIZE_LIMITS.panelHeight.default);

	useEffect(() => {
		const stored = readStoredSizes();
		if (stored?.leftWidth) setLeftWidth(stored.leftWidth);
		if (stored?.rightWidth) setRightWidth(stored.rightWidth);
		if (stored?.panelHeight) setPanelHeight(stored.panelHeight);
		else setPanelHeight(getDefaultHeight());
	}, []);

	useEffect(() => {
		if (panelHeight == null) return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ leftWidth, rightWidth, panelHeight }),
		);
	}, [leftWidth, rightWidth, panelHeight]);

	const setLeftWidthClamped = useCallback((w) => {
		setLeftWidth(clamp(w, PANEL_SIZE_LIMITS.leftWidth.min, PANEL_SIZE_LIMITS.leftWidth.max));
	}, []);

	const setRightWidthClamped = useCallback((w) => {
		setRightWidth(clamp(w, PANEL_SIZE_LIMITS.rightWidth.min, PANEL_SIZE_LIMITS.rightWidth.max));
	}, []);

	const setPanelHeightClamped = useCallback((h) => {
		setPanelHeight(clamp(h, PANEL_SIZE_LIMITS.panelHeight.min, PANEL_SIZE_LIMITS.panelHeight.max));
	}, []);

	return {
		leftWidth,
		rightWidth,
		panelHeight: panelHeight ?? getDefaultHeight(),
		setLeftWidth: setLeftWidthClamped,
		setRightWidth: setRightWidthClamped,
		setPanelHeight: setPanelHeightClamped,
	};
}
