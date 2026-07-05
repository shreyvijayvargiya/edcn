# Next.js Video Editor — Source Code

A browser-based timeline video editor built with **Next.js**, **React Konva**, and **Redux Toolkit**. Compose scenes on a canvas, edit clips on a Premiere-style timeline, and export WebM — all client-side.

**Commercial license.** See [LICENSE](./LICENSE). Unauthorized redistribution is prohibited.

## Features

- **Canvas editor** — text, images, video, audio, shapes, and icons (Konva)
- **Timeline** — per-layer rows, clip move/resize, z-index reorder, add strips
- **Playback** — synced video and audio preview
- **Properties panel** — opacity, rotation, timing, gradients, animations
- **Keyboard shortcuts** — Space, Delete, ⌘C/V, ⌘]/[, Option-drag duplicate
- **Export** — WebM via frame-by-frame canvas capture

## Requirements

- Node.js 18+
- npm, pnpm, or yarn

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

Deploy to Vercel, Netlify, or any Node.js host. The editor requires client-side rendering (Konva does not support SSR).

## Project structure

```
components/
  video-editor/          # Editor UI (canvas, timeline, toolbar, panels)
  ui/                    # Shared UI primitives (button, input, dropdown, etc.)
lib/
  store/                 # Redux store, provider, and videoEditorSlice
  video-editor/          # Core logic — timeline, render, presets, media, Konva helpers
pages/
  index.js               # Demo page with dynamic import + VideoEditorProvider
styles/
  globals.css            # Tailwind + CSS variables (theme tokens)
```

### Key files

| File | Purpose |
|------|---------|
| `components/video-editor/VideoEditor.jsx` | Root editor component |
| `components/video-editor/EditorLayout.jsx` | Main layout shell |
| `components/video-editor/Timeline.jsx` | Timeline UI and clip interactions |
| `components/video-editor/CanvasPreview.jsx` | Konva stage and layer rendering |
| `lib/store/slices/videoEditorSlice.js` | All editor state and actions |
| `lib/video-editor/timeline.js` | Timeline math, clip normalization |
| `lib/video-editor/render.js` | WebM export pipeline |
| `lib/video-editor/defaults.js` | Default project, scenes, layer factories |
| `lib/store/provider.jsx` | Redux provider wrapper |

## Integration

Wrap any page that renders the editor with `VideoEditorProvider`:

```jsx
import dynamic from "next/dynamic";
import { VideoEditorProvider } from "@/lib/store/provider";

const VideoEditor = dynamic(() => import("@/components/video-editor/VideoEditor"), {
  ssr: false,
  loading: () => <div>Loading editor…</div>,
});

export default function EditorPage() {
  return (
    <VideoEditorProvider>
      <VideoEditor />
    </VideoEditorProvider>
  );
}
```

Path aliases are configured in `jsconfig.json` (`@/*` → project root).

## Customization

### Theming

Edit CSS variables in `styles/globals.css` (`--background`, `--foreground`, `--primary`, etc.). The editor uses Tailwind utility classes that reference these tokens.

### Default project and presets

- **New projects / layers:** `lib/video-editor/defaults.js` — `createDefaultProject()`, `LAYER_FACTORIES`
- **Text presets:** `lib/video-editor/textPresets.js`
- **Shape presets:** `lib/video-editor/shapePresets.js`
- **Canvas dimensions:** `lib/video-editor/dimensions.js`
- **Icons:** `lib/video-editor/icons.js`

### Timeline behavior

- Clip duration limits and normalization: `lib/video-editor/timeline.js`
- Layer reorder and timeline actions: `lib/video-editor/useTimelineLayerActions.js`
- Default pixels-per-second zoom: `pxPerSec` in `videoEditorSlice.js` initial state

### Export settings

WebM export logic lives in `lib/video-editor/render.js`. Adjust frame rate, quality, or output format there.

### State and actions

All editor mutations go through Redux in `lib/store/slices/videoEditorSlice.js`. Use the exported hooks from `lib/store/hooks.js`:

```jsx
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
```

To persist projects, dispatch `loadProject` with your serialized project JSON and save state on change.

### Adding a new layer type

1. Add a factory in `LAYER_FACTORIES` (`defaults.js`)
2. Handle rendering in `CanvasPreview.jsx` / related Konva components
3. Add property controls in `PropertyPanel.jsx`
4. Extend timeline row UI if needed in `Timeline.jsx`

## Stack

- [Next.js](https://nextjs.org/) 15 — app framework
- [React Konva](https://konvajs.org/) / Konva — canvas rendering
- [Redux Toolkit](https://redux-toolkit.js.org/) — editor state
- [@dnd-kit](https://dndkit.com/) — timeline drag and reorder
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Lucide](https://lucide.dev/) — icons

## Browser support

Requires a modern browser with WebM encoding support for export (Chrome and Edge recommended). Canvas editing works in all evergreen browsers.

## License

Commercial license — see [LICENSE](./LICENSE). One purchase = one project unless you bought an Extended license.

For support, use the contact method provided in your purchase receipt.
