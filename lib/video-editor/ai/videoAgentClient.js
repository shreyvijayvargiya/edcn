import { buildVideoAgentSystemPrompt } from "./systemPrompt";
import { buildOpenRouterMessages } from "./buildOpenRouterMessages";
import { extractJsonFromModelText, mapAiProjectToEditor } from "./mapAiProject";
import { sanitizeAiProject } from "./sanitizeAiProject";
import { getOpenRouterConfig } from "./openRouterConfig";

export async function callVideoAgent({
	messages,
	mode = "create",
	projectContextJson,
	mediaAttachments = [],
	mediaNotes = [],
}) {
	const { apiKey, model } = getOpenRouterConfig();

	const system = buildVideoAgentSystemPrompt({ mode });
	const openRouterMessages = buildOpenRouterMessages({
		system,
		projectContextJson,
		mode,
		messages,
		mediaAttachments,
		mediaNotes,
	});

	const response = await fetch("/api/ai/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			messages: openRouterMessages,
			...(apiKey ? { apiKey } : {}),
			...(model ? { model } : {}),
		}),
	});

	const payload = await response.json();

	if (!response.ok) {
		const errMsg = payload?.error ?? payload?.message ?? "AI request failed";
		throw new Error(errMsg);
	}

	const raw = payload?.choices?.[0]?.message?.content ?? "";
	const parsed = extractJsonFromModelText(raw);

	if (!parsed?.project) {
		throw new Error("Model returned invalid JSON. Try again with a simpler prompt.");
	}

	const sanitized = sanitizeAiProject(parsed.project);
	// mapAiProjectToEditor also sanitizes; safe / idempotent for preview counts
	const { project: previewProject } = mapAiProjectToEditor(sanitized);

	return {
		message: parsed.message ?? "Video plan ready for your review.",
		project: sanitized,
		mode,
		preview: {
			sceneCount: previewProject.scenes.length,
			layerCount: previewProject.scenes.reduce((n, s) => n + s.layers.length, 0),
		},
		theme: sanitized?.theme ?? null,
	};
}