export function uid(prefix = "id") {
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function findScene(project, sceneId) {
	return project?.scenes?.find((s) => s.id === sceneId) ?? null;
}

export function findLayer(scene, layerId) {
	return scene?.layers?.find((l) => l.id === layerId) ?? null;
}

export function downloadJson(data, filename = "project.json") {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
