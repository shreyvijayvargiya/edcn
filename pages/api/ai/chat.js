/**
 * Proxies OpenRouter chat completions so the API key stays server-side.
 * Optional body.apiKey enables BYOK for local/dev without .env.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

function resolveApiKey(bodyKey) {
	const fromEnv = process.env.OPENROUTER_API_KEY?.trim();
	if (fromEnv) return fromEnv;
	const fromBody = typeof bodyKey === "string" ? bodyKey.trim() : "";
	return fromBody || "";
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		return res.status(405).json({ error: "Method not allowed" });
	}

	const {
		messages,
		model: bodyModel,
		apiKey: bodyApiKey,
		temperature = 0.55,
		max_tokens = 4096,
	} = req.body ?? {};

	if (!Array.isArray(messages) || messages.length === 0) {
		return res.status(400).json({ error: "messages array is required" });
	}

	const apiKey = resolveApiKey(bodyApiKey);
	if (!apiKey) {
		return res.status(401).json({
			error:
				"OpenRouter API key missing. Set OPENROUTER_API_KEY in .env.local or paste a key in the AI panel.",
		});
	}

	const model =
		(typeof bodyModel === "string" && bodyModel.trim()) ||
		process.env.OPENROUTER_MODEL?.trim() ||
		DEFAULT_MODEL;

	const siteUrl =
		process.env.OPENROUTER_SITE_URL?.trim() ||
		req.headers.origin ||
		`http://${req.headers.host || "localhost:3000"}`;

	try {
		const upstream = await fetch(OPENROUTER_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": siteUrl,
				"X-Title": process.env.OPENROUTER_APP_NAME?.trim() || "EDCN Video Editor",
			},
			body: JSON.stringify({
				model,
				messages,
				temperature,
				max_tokens,
				response_format: { type: "json_object" },
			}),
		});

		const payload = await upstream.json();

		if (!upstream.ok) {
			const errMsg =
				payload?.error?.message ?? payload?.message ?? "OpenRouter request failed";
			return res.status(upstream.status).json({ error: errMsg });
		}

		return res.status(200).json(payload);
	} catch (err) {
		return res.status(502).json({
			error: err?.message ?? "Failed to reach OpenRouter",
		});
	}
}
