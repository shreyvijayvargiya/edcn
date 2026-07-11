import { Group, Rect, Text, Circle } from "react-konva";
import {
	konvaAltDragHandlers,
	konvaVisualToLayerPosition,
	useKonvaDragHandlers,
	LayerHitRect,
} from "@/lib/video-editor/konvaDrag";
import { borderDashForStyle, clipRoundedRect } from "@/lib/video-editor/imageLayout";
import { layerAnimProps } from "@/lib/video-editor/animations";
import {
	resolveLayerChrome,
	konvaRingPad,
	konvaShadowProps,
} from "@/lib/video-editor/layerChromeStyle";
import { DEFAULT_UI_LAYER_STYLE } from "@/lib/video-editor/uiLayerStyle";

function UiInner({ data, w, h }) {
	const id = data.componentId ?? "cta-primary";
	const pad = data.padding ?? 12;
	const innerW = w - pad * 2;
	const innerH = h - pad * 2;
	const fontFamily = data.fontFamily ?? "DM Sans";
	const fontSize = data.fontSize ?? 16;
	const fontWeight = data.fontWeight ?? 600;

	if (id === "cta-primary" || id === "cta-outline" || id === "cta-pill" || id === "cta-ghost") {
		return (
			<Text
				x={pad}
				y={pad}
				width={innerW}
				height={innerH}
				text={data.label ?? "Button"}
				fontFamily={fontFamily}
				fontSize={fontSize}
				fontStyle={fontWeight >= 700 ? "bold" : "normal"}
				fill={data.textColor ?? "#ffffff"}
				align="center"
				verticalAlign="middle"
				listening={false}
			/>
		);
	}

	if (id === "icon-button" || id === "fab" || id === "play-button" || id === "success") {
		return (
			<Text
				x={0}
				y={0}
				width={w}
				height={h}
				text={data.label ?? "+"}
				fontFamily={fontFamily}
				fontSize={fontSize}
				fontStyle={fontWeight >= 700 ? "bold" : "normal"}
				fill={data.textColor ?? "#ffffff"}
				align="center"
				verticalAlign="middle"
				listening={false}
			/>
		);
	}

	if (id === "input-text" || id === "input-search" || id === "input-password") {
		return (
			<Group listening={false}>
				{id === "input-password" && data.label ? (
					<Text
						x={pad}
						y={Math.max(2, pad - 10)}
						width={innerW - 28}
						text={data.placeholder ?? "••••••••"}
						fontFamily={fontFamily}
						fontSize={fontSize}
						fill={data.mutedTextColor ?? "#71717a"}
						align="left"
						verticalAlign="middle"
					/>
				) : (
					<Text
						x={pad}
						y={pad}
						width={innerW - (id === "input-password" ? 28 : 0)}
						height={innerH}
						text={data.placeholder ?? "Placeholder"}
						fontFamily={fontFamily}
						fontSize={fontSize}
						fill={data.mutedTextColor ?? "#71717a"}
						align="left"
						verticalAlign="middle"
					/>
				)}
				{id === "input-password" ? (
					<Text
						x={w - pad - 22}
						y={pad}
						width={22}
						height={innerH}
						text="👁"
						fontSize={14}
						align="center"
						verticalAlign="middle"
					/>
				) : null}
			</Group>
		);
	}

	if (id === "slider") {
		const trackH = 8;
		const trackY = pad + (data.label ? 18 : 0);
		const val = data.sliderValue ?? 0.5;
		return (
			<Group listening={false}>
				{data.label ? (
					<Text
						x={pad}
						y={pad}
						width={innerW}
						text={data.label}
						fontFamily={fontFamily}
						fontSize={Math.max(10, fontSize - 2)}
						fontStyle="bold"
						fill={data.textColor ?? "#18181b"}
					/>
				) : null}
				<Rect
					x={pad}
					y={trackY}
					width={innerW}
					height={trackH}
					fill={data.secondaryBackground ?? "#e4e4e7"}
					cornerRadius={trackH / 2}
				/>
				<Rect
					x={pad}
					y={trackY}
					width={innerW * val}
					height={trackH}
					fill={data.background ?? "#ea580c"}
					cornerRadius={trackH / 2}
				/>
				<Circle
					x={pad + innerW * val}
					y={trackY + trackH / 2}
					radius={10}
					fill="#ffffff"
					stroke={data.background ?? "#ea580c"}
					strokeWidth={2}
				/>
			</Group>
		);
	}

	if (id === "toggle") {
		const on = data.checked !== false;
		const thumb = Math.min(innerH, h - (data.padding ?? 3) * 2);
		const thumbX = on ? w - pad - thumb : pad;
		return (
			<Group listening={false}>
				<Rect
					x={pad}
					y={pad}
					width={innerW}
					height={innerH}
					fill={on ? data.background : data.secondaryBackground}
					cornerRadius={innerH / 2}
				/>
				<Circle x={thumbX + thumb / 2} y={h / 2} radius={thumb / 2} fill="#ffffff" />
			</Group>
		);
	}

	if (id === "checkbox") {
		const box = 22;
		const cy = h / 2;
		return (
			<Group listening={false}>
				<Rect
					x={pad}
					y={cy - box / 2}
					width={box}
					height={box}
					fill={data.checked ? data.background : data.secondaryBackground ?? "#fff"}
					stroke={data.borderColor ?? "#d4d4d8"}
					strokeWidth={data.borderWidth ?? 2}
					cornerRadius={data.borderRadius ?? 6}
				/>
				{data.checked ? (
					<Text
						x={pad}
						y={cy - box / 2}
						width={box}
						height={box}
						text="✓"
						fontSize={14}
						fill="#ffffff"
						align="center"
						verticalAlign="middle"
					/>
				) : null}
				<Text
					x={pad + box + (data.gap ?? 10)}
					y={cy - 10}
					width={innerW - box - (data.gap ?? 10)}
					text={data.label ?? "Checkbox"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fill={data.textColor ?? "#18181b"}
					verticalAlign="middle"
				/>
			</Group>
		);
	}

	if (id === "calendar") {
		const cols = 7;
		const cell = Math.min((innerW - 6) / cols, 28);
		const selected = data.selectedDay ?? 6;
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					width={innerW}
					text={data.label ?? "Month"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.textColor ?? "#18181b"}
				/>
				{Array.from({ length: 21 }).map((_, i) => {
					const col = i % cols;
					const row = Math.floor(i / cols);
					const day = i + 1;
					const cx = pad + col * (cell + 2);
					const cy = pad + 28 + row * (cell + 2);
					const isSel = day === selected;
					return (
						<Rect
							key={i}
							x={cx}
							y={cy}
							width={cell}
							height={cell}
							fill={isSel ? data.background : data.secondaryBackground}
							cornerRadius={6}
						/>
					);
				})}
			</Group>
		);
	}

	if (id === "badge") {
		return (
			<Text
				x={pad}
				y={pad}
				width={innerW}
				height={innerH}
				text={data.label ?? "Badge"}
				fontFamily={fontFamily}
				fontSize={fontSize}
				fontStyle="bold"
				fill={data.textColor ?? "#92400e"}
				align="center"
				verticalAlign="middle"
				listening={false}
			/>
		);
	}

	if (id === "progress") {
		const barH = Math.max(8, innerH - 14);
		const prog = data.progress ?? 0.5;
		return (
			<Group listening={false}>
				<Rect
					x={pad}
					y={pad + 12}
					width={innerW}
					height={barH}
					fill={data.secondaryBackground ?? "#e4e4e7"}
					cornerRadius={barH / 2}
				/>
				<Rect
					x={pad}
					y={pad + 12}
					width={innerW * prog}
					height={barH}
					fill={data.background ?? "#ea580c"}
					cornerRadius={barH / 2}
				/>
				{data.label ? (
					<Text
						x={pad}
						y={pad}
						width={innerW}
						text={data.label}
						fontSize={Math.max(9, fontSize - 1)}
						fill={data.textColor ?? "#71717a"}
					/>
				) : null}
			</Group>
		);
	}

	if (id === "pill-tabs") {
		const tabs = data.tabs ?? ["Tab"];
		const tabW = (innerW - (tabs.length - 1) * (data.gap ?? 4)) / tabs.length;
		return (
			<Group listening={false}>
				{tabs.map((tab, i) => {
					const active = i === (data.activeTab ?? 0);
					return (
						<Group key={tab}>
							<Rect
								x={pad + i * (tabW + (data.gap ?? 4))}
								y={pad}
								width={tabW}
								height={innerH}
								fill={active ? data.background : "transparent"}
								cornerRadius={(data.borderRadius ?? 12) - 4}
							/>
							<Text
								x={pad + i * (tabW + (data.gap ?? 4))}
								y={pad}
								width={tabW}
								height={innerH}
								text={tab}
								fontFamily={fontFamily}
								fontSize={fontSize}
								fontStyle={active ? "bold" : "normal"}
								fill={active ? data.textColor : data.mutedTextColor}
								align="center"
								verticalAlign="middle"
							/>
						</Group>
					);
				})}
			</Group>
		);
	}

	if (id === "card") {
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					width={innerW}
					text={data.label ?? "Title"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.textColor ?? "#18181b"}
				/>
				<Text
					x={pad}
					y={pad + fontSize + (data.gap ?? 8)}
					width={innerW}
					text={data.subtitle ?? ""}
					fontFamily={fontFamily}
					fontSize={Math.max(11, fontSize - 4)}
					fill={data.mutedTextColor ?? "#71717a"}
					lineHeight={1.35}
				/>
			</Group>
		);
	}

	if (id === "avatar-row") {
		const av = Math.min(innerH, 40);
		return (
			<Group listening={false}>
				<Circle
					x={pad + av / 2}
					y={h / 2}
					radius={av / 2}
					fill={data.secondaryBackground ?? "#ea580c"}
				/>
				<Text
					x={pad}
					y={h / 2 - 8}
					width={av}
					text={data.avatarText ?? "U"}
					fontSize={12}
					fontStyle="bold"
					fill="#ffffff"
					align="center"
				/>
				<Text
					x={pad + av + (data.gap ?? 12)}
					y={h / 2 - 16}
					width={innerW - av - (data.gap ?? 12)}
					text={data.label ?? "Name"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.textColor ?? "#18181b"}
				/>
				<Text
					x={pad + av + (data.gap ?? 12)}
					y={h / 2 + 2}
					width={innerW - av - (data.gap ?? 12)}
					text={data.subtitle ?? ""}
					fontSize={Math.max(10, fontSize - 3)}
					fill={data.mutedTextColor ?? "#71717a"}
				/>
			</Group>
		);
	}

	if (id === "star-rating") {
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					text={"★".repeat(Math.min(5, data.rating ?? 5))}
					fontSize={fontSize + 4}
					fill={data.textColor ?? "#fbbf24"}
				/>
				<Text
					x={pad + 110}
					y={pad + 2}
					text={data.label ?? "5.0"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.mutedTextColor ?? "#18181b"}
				/>
			</Group>
		);
	}

	if (id === "store-badge") {
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					text={data.label ?? "Download on the"}
					fontSize={Math.max(9, fontSize - 1)}
					fill={data.mutedTextColor ?? "#d4d4d8"}
				/>
				<Text
					x={pad}
					y={pad + 14}
					text={data.subtitle ?? "App Store"}
					fontFamily={fontFamily}
					fontSize={fontSize + 4}
					fontStyle="bold"
					fill={data.textColor ?? "#ffffff"}
				/>
			</Group>
		);
	}

	if (id === "coupon") {
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					width={innerW - 56}
					height={innerH}
					text={data.label ?? "CODE"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.textColor ?? "#9a3412"}
					align="left"
					verticalAlign="middle"
				/>
				<Text
					x={w - pad - 52}
					y={pad}
					width={52}
					height={innerH}
					text={data.subtitle ?? "Copy"}
					fontFamily={fontFamily}
					fontSize={Math.max(11, fontSize - 2)}
					fontStyle="bold"
					fill={data.mutedTextColor ?? "#ea580c"}
					align="right"
					verticalAlign="middle"
				/>
			</Group>
		);
	}

	if (id === "dropdown") {
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					width={innerW - 24}
					height={innerH}
					text={data.label ?? "Select"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fill={data.textColor ?? "#18181b"}
					align="left"
					verticalAlign="middle"
				/>
				<Text
					x={w - pad - 20}
					y={pad}
					width={20}
					height={innerH}
					text="▾"
					fontSize={14}
					fill={data.mutedTextColor ?? "#71717a"}
					align="center"
					verticalAlign="middle"
				/>
			</Group>
		);
	}

	if (id === "radio") {
		const r = 11;
		const cy = h / 2;
		const on = data.checked !== false;
		return (
			<Group listening={false}>
				<Circle
					x={pad + r}
					y={cy}
					radius={r}
					stroke={on ? data.background : data.borderColor ?? "#d4d4d8"}
					strokeWidth={2}
					fill={data.secondaryBackground ?? "#fff"}
				/>
				{on ? (
					<Circle x={pad + r} y={cy} radius={6} fill={data.background ?? "#ea580c"} />
				) : null}
				<Text
					x={pad + r * 2 + (data.gap ?? 10)}
					y={cy - 10}
					width={innerW - r * 2 - (data.gap ?? 10)}
					text={data.label ?? "Option"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fill={data.textColor ?? "#18181b"}
					verticalAlign="middle"
				/>
			</Group>
		);
	}

	if (id === "chip-group" || id === "social-bar" || id === "bottom-nav") {
		const tabs = data.tabs ?? ["A", "B"];
		const gap = data.gap ?? 4;
		const tabW = (innerW - (tabs.length - 1) * gap) / tabs.length;
		const pill = id === "chip-group";
		return (
			<Group listening={false}>
				{tabs.map((tab, i) => {
					const active = i === (data.activeTab ?? 0);
					const showBg =
						id === "social-bar" ||
						(id === "bottom-nav" && active) ||
						(pill && active);
					return (
						<Group key={`${tab}-${i}`}>
							{showBg ? (
								<Rect
									x={pad + i * (tabW + gap)}
									y={pad}
									width={tabW}
									height={innerH}
									fill={
										id === "social-bar"
											? data.secondaryBackground
											: data.background
									}
									cornerRadius={pill || id === "bottom-nav" ? 999 : 8}
								/>
							) : null}
							<Text
								x={pad + i * (tabW + gap)}
								y={pad}
								width={tabW}
								height={innerH}
								text={tab}
								fontFamily={fontFamily}
								fontSize={fontSize}
								fontStyle={active || id === "social-bar" ? "bold" : "normal"}
								fill={
									active || id === "social-bar"
										? data.textColor
										: data.mutedTextColor
								}
								align="center"
								verticalAlign="middle"
							/>
						</Group>
					);
				})}
			</Group>
		);
	}

	if (id === "stepper") {
		const steps = Math.max(2, data.steps ?? 4);
		const active = Math.min(steps, data.activeStep ?? 1);
		const gap = 8;
		const stepW = (innerW - (steps - 1) * gap) / steps;
		return (
			<Group listening={false}>
				{Array.from({ length: steps }).map((_, i) => {
					const done = i < active;
					return (
						<Group key={i}>
							<Rect
								x={pad + i * (stepW + gap)}
								y={h / 2 - 4}
								width={stepW}
								height={8}
								fill={done ? data.background : data.secondaryBackground}
								cornerRadius={4}
							/>
							<Circle
								x={pad + i * (stepW + gap) + stepW / 2}
								y={h / 2}
								radius={10}
								fill={done ? data.background : data.secondaryBackground}
							/>
							<Text
								x={pad + i * (stepW + gap)}
								y={h / 2 - 7}
								width={stepW}
								text={String(i + 1)}
								fontSize={10}
								fontStyle="bold"
								fill={done ? data.textColor : data.mutedTextColor}
								align="center"
							/>
						</Group>
					);
				})}
			</Group>
		);
	}

	if (id === "toast" || id === "chat-bubble" || id === "metric" || id === "alert-banner") {
		const hasSub = Boolean(data.subtitle);
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={hasSub ? pad : pad}
					width={innerW}
					height={hasSub ? undefined : innerH}
					text={data.label ?? ""}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.textColor ?? "#18181b"}
					align={id === "alert-banner" ? "center" : "left"}
					verticalAlign={hasSub ? "top" : "middle"}
				/>
				{hasSub ? (
					<Text
						x={pad}
						y={pad + fontSize + (data.gap ?? 4)}
						width={innerW}
						text={data.subtitle}
						fontFamily={fontFamily}
						fontSize={Math.max(10, fontSize - 3)}
						fill={data.mutedTextColor ?? "#71717a"}
					/>
				) : null}
			</Group>
		);
	}

	if (id === "tooltip") {
		return (
			<Text
				x={pad}
				y={pad}
				width={innerW}
				height={innerH}
				text={data.label ?? "Tip"}
				fontFamily={fontFamily}
				fontSize={fontSize}
				fill={data.textColor ?? "#fafafa"}
				align="center"
				verticalAlign="middle"
				listening={false}
			/>
		);
	}

	if (id === "price-tag") {
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					width={innerW * 0.65}
					height={innerH}
					text={data.label ?? "$0"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.textColor ?? "#fff"}
					align="right"
					verticalAlign="middle"
				/>
				<Text
					x={pad + innerW * 0.65}
					y={pad + 4}
					width={innerW * 0.35}
					height={innerH}
					text={data.subtitle ?? ""}
					fontSize={Math.max(10, fontSize - 8)}
					fill={data.mutedTextColor ?? "#ffedd5"}
					align="left"
					verticalAlign="middle"
				/>
			</Group>
		);
	}

	if (id === "spinner") {
		const cx = w / 2;
		const cy = h / 2;
		const r = Math.min(innerW, innerH) / 2;
		return (
			<Group listening={false}>
				<Circle
					x={cx}
					y={cy}
					radius={r}
					stroke={data.secondaryBackground ?? "#e4e4e7"}
					strokeWidth={5}
				/>
				<Circle
					x={cx}
					y={cy}
					radius={r}
					stroke={data.textColor ?? "#ea580c"}
					strokeWidth={5}
					dash={[Math.PI * r * 0.55, Math.PI * r]}
					rotation={-90}
				/>
			</Group>
		);
	}

	if (id === "navbar") {
		return (
			<Group listening={false}>
				<Text
					x={pad}
					y={pad}
					width={28}
					height={innerH}
					text={data.subtitle ?? "☰"}
					fontSize={18}
					fill={data.mutedTextColor ?? "#71717a"}
					align="left"
					verticalAlign="middle"
				/>
				<Text
					x={pad + 28}
					y={pad}
					width={innerW - 56}
					height={innerH}
					text={data.label ?? "App"}
					fontFamily={fontFamily}
					fontSize={fontSize}
					fontStyle="bold"
					fill={data.textColor ?? "#18181b"}
					align="center"
					verticalAlign="middle"
				/>
				<Circle
					x={w - pad - 14}
					y={h / 2}
					radius={12}
					fill={data.secondaryBackground ?? "#f4f4f5"}
				/>
			</Group>
		);
	}

	return (
		<Text
			x={pad}
			y={pad}
			width={innerW}
			height={innerH}
			text={data.label ?? "UI"}
			align="center"
			verticalAlign="middle"
			fill={data.textColor ?? "#fff"}
			listening={false}
		/>
	);
}

export default function KonvaUiLayer({
	layer,
	anim,
	effective,
	onSelect,
	onChange,
	registerRef,
	interactive,
	onAltDragDuplicate,
}) {
	const { data } = layer;
	const altDrag = konvaAltDragHandlers(layer, interactive, onAltDragDuplicate);
	const { x, y, pos, dragHandlers, selectHandlers } = useKonvaDragHandlers(
		layer,
		anim,
		onChange,
		{
			getPosition: effective
				? () => layerAnimProps(layer, anim, effective)
				: undefined,
		},
	);

	const chrome = resolveLayerChrome(data, DEFAULT_UI_LAYER_STYLE);
	const { borderRadius, borderWidth, ringWidth, ringColor, ringRadius, borderColor, borderStyle } =
		chrome;
	const ringPad = konvaRingPad(chrome);
	const bg =
		data.background === "transparent" ? "rgba(0,0,0,0)" : data.background ?? "#ea580c";

	const shadowProps = konvaShadowProps(chrome);

	const handleTransformEnd = (e) => {
		const node = e.target;
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		const nextPos = konvaVisualToLayerPosition(layer, anim, node.x(), node.y());
		onChange({
			...nextPos,
			width: Math.max(24, node.width() * scaleX),
			height: Math.max(20, node.height() * scaleY),
			rotation: node.rotation() - (anim?.rotationOffset ?? 0),
		});
		node.scaleX(1);
		node.scaleY(1);
	};

	const pillRadius = borderRadius > 50 ? layer.height / 2 : borderRadius;

	return (
		<Group
			ref={registerRef}
			x={x}
			y={y}
			width={layer.width}
			height={layer.height}
			scaleX={pos.scaleX}
			scaleY={pos.scaleY}
			rotation={pos.rotation}
			opacity={pos.opacity}
			visible={layer.visible}
			draggable={interactive && !layer.locked}
			{...selectHandlers(onSelect)}
			{...altDrag}
			{...dragHandlers}
			onTransformEnd={handleTransformEnd}
		>
			{ringWidth > 0 && (
				<Rect
					x={-ringPad}
					y={-ringPad}
					width={layer.width + ringPad * 2}
					height={layer.height + ringPad * 2}
					cornerRadius={(ringRadius ?? pillRadius) + ringPad}
					stroke={ringColor || "#ffffff"}
					strokeWidth={ringWidth}
					fill="transparent"
					listening={false}
				/>
			)}

			<Group
				width={layer.width}
				height={layer.height}
				clipFunc={(ctx) => clipRoundedRect(ctx, layer.width, layer.height, pillRadius)}
				listening={false}
				{...shadowProps}
			>
				{(data.borderFill ?? "transparent") !== "transparent" && (
					<Rect
						width={layer.width}
						height={layer.height}
						fill={data.borderFill}
						cornerRadius={pillRadius}
					/>
				)}
				{bg !== "rgba(0,0,0,0)" && (
					<Rect
						width={layer.width}
						height={layer.height}
						fill={bg}
						cornerRadius={pillRadius}
					/>
				)}
				<UiInner data={data} w={layer.width} h={layer.height} />
			</Group>

			{borderWidth > 0 && (
				<Rect
					width={layer.width}
					height={layer.height}
					cornerRadius={pillRadius}
					stroke={borderColor || "#ffffff"}
					strokeWidth={borderWidth}
					dash={borderDashForStyle(borderStyle ?? "solid")}
					fill="transparent"
					listening={false}
				/>
			)}

			<LayerHitRect width={layer.width} height={layer.height} />
		</Group>
	);
}
