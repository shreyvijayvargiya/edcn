# Next.js Video Editor — Free (Starter)

A browser-based timeline video editor built with **Next.js**, **React Konva**, and **Redux Toolkit**. Compose scenes on a canvas, edit clips on a timeline, and preview playback — all client-side.

This is the **free starter** version. Upgrade to **Pro** for WebM export, video/audio layers, animations, gradient backgrounds, multi-scene editing, social frame presets, and advanced keyboard shortcuts.

## Free tier includes

- **Canvas editor** — text, images, shapes, and icons (Konva)
- **Timeline** — single scene, clip move/resize, z-index reorder
- **Playback preview** — Space to play/pause
- **Properties panel** — opacity, rotation, timing, solid background
- **Fixed frame** — 1920 × 1080

## Pro only (not in this repo)

- WebM export
- Video and audio layers
- Layer, scene, and transition animations
- Gradient canvas backgrounds
- Multi-scene timeline
- Social frame presets (Shorts, TikTok, Instagram, etc.)
- Full keyboard shortcuts and inline canvas text edit

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
  ui/                    # Shared UI primitives
lib/
  store/                 # Redux store, provider, and videoEditorSlice
  video-editor/          # Timeline, presets, Konva helpers
pages/
  index.js               # Demo page with dynamic import + VideoEditorProvider
styles/
  globals.css            # Tailwind + CSS variables
```

### Key files

| File | Purpose |
|------|---------|
| `components/video-editor/VideoEditor.jsx` | Root editor component |
| `components/video-editor/EditorLayout.jsx` | Main layout shell |
| `components/video-editor/Timeline.jsx` | Single-scene timeline |
| `components/video-editor/CanvasPreview.jsx` | Konva stage and layer rendering |
| `lib/store/slices/videoEditorSlice.js` | Editor state and actions |
| `lib/video-editor/defaults.js` | Default project and layer factories |

## Integration

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

- **Theming:** CSS variables in `styles/globals.css`
- **Default project:** `lib/video-editor/defaults.js`
- **Text / shape presets:** `lib/video-editor/textPresets.js`, `shapePresets.js`
- **Timeline logic:** `lib/video-editor/timeline.js`

## Stack

- [Next.js](https://nextjs.org/) 15
- [React Konva](https://konvajs.org/) / Konva
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [@dnd-kit](https://dndkit.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide](https://lucide.dev/)

## License

MIT — see [LICENSE](./LICENSE).
