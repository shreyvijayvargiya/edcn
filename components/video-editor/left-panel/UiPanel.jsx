import { timelineDragProps } from "@/components/video-editor/timelineDragSource";
import UiComponentPreview from "@/components/video-editor/UiComponentPreview";
import {
	UI_COMPONENT_CATEGORIES,
	filterUiComponents,
} from "@/lib/video-editor/uiComponents";

export function UiPanel({ onAddUi, search }) {
	const filtered = filterUiComponents(search);
	const byCategory = UI_COMPONENT_CATEGORIES.map((cat) => ({
		...cat,
		items: filtered.filter((p) => p.category === cat.id),
	})).filter((g) => g.items.length > 0);

	return (
		<div className="flex flex-col gap-3 p-3">
			<p className="text-sm font-bold text-foreground">UI components</p>
			<p className="text-[10px] text-muted-foreground leading-relaxed -mt-2">
				CTAs, inputs, sliders & more for app promo videos. Click to add, then style in the
				right panel.
			</p>

			{byCategory.map((group) => (
				<div key={group.id} className="space-y-2">
					<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
						{group.label}
					</p>
					<div className="flex flex-col gap-1.5">
						{group.items.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => onAddUi(preset)}
								{...timelineDragProps({
									type: "ui",
									data: preset.data,
									size: preset.size,
								})}
								className="w-full text-left border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors p-2 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing"
								title={preset.label}
							>
								<UiComponentPreview data={preset.data} className="pointer-events-none" />
								<span className="text-[11px] font-semibold text-foreground">{preset.label}</span>
							</button>
						))}
					</div>
				</div>
			))}

			{filtered.length === 0 && (
				<p className="text-xs text-muted-foreground text-center py-6">No components match</p>
			)}
		</div>
	);
}
