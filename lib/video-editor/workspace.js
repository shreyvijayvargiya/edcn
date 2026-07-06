import { createDefaultProject } from "./defaults";

const STORAGE_KEY = "edcn-workspace";

export const DEMO_USER = {
	name: "Alex Rivera",
	email: "alex@example.com",
	createdAt: "2024-06-15T10:00:00.000Z",
	initials: "AR",
};

const DEMO_PROJECTS = [
	{
		id: "demo-welcome-reel",
		name: "Welcome reel",
		createdAt: "2025-11-02T09:30:00.000Z",
		updatedAt: "2026-01-18T14:20:00.000Z",
		isDemo: true,
	},
	{
		id: "demo-product-story",
		name: "Product story — Q1",
		createdAt: "2025-12-10T11:00:00.000Z",
		updatedAt: "2026-02-28T16:45:00.000Z",
		isDemo: true,
	},
	{
		id: "demo-social-clips",
		name: "Social clips pack",
		createdAt: "2026-01-05T08:15:00.000Z",
		updatedAt: "2026-03-22T10:05:00.000Z",
		isDemo: true,
	},
];

function readRaw() {
	if (typeof window === "undefined") return { projects: [] };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : { projects: [] };
	} catch {
		return { projects: [] };
	}
}

function writeRaw(data) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		/* ignore quota */
	}
}

export function listWorkspaceProjects() {
	const stored = readRaw().projects ?? [];
	const demoIds = new Set(DEMO_PROJECTS.map((p) => p.id));
	const userProjects = stored.filter((p) => !demoIds.has(p.id));
	return [...DEMO_PROJECTS, ...userProjects].sort(
		(a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
	);
}

export function upsertWorkspaceProject(project) {
	if (!project?.id) return;
	const data = readRaw();
	const now = new Date().toISOString();
	const entry = {
		id: project.id,
		name: project.name || "Untitled video",
		createdAt: project.createdAt || now,
		updatedAt: now,
		project: JSON.parse(JSON.stringify(project)),
	};
	const idx = data.projects.findIndex((p) => p.id === project.id);
	if (idx === -1) {
		data.projects.push(entry);
	} else {
		data.projects[idx] = { ...data.projects[idx], ...entry };
	}
	writeRaw(data);
}

export function getWorkspaceProject(id) {
	if (!id) return null;
	const demo = DEMO_PROJECTS.find((p) => p.id === id);
	if (demo) {
		const project = createDefaultProject();
		project.id = demo.id;
		project.name = demo.name;
		project.createdAt = demo.createdAt;
		return project;
	}
	const stored = readRaw().projects?.find((p) => p.id === id);
	return stored?.project ?? null;
}

export function formatWorkspaceDate(iso) {
	if (!iso) return "—";
	try {
		return new Intl.DateTimeFormat(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}
