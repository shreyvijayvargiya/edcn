# shadcn Video Editor

Open-source timeline video editor for **Next.js** and **[shadcn/ui](https://ui.shadcn.com)**. Compose scenes on a Konva canvas, edit clips on a Premiere-style timeline, and export WebM — all in the browser.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Canvas editor** — text, images, video, audio, shapes, and icons (Konva)
- **Timeline** — per-layer rows, clip move/resize, z-index reorder, add strips
- **Playback** — synced video/audio preview
- **Properties** — opacity, rotation, timing, gradients, animations
- **Shortcuts** — Space, Delete, ⌘C/V, ⌘]/[, Option-drag duplicate
- **Export** — WebM via frame-by-frame canvas capture
- **shadcn registry** — install into any shadcn Next.js project

## Demo

Run locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Install via shadcn CLI

In a Next.js project with shadcn/ui initialized:

```bash
npx shadcn@latest add shreyvijayvargiya/shadcn-video-editor/video-editor
```

Optional example page:

```bash
npx shadcn@latest add shreyvijayvargiya/shadcn-video-editor/video-editor-page
```

### Requirements

- Next.js 14+
- Tailwind CSS v3 with CSS variables (shadcn default)
- Path aliases: `@/components`, `@/lib` (see `components.json`)

Wrap your page with the included provider (or use the example page):

```jsx
import dynamic from "next/dynamic";
import { VideoEditorProvider } from "@/lib/store/provider";

const VideoEditor = dynamic(() => import("@/components/video-editor/VideoEditor"), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <VideoEditorProvider>
      <VideoEditor />
    </VideoEditorProvider>
  );
}
```

## Project structure

```
components/video-editor/   # Editor UI
lib/video-editor/        # Timeline, render, presets, Konva helpers
lib/store/               # Redux slice + provider
registry.json            # shadcn registry catalog
```

## Validate registry

```bash
npm run registry:validate
```

## Stack

- [React Konva](https://konvajs.org/) / Konva — canvas
- [Redux Toolkit](https://redux-toolkit.js.org/) — editor state
- [@dnd-kit](https://dndkit.com/) — timeline reorder
- [shadcn/ui](https://ui.shadcn.com/) — UI primitives
- [Lucide](https://lucide.dev/) — icons

## License

MIT — see [LICENSE](./LICENSE).
