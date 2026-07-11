export function buildOpenRouterMessages({
	system,
	projectContextJson,
	mode,
	messages,
	mediaAttachments = [],
	mediaNotes = [],
}) {
	const out = [{ role: "system", content: system }];

	if (projectContextJson) {
		out.push({
			role: "user",
			content: `Current project snapshot (${mode} mode). Use this to edit or extend:\n\`\`\`json\n${projectContextJson}\n\`\`\``,
		});
		out.push({
			role: "assistant",
			content: JSON.stringify({
				message: "I have the project context. Tell me what to create or improve.",
			}),
		});
	}

	const trimmed = messages.slice(-10);
	for (let i = 0; i < trimmed.length; i++) {
		const m = trimmed[i];
		const isLastUser = m.role === "user" && i === trimmed.length - 1;

		if (isLastUser && (mediaAttachments.length > 0 || mediaNotes.length > 0)) {
			const parts = [{ type: "text", text: m.content }];
			if (mediaNotes.length > 0) {
				parts[0].text += `\n\nProject media references:\n${JSON.stringify(mediaNotes)}`;
			}
			for (const att of mediaAttachments.slice(0, 5)) {
				if (att.url) {
					parts.push({ type: "image_url", image_url: { url: att.url } });
				}
			}
			out.push({ role: "user", content: parts });
		} else {
			out.push({
				role: m.role === "assistant" ? "assistant" : "user",
				content: m.content,
			});
		}
	}

	return out;
}
