import { useMemo, useState } from "react";
import { Copy, MoreHorizontal, Pencil, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { deleteLayer, selectLayer, setActiveScene, updateLayerData } from "@/lib/store/slices/videoEditorSlice";
import {
	assetRenamePatch,
	collectProjectAssets,
} from "@/lib/video-editor/projectAssets";
import { cn } from "@/lib/utils";

function AssetRow({ asset, onRename, onDelete, onCopy, onSelect }) {
	const [renaming, setRenaming] = useState(false);
	const [draft, setDraft] = useState(asset.name);

	const commitRename = () => {
		const next = draft.trim();
		if (next && next !== asset.name) {
			onRename(next);
		} else {
			setDraft(asset.name);
		}
		setRenaming(false);
	};

	const startRename = () => {
		setDraft(asset.name);
		setRenaming(true);
	};

	return (
		<div
			className={cn(
				"group flex items-center gap-2 rounded-lg border-2 border-border px-2 py-1.5",
				"hover:border-primary/40 hover:bg-muted/20 transition-colors",
			)}
		>
			<button
				type="button"
				onClick={onSelect}
				className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted/30"
				title="Select on canvas"
			>
				{asset.type === "image" ? (
					<img src={asset.src} alt="" className="h-full w-full object-cover" />
				) : (
					<div className="relative h-full w-full bg-muted">
						<video src={asset.src} className="h-full w-full object-cover" muted playsInline />
						<div className="absolute inset-0 flex items-center justify-center bg-black/25">
							<Video className="h-3.5 w-3.5 text-white" />
						</div>
					</div>
				)}
			</button>

			<div className="min-w-0 flex-1">
				<p className="text-[10px] text-muted-foreground truncate">{asset.sceneName}</p>
				{renaming ? (
					<Input
						autoFocus
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={commitRename}
						onKeyDown={(e) => {
							if (e.key === "Enter") commitRename();
							if (e.key === "Escape") {
								setDraft(asset.name);
								setRenaming(false);
							}
						}}
						className="h-7 mt-0.5 text-xs"
					/>
				) : (
					<button
						type="button"
						onClick={onSelect}
						className="text-xs font-medium text-foreground truncate w-full text-left mt-0.5"
					>
						{asset.name}
					</button>
				)}
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 shrink-0 opacity-70 group-hover:opacity-100"
					>
						<MoreHorizontal className="h-4 w-4" />
						<span className="sr-only">Asset actions</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-40">
					<DropdownMenuItem onClick={startRename}>
						<Pencil className="h-3.5 w-3.5" />
						Rename
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onCopy}>
						<Copy className="h-3.5 w-3.5" />
						Copy URL
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={onDelete}
						className="text-destructive focus:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export default function AssetsPanel() {
	const dispatch = useAppDispatch();
	const { project, activeSceneId } = useAppSelector((s) => s.videoEditor);

	const assets = useMemo(() => collectProjectAssets(project), [project]);

	const findLayer = (asset) => {
		const scene = project.scenes.find((s) => s.id === asset.sceneId);
		return scene?.layers.find((l) => l.id === asset.layerId) ?? null;
	};

	const handleRename = (asset, name) => {
		const layer = findLayer(asset);
		const patch = layer ? assetRenamePatch(layer, name) : null;
		if (!patch) return;
		dispatch(
			updateLayerData({
				sceneId: asset.sceneId,
				layerId: asset.layerId,
				data: patch,
			}),
		);
	};

	const handleDelete = (asset) => {
		dispatch(deleteLayer({ sceneId: asset.sceneId, layerId: asset.layerId }));
	};

	const handleCopy = async (asset) => {
		try {
			await navigator.clipboard.writeText(asset.src);
		} catch {
			/* ignore */
		}
	};

	const handleSelect = (asset) => {
		if (activeSceneId !== asset.sceneId) {
			dispatch(setActiveScene(asset.sceneId));
		}
		dispatch(selectLayer(asset.layerId));
	};

	return (
		<div className="flex flex-col gap-3 p-3">
			<div>
				<p className="text-sm font-bold text-foreground">Project assets</p>
				<p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
					Images and videos used across all scenes in{" "}
					<span className="font-semibold">{project.name}</span>.
				</p>
			</div>

			{assets.length === 0 ? (
				<p className="text-xs text-muted-foreground py-6 text-center leading-relaxed">
					No images or videos yet. Upload from the Image or Video tabs.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{assets.map((asset) => (
						<AssetRow
							key={asset.id}
							asset={asset}
							onRename={(name) => handleRename(asset, name)}
							onDelete={() => handleDelete(asset)}
							onCopy={() => handleCopy(asset)}
							onSelect={() => handleSelect(asset)}
						/>
					))}
				</div>
			)}
		</div>
	);
}
