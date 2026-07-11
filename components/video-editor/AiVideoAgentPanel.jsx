import { useCallback, useEffect, useRef, useState } from "react";
import {
	ArrowLeft,
	History,
	KeyRound,
	Loader2,
	MessageSquarePlus,
	Send,
	Sparkles,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { loadProject } from "@/lib/store/slices/videoEditorSlice";
import { mapAiProjectToEditor } from "@/lib/video-editor/ai/mapAiProject";
import { buildCompactProjectContext } from "@/lib/video-editor/ai/buildProjectContext";
import { prepareMediaAttachments } from "@/lib/video-editor/ai/prepareMediaAttachments";
import { callVideoAgent } from "@/lib/video-editor/ai/videoAgentClient";
import {
	getStoredApiKey,
	setStoredApiKey,
} from "@/lib/video-editor/ai/openRouterConfig";
import {
	chatTitleFromMessages,
	createChat,
	loadChatStore,
	saveChatStore,
} from "@/lib/video-editor/ai/chatStorage";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

function summarizeProposal(project, preview) {
	if (preview?.sceneCount != null) {
		return `${preview.sceneCount} scene${preview.sceneCount !== 1 ? "s" : ""} · ${preview.layerCount} layer${preview.layerCount !== 1 ? "s" : ""}`;
	}
	if (!project?.scenes) return "";
	const sceneCount = project.scenes.length;
	const layerCount = project.scenes.reduce((n, s) => n + (s.layers?.length ?? 0), 0);
	return `${sceneCount} scene${sceneCount !== 1 ? "s" : ""} · ${layerCount} layer${layerCount !== 1 ? "s" : ""}`;
}

function formatChatDate(ts) {
	try {
		return new Date(ts).toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return "";
	}
}

export default function AiVideoAgentPanel() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId } = useAppSelector((s) => s.videoEditor);
	const { setTheme } = useTheme();

	const [store, setStore] = useState(() => loadChatStore());
	const [showHistory, setShowHistory] = useState(false);
	const [showKeySettings, setShowKeySettings] = useState(false);
	const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
	const [clientKey, setClientKey] = useState(() => getStoredApiKey());
	const [serverConfigured, setServerConfigured] = useState(false);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [pending, setPending] = useState(null);
	const scrollRef = useRef(null);

	const hasApiKey = serverConfigured || Boolean(clientKey);

	useEffect(() => {
		let cancelled = false;
		fetch("/api/ai/status")
			.then((r) => r.json())
			.then((data) => {
				if (!cancelled) setServerConfigured(Boolean(data?.configured));
			})
			.catch(() => {
				if (!cancelled) setServerConfigured(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const activeChat =
		store.chats.find((c) => c.id === store.activeChatId) ?? store.chats[0];
	const messages = activeChat?.messages ?? [];

	const updateActiveChat = useCallback((patch) => {
		setStore((prev) => {
			const next = {
				...prev,
				chats: prev.chats.map((c) =>
					c.id === prev.activeChatId
						? { ...c, ...patch, updatedAt: Date.now() }
						: c,
				),
			};
			saveChatStore(next);
			return next;
		});
	}, []);

	const scrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
		});
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages.length, pending, scrollToBottom]);

	const inferMode = useCallback(() => {
		const hasContent = project.scenes?.some((s) => (s.layers?.length ?? 0) > 0);
		const userTurns = messages.filter((m) => m.role === "user").length;
		return hasContent || userTurns > 1 ? "edit" : "create";
	}, [project, messages]);

	const saveApiKey = () => {
		const next = apiKeyInput.trim();
		setStoredApiKey(next);
		setClientKey(next);
		setShowKeySettings(false);
		setError(null);
	};

	const sendMessage = async () => {
		const text = input.trim();
		if (!text || loading) return;

		if (!serverConfigured && !getStoredApiKey()) {
			setShowKeySettings(true);
			setError("Add an OpenRouter API key (server .env or paste below) to continue.");
			return;
		}

		const userMsg = { id: `u-${Date.now()}`, role: "user", content: text };
		const convo = [...messages.filter((m) => m.id !== "welcome"), userMsg];
		const mode = inferMode();

		updateActiveChat({
			messages: [...messages.filter((m) => m.id !== "welcome"), userMsg],
			title: chatTitleFromMessages(convo),
		});
		setInput("");
		setError(null);
		setLoading(true);
		setPending(null);

		try {
			const { json } = buildCompactProjectContext(project, { activeSceneId, mode });
			const origin = window.location.origin;
			const { attachments, mediaNotes } = await prepareMediaAttachments(project, {
				activeSceneId,
				origin,
			});

			const data = await callVideoAgent({
				mode,
				messages: convo.map((m) => ({ role: m.role, content: m.content })),
				projectContextJson: json,
				mediaAttachments: attachments,
				mediaNotes,
			});

			const assistantMsg = {
				id: `a-${Date.now()}`,
				role: "assistant",
				content: data.message,
			};

			updateActiveChat({ messages: [...convo, assistantMsg] });
			setPending({
				project: data.project,
				theme: data.theme,
				mode: data.mode ?? mode,
				summary: summarizeProposal(data.project, data.preview),
			});
		} catch (err) {
			setError(err?.message ?? "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const approvePending = () => {
		if (!pending?.project) return;
		const { project: nextProject, themeMode } = mapAiProjectToEditor(pending.project, {
			themeMode: pending.theme?.mode,
			mergeWith: project,
		});
		dispatch(loadProject(nextProject));
		if (themeMode === "dark" || themeMode === "light") {
			setTheme(themeMode);
		}
		updateActiveChat({
			messages: [
				...messages,
				{
					id: `sys-${Date.now()}`,
					role: "assistant",
					content: `Applied to timeline — ${pending.summary}. Ask me to refine any scene.`,
				},
			],
		});
		setPending(null);
	};

	const dismissPending = () => {
		setPending(null);
		updateActiveChat({
			messages: [
				...messages,
				{
					id: `sys-${Date.now()}`,
					role: "assistant",
					content: "Draft dismissed. Describe another change when ready.",
				},
			],
		});
	};

	const startNewChat = () => {
		const chat = createChat();
		setStore((prev) => {
			const next = { activeChatId: chat.id, chats: [chat, ...prev.chats] };
			saveChatStore(next);
			return next;
		});
		setShowHistory(false);
		setPending(null);
		setError(null);
		setInput("");
	};

	const selectChat = (id) => {
		setStore((prev) => {
			const next = { ...prev, activeChatId: id };
			saveChatStore(next);
			return next;
		});
		setShowHistory(false);
		setPending(null);
		setError(null);
	};

	const deleteChat = (id, e) => {
		e.stopPropagation();
		setStore((prev) => {
			const remaining = prev.chats.filter((c) => c.id !== id);
			if (remaining.length === 0) {
				const chat = createChat();
				const next = { activeChatId: chat.id, chats: [chat] };
				saveChatStore(next);
				return next;
			}
			const next = {
				activeChatId: prev.activeChatId === id ? remaining[0].id : prev.activeChatId,
				chats: remaining,
			};
			saveChatStore(next);
			return next;
		});
	};

	return (
		<div className="flex flex-col h-full min-h-0 bg-card">
			<div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b-2 border-border bg-muted/20">
				{showHistory ? (
					<>
						<button
							type="button"
							onClick={() => setShowHistory(false)}
							className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted"
							title="Back to chat"
						>
							<ArrowLeft className="h-4 w-4" />
						</button>
						<p className="text-sm font-bold text-foreground flex-1">Chat history</p>
						<Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={startNewChat}>
							<MessageSquarePlus className="h-3.5 w-3.5" />
							New chat
						</Button>
					</>
				) : (
					<>
						<div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
							<Sparkles className="h-4 w-4 text-primary" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-bold text-foreground truncate">AI Agent</p>
							<p className="text-[10px] text-muted-foreground truncate">
								{inferMode() === "edit" ? "Edit mode · sees your timeline" : "Create mode"}
								{!hasApiKey ? " · key required" : serverConfigured ? " · server key" : " · local key"}
							</p>
						</div>
						<button
							type="button"
							onClick={() => setShowKeySettings((v) => !v)}
							className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
							title="API key settings"
						>
							<KeyRound className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => setShowHistory(true)}
							className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
							title="Chat history"
						>
							<History className="h-4 w-4" />
						</button>
					</>
				)}
			</div>

			{showHistory ? (
				<div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
					{store.chats.map((chat) => {
						const isActive = chat.id === store.activeChatId;
						const count = chat.messages?.filter((m) => m.role === "user").length ?? 0;
						return (
							<div
								key={chat.id}
								role="button"
								tabIndex={0}
								onClick={() => selectChat(chat.id)}
								onKeyDown={(e) => e.key === "Enter" && selectChat(chat.id)}
								className={cn(
									"w-full flex items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-colors cursor-pointer",
									isActive
										? "border-primary/50 bg-primary/5"
										: "border-border hover:border-primary/30 hover:bg-muted/40",
								)}
							>
								<div className="min-w-0 flex-1">
									<p className="text-xs font-semibold text-foreground truncate">
										{chat.title || "New chat"}
									</p>
									<p className="text-[10px] text-muted-foreground mt-0.5">
										{count} message{count !== 1 ? "s" : ""} · {formatChatDate(chat.updatedAt)}
									</p>
								</div>
								<button
									type="button"
									onClick={(e) => deleteChat(chat.id, e)}
									className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									title="Delete chat"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>
						);
					})}
				</div>
			) : (
				<>
					{showKeySettings && (
						<div className="shrink-0 border-b-2 border-border p-3 space-y-2 bg-muted/10">
							<p className="text-xs font-semibold text-foreground">OpenRouter API key</p>
							<p className="text-[10px] text-muted-foreground leading-relaxed">
								Preferred: set <code className="text-foreground">OPENROUTER_API_KEY</code> in{" "}
								<code className="text-foreground">.env.local</code> (server-only). Or paste a key
								here for local BYOK — it is sent only to this app&apos;s{" "}
								<code className="text-foreground">/api/ai/chat</code> proxy.
							</p>
							{serverConfigured && (
								<p className="text-[10px] text-primary">Server key detected — paste is optional.</p>
							)}
							<Input
								type="password"
								value={apiKeyInput}
								onChange={(e) => setApiKeyInput(e.target.value)}
								placeholder="sk-or-…"
								className="h-8 text-xs"
							/>
							<div className="flex gap-2">
								<Button size="sm" className="h-8 text-xs flex-1" onClick={saveApiKey}>
									Save key
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="h-8 text-xs"
									onClick={() => {
										setApiKeyInput("");
										setStoredApiKey("");
										setClientKey("");
										setShowKeySettings(false);
									}}
								>
									Clear
								</Button>
							</div>
						</div>
					)}

					<div
						ref={scrollRef}
						className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2"
					>
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={cn(
									"rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[92%]",
									msg.role === "user"
										? "ml-auto bg-primary text-primary-foreground"
										: "mr-auto bg-muted border border-border text-foreground",
								)}
							>
								{msg.content}
							</div>
						))}

						{loading && (
							<div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
								<Loader2 className="h-4 w-4 animate-spin" />
								Reading project & planning…
							</div>
						)}

						{error && (
							<div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
								{error}
							</div>
						)}

						{pending && (
							<div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3 space-y-2">
								<div className="flex items-center gap-1.5">
									<Sparkles className="h-4 w-4 text-primary" />
									<p className="text-xs font-bold text-foreground">Ready to apply</p>
								</div>
								<p className="text-[11px] text-muted-foreground">{pending.summary}</p>
								<p className="text-[10px] text-muted-foreground">
									{pending.mode === "edit" ? "Merges with your media & scene ids" : "Replaces timeline"}
								</p>
								<div className="flex gap-2">
									<Button size="sm" className="h-8 text-xs flex-1" onClick={approvePending}>
										Approve & update
									</Button>
									<Button size="sm" variant="outline" className="h-8 text-xs" onClick={dismissPending}>
										Dismiss
									</Button>
								</div>
							</div>
						)}
					</div>

					<div className="shrink-0 border-t-2 border-border p-3 space-y-2 bg-card">
						<Textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									sendMessage();
								}
							}}
							placeholder="Create or refine your video…"
							rows={3}
							className="text-xs resize-none min-h-[72px]"
							disabled={loading}
						/>
						<Button
							size="sm"
							className="w-full h-9 gap-2 text-xs"
							onClick={sendMessage}
							disabled={loading || !input.trim()}
						>
							<Send className="h-3.5 w-3.5" />
							Send
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
