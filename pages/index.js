import dynamic from "next/dynamic";
import Head from "next/head";
import { VideoEditorProvider } from "@/lib/store/provider";

const VideoEditor = dynamic(() => import("@/components/video-editor/VideoEditor"), {
	ssr: false,
	loading: () => (
		<div className="h-dvh flex items-center justify-center bg-background text-muted-foreground text-sm">
			Loading editor…
		</div>
	),
});

export default function HomePage() {
	return (
		<>
			<Head>
				<title>Video Editor — shadcn/ui</title>
				<meta
					name="description"
					content="Open-source timeline video editor built with React, Konva, and shadcn/ui."
				/>
			</Head>
			<VideoEditorProvider>
				<VideoEditor />
			</VideoEditorProvider>
		</>
	);
}
