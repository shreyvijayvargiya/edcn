const KEY_STORAGE = "edcn-openrouter-key";

/** Optional BYOK key stored in localStorage (sent only to same-origin /api/ai/chat). */
export function getStoredApiKey() {
	if (typeof window === "undefined") return "";
	try {
		return localStorage.getItem(KEY_STORAGE) ?? "";
	} catch {
		return "";
	}
}

export function setStoredApiKey(key) {
	if (typeof window === "undefined") return;
	try {
		if (key) localStorage.setItem(KEY_STORAGE, key);
		else localStorage.removeItem(KEY_STORAGE);
	} catch {
		/* ignore */
	}
}

/**
 * Client-side config for the AI panel.
 * Server key lives in OPENROUTER_API_KEY — never NEXT_PUBLIC_*.
 */
export function getOpenRouterConfig() {
	return {
		apiKey: getStoredApiKey().trim(),
		model: process.env.NEXT_PUBLIC_OPENROUTER_MODEL?.trim() || "",
	};
}
