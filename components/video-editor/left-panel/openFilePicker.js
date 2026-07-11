export function openFilePicker(accept, onFile) {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;
	input.onchange = (e) => {
		const file = e.target.files?.[0];
		if (file) onFile(file);
	};
	input.click();
}
