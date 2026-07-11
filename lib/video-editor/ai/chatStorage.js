const STORAGE_KEY = "edcn-ai-chats";

function defaultWelcome() {
	return {
		id: "welcome",
		role: "assistant",
		content:
			"Describe or refine your video — I'll plan scenes, layers, animations, and styling. Approve before the timeline updates.",
	};
}

export function createChat(title = "New chat") {
	const now = Date.now();
	return {
		id: `chat-${now}`,
		title,
		createdAt: now,
		updatedAt: now,
		messages: [defaultWelcome()],
	};
}

export function loadChatStore() {
	if (typeof window === "undefined") {
		return { activeChatId: null, chats: [createChat()] };
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			const initial = createChat();
			return { activeChatId: initial.id, chats: [initial] };
		}
		const parsed = JSON.parse(raw);
		if (!parsed?.chats?.length) {
			const initial = createChat();
			return { activeChatId: initial.id, chats: [initial] };
		}
		return {
			activeChatId: parsed.activeChatId ?? parsed.chats[0].id,
			chats: parsed.chats,
		};
	} catch {
		const initial = createChat();
		return { activeChatId: initial.id, chats: [initial] };
	}
}

export function saveChatStore(store) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
	} catch {
		/* quota */
	}
}

export function chatTitleFromMessages(messages) {
	const firstUser = messages.find((m) => m.role === "user" && m.id !== "welcome");
	if (!firstUser?.content) return "New chat";
	return firstUser.content.slice(0, 42) + (firstUser.content.length > 42 ? "…" : "");
}
