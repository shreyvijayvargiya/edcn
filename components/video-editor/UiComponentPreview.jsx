import { cn } from "@/lib/utils";
import {
	resolveLayerChrome,
	cssBorderFromChrome,
	cssBoxShadowFromChrome,
	cssBorderRadiusFromChrome,
} from "@/lib/video-editor/layerChromeStyle";
import { DEFAULT_UI_LAYER_STYLE } from "@/lib/video-editor/uiLayerStyle";

/** HTML thumbnail for left panel list */
export default function UiComponentPreview({ data, className }) {
	const d = data ?? {};
	const id = d.componentId ?? "cta-primary";
	const chrome = resolveLayerChrome(d, DEFAULT_UI_LAYER_STYLE);
	const style = {
		background: d.background ?? "#ea580c",
		color: d.textColor ?? "#fff",
		borderRadius: cssBorderRadiusFromChrome(chrome),
		border: cssBorderFromChrome(chrome),
		fontFamily: d.fontFamily ?? "DM Sans, sans-serif",
		fontSize: Math.max(9, (d.fontSize ?? 14) * 0.55),
		fontWeight: d.fontWeight ?? 600,
		boxShadow: cssBoxShadowFromChrome(chrome),
	};

	if (id === "input-text" || id === "input-search" || id === "input-password") {
		return (
			<div
				className={cn("w-full h-8 flex items-center justify-between px-2", className)}
				style={{ ...style, color: d.mutedTextColor ?? "#71717a" }}
			>
				<span className="truncate">{d.placeholder ?? "Placeholder"}</span>
				{id === "input-password" ? <span className="text-[9px] opacity-60">👁</span> : null}
			</div>
		);
	}

	if (id === "slider") {
		return (
			<div className={cn("w-full space-y-1", className)}>
				<div className="text-[8px] font-semibold" style={{ color: d.textColor }}>
					{d.label}
				</div>
				<div
					className="h-1.5 rounded-full overflow-hidden"
					style={{ background: d.secondaryBackground }}
				>
					<div
						className="h-full rounded-full"
						style={{ width: `${(d.sliderValue ?? 0.5) * 100}%`, background: d.background }}
					/>
				</div>
			</div>
		);
	}

	if (id === "toggle") {
		const on = d.checked !== false;
		return (
			<div
				className={cn("w-10 h-5 rounded-full p-0.5 flex", className)}
				style={{
					background: on ? d.background : d.secondaryBackground,
					justifyContent: on ? "flex-end" : "flex-start",
				}}
			>
				<div className="h-4 w-4 rounded-full bg-white shadow-sm" />
			</div>
		);
	}

	if (id === "checkbox") {
		return (
			<div className={cn("flex items-center gap-1.5", className)}>
				<div
					className="h-3.5 w-3.5 rounded-sm border-2 flex items-center justify-center text-[8px]"
					style={{
						borderColor: d.checked ? d.background : d.borderColor,
						background: d.checked ? d.background : d.secondaryBackground,
						color: "#fff",
					}}
				>
					{d.checked ? "✓" : ""}
				</div>
				<span style={{ color: d.textColor, fontSize: 9 }}>{d.label}</span>
			</div>
		);
	}

	if (id === "calendar") {
		return (
			<div
				className={cn("w-full p-1.5 border rounded-lg", className)}
				style={{ background: d.background, borderColor: d.borderColor }}
			>
				<div className="text-[8px] font-bold mb-1" style={{ color: d.textColor }}>
					{d.label}
				</div>
				<div className="grid grid-cols-7 gap-0.5">
					{Array.from({ length: 14 }).map((_, i) => (
						<div
							key={i}
							className="h-2 rounded-sm"
							style={{
								background: i === 8 ? d.background : d.secondaryBackground,
								opacity: i === 8 ? 1 : 0.7,
							}}
						/>
					))}
				</div>
			</div>
		);
	}

	if (id === "badge") {
		return (
			<span className={cn("inline-flex px-2 py-0.5", className)} style={style}>
				{d.label}
			</span>
		);
	}

	if (id === "progress") {
		return (
			<div className={cn("w-full", className)}>
				<div
					className="h-1.5 rounded-full overflow-hidden"
					style={{ background: d.secondaryBackground }}
				>
					<div
						className="h-full rounded-full"
						style={{ width: `${(d.progress ?? 0.5) * 100}%`, background: d.background }}
					/>
				</div>
			</div>
		);
	}

	if (id === "pill-tabs") {
		const tabs = d.tabs ?? ["A", "B"];
		return (
			<div
				className={cn("flex gap-0.5 p-0.5 rounded-lg w-full", className)}
				style={{ background: d.secondaryBackground }}
			>
				{tabs.slice(0, 3).map((tab, i) => (
					<span
						key={tab}
						className="flex-1 text-center py-0.5 rounded-md text-[8px] font-semibold truncate"
						style={{
							background: i === (d.activeTab ?? 0) ? d.background : "transparent",
							color: i === (d.activeTab ?? 0) ? d.textColor : d.mutedTextColor,
						}}
					>
						{tab}
					</span>
				))}
			</div>
		);
	}

	if (id === "card") {
		return (
			<div className={cn("w-full p-2 border rounded-lg text-left", className)} style={style}>
				<div className="font-bold text-[9px]">{d.label}</div>
				<div className="text-[7px] mt-0.5 opacity-70" style={{ color: d.mutedTextColor }}>
					{d.subtitle?.slice(0, 40)}
				</div>
			</div>
		);
	}

	if (id === "avatar-row") {
		return (
			<div
				className={cn("flex items-center gap-1.5 w-full p-1 border rounded-lg", className)}
				style={{ background: d.background, borderColor: d.borderColor }}
			>
				<div
					className="h-6 w-6 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
					style={{ background: d.secondaryBackground }}
				>
					{d.avatarText ?? "U"}
				</div>
				<div className="min-w-0">
					<div className="text-[8px] font-bold truncate" style={{ color: d.textColor }}>
						{d.label}
					</div>
					<div className="text-[7px] truncate" style={{ color: d.mutedTextColor }}>
						{d.subtitle}
					</div>
				</div>
			</div>
		);
	}

	if (id === "star-rating") {
		return (
			<div className={cn("flex items-center gap-1", className)}>
				<span style={{ color: d.textColor }}>{"★".repeat(Math.min(5, d.rating ?? 5))}</span>
				<span className="text-[9px] font-bold" style={{ color: d.mutedTextColor }}>
					{d.label}
				</span>
			</div>
		);
	}

	if (id === "store-badge") {
		return (
			<div className={cn("px-2 py-1 rounded-md text-left", className)} style={style}>
				<div className="text-[6px] opacity-80">{d.label}</div>
				<div className="text-[9px] font-bold">{d.subtitle}</div>
			</div>
		);
	}

	if (id === "cta-outline" || id === "cta-ghost") {
		return (
			<div className={cn("w-full h-7 flex items-center justify-center", className)} style={style}>
				{d.label}
			</div>
		);
	}

	if (id === "icon-button" || id === "fab" || id === "play-button" || id === "success") {
		return (
			<div
				className={cn("h-8 w-8 flex items-center justify-center rounded-full text-sm", className)}
				style={style}
			>
				{d.label || "+"}
			</div>
		);
	}

	if (id === "coupon") {
		return (
			<div
				className={cn("w-full h-7 flex items-center justify-between px-2 border border-dashed rounded-md", className)}
				style={{ ...style, borderColor: d.borderColor }}
			>
				<span className="text-[9px] font-bold">{d.label}</span>
				<span className="text-[8px] font-semibold" style={{ color: d.mutedTextColor }}>
					{d.subtitle}
				</span>
			</div>
		);
	}

	if (id === "dropdown") {
		return (
			<div
				className={cn("w-full h-7 flex items-center justify-between px-2 rounded-md border", className)}
				style={{ ...style, borderColor: d.borderColor }}
			>
				<span className="text-[9px] truncate">{d.label}</span>
				<span className="text-[9px] opacity-50">▾</span>
			</div>
		);
	}

	if (id === "radio") {
		return (
			<div className={cn("flex items-center gap-1.5", className)}>
				<div
					className="h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center"
					style={{ borderColor: d.checked ? d.background : d.borderColor }}
				>
					{d.checked ? (
						<div className="h-1.5 w-1.5 rounded-full" style={{ background: d.background }} />
					) : null}
				</div>
				<span style={{ color: d.textColor, fontSize: 9 }}>{d.label}</span>
			</div>
		);
	}

	if (id === "chip-group" || id === "social-bar" || id === "bottom-nav") {
		const tabs = d.tabs ?? ["A", "B"];
		return (
			<div
				className={cn("flex gap-0.5 p-0.5 rounded-lg w-full", className)}
				style={{ background: d.secondaryBackground ?? d.background }}
			>
				{tabs.slice(0, 5).map((tab, i) => (
					<span
						key={`${tab}-${i}`}
						className="flex-1 text-center py-0.5 rounded-md text-[8px] font-semibold truncate"
						style={{
							background:
								i === (d.activeTab ?? 0) && id !== "social-bar"
									? d.background
									: id === "social-bar"
										? d.background
										: "transparent",
							color:
								i === (d.activeTab ?? 0) || id === "social-bar"
									? d.textColor
									: d.mutedTextColor,
						}}
					>
						{tab}
					</span>
				))}
			</div>
		);
	}

	if (id === "stepper") {
		const steps = d.steps ?? 4;
		const active = d.activeStep ?? 2;
		return (
			<div className={cn("flex items-center gap-1 w-full", className)}>
				{Array.from({ length: steps }).map((_, i) => (
					<div
						key={i}
						className="flex-1 h-1.5 rounded-full"
						style={{
							background: i < active ? d.background : d.secondaryBackground,
						}}
					/>
				))}
			</div>
		);
	}

	if (id === "toast" || id === "chat-bubble" || id === "metric" || id === "alert-banner") {
		return (
			<div className={cn("w-full p-1.5 rounded-lg text-left", className)} style={style}>
				<div className="font-bold text-[9px] truncate">{d.label}</div>
				{d.subtitle ? (
					<div className="text-[7px] mt-0.5 opacity-70 truncate" style={{ color: d.mutedTextColor }}>
						{d.subtitle}
					</div>
				) : null}
			</div>
		);
	}

	if (id === "tooltip") {
		return (
			<div className={cn("px-2 py-1 rounded text-[8px]", className)} style={style}>
				{d.label}
			</div>
		);
	}

	if (id === "price-tag") {
		return (
			<div className={cn("inline-flex items-baseline gap-0.5 px-2 py-1 rounded-md", className)} style={style}>
				<span className="text-[11px] font-extrabold">{d.label}</span>
				<span className="text-[7px] opacity-80">{d.subtitle}</span>
			</div>
		);
	}

	if (id === "spinner") {
		return (
			<div className={cn("h-7 w-7 rounded-full border-2 border-t-transparent", className)} style={{
				borderColor: d.secondaryBackground,
				borderTopColor: d.textColor ?? "#ea580c",
			}} />
		);
	}

	if (id === "navbar") {
		return (
			<div
				className={cn("w-full h-7 flex items-center justify-between px-2 rounded-md border", className)}
				style={{ background: d.background, borderColor: d.borderColor, color: d.textColor }}
			>
				<span className="text-[9px] opacity-50">{d.subtitle}</span>
				<span className="text-[9px] font-bold">{d.label}</span>
				<span className="h-3 w-3 rounded-full" style={{ background: d.secondaryBackground }} />
			</div>
		);
	}

	return (
		<div className={cn("w-full h-7 flex items-center justify-center", className)} style={style}>
			{d.label ?? "Button"}
		</div>
	);
}
