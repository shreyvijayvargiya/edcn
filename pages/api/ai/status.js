/** Reports whether the server has an OpenRouter key configured (never exposes the key). */

export default function handler(req, res) {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		return res.status(405).json({ error: "Method not allowed" });
	}

	return res.status(200).json({
		configured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
		model:
			process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.0-flash-001",
	});
}
