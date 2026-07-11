# EDCN — Next.js Video Editor

Browser-based timeline video editor built with **Next.js** (Pages Router), **React Konva**, and **Redux Toolkit**. Compose scenes on a canvas, edit clips on a Premiere-style timeline, and export **MP4** or **GIF** — all client-side. Optional AI agent runs through a **server API proxy** (no database).

Projects persist in **localStorage**. No auth, no DB.

## Features

- **Canvas editor** — text, images, video, audio, shapes, icons, and UI components (Konva)
- **Timeline** — per-layer rows, clip move/resize, z-index reorder, zoom, context menus
- **Playback** — synced video and audio preview
- **Properties panel** — opacity, rotation, timing, gradients, animations, motion
- **Workspace** — save/load projects in the browser
- **AI agent** (optional) — OpenRouter via `/api/ai/chat` (server key or BYOK)
- **Export** — MP4 (WebCodecs / MediaRecorder) and GIF

## Requirements

- Node.js 18+
- npm (lockfile: `package-lock.json`)

## Quick start

```bash
cp .env.example .env.local   # optional — only needed for AI
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### AI setup (optional)

1. Get an [OpenRouter](https://openrouter.ai/) API key
2. Add to `.env.local`:

```bash
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

Or paste a key in the AI panel (stored in localStorage; sent only to this app’s API route).

**Never** put the key in `NEXT_PUBLIC_*` — that ships it to the browser.

### Production build

```bash
npm run build
npm start
```

Deploy to Vercel or any Node host. The editor loads with `ssr: false` (Konva is browser-only).

## Project structure

```
components/
  video-editor/          # Editor shell (layout, canvas, toolbar)
    left-panel/          # Text / image / video / audio / shapes / icons / UI tabs
    property-panel/      # Right-panel sections + motion
    timeline/            # Clip, track row, playhead, resize hook
  ui/                    # Shared primitives
  theme/                 # Theme provider + toggle
lib/
  store/                 # Redux + undo
  video-editor/          # Core logic
    animation/           # Presets, easing, layer/scene compute, anim props
    ai/                  # Agent prompts + client → API
pages/
  index.js               # Editor entry
  api/ai/chat.js         # OpenRouter proxy
  api/ai/status.js
```

### Key files

| File | Purpose |
|------|---------|
| `components/video-editor/VideoEditor.jsx` | Root editor |
| `components/video-editor/EditorLayout.jsx` | Layout shell |
| `components/video-editor/Timeline.jsx` | Timeline UI |
| `components/video-editor/CanvasPreview.jsx` | Konva stage |
| `lib/store/slices/videoEditorSlice.js` | Editor state |
| `lib/video-editor/timeline.js` | Timeline math |
| `lib/video-editor/render.js` | MP4 / GIF export |
| `lib/video-editor/defaults.js` | Project + layer factories |
| `pages/api/ai/chat.js` | AI proxy |

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

Path alias: `@/*` → project root (`jsconfig.json`).

## Customization

- **Theme:** CSS variables in `styles/globals.css`
- **Defaults / layers:** `lib/video-editor/defaults.js`
- **Export:** `lib/video-editor/render.js`
- **AI catalog / prompts:** `lib/video-editor/ai/`

### Adding a layer type

1. Factory in `LAYER_FACTORIES` (`defaults.js`)
2. Render in `CanvasPreview.jsx` / Konva components
3. Properties in `PropertyPanel.jsx`
4. Timeline row in `Timeline.jsx` if needed

## Stack

- [Next.js](https://nextjs.org/) 15 — Pages Router + API routes
- [React Konva](https://konvajs.org/) — canvas
- [Redux Toolkit](https://redux-toolkit.js.org/) — state + undo
- [@dnd-kit](https://dndkit.com/) — timeline DnD
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [OpenRouter](https://openrouter.ai/) — optional AI (proxied)

## Browser support

Modern Chromium recommended for MP4 export (WebCodecs). Editing works in evergreen browsers.

## License

See [LICENSE](./LICENSE). Relicense before publishing as true open source if the current file is still commercial / `UNLICENSED`.
