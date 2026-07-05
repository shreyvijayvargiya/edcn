import { createContext, useContext, useRef } from "react";

export const VideoEditorStageContext = createContext(null);

export function useStageRef() {
	return useContext(VideoEditorStageContext);
}

export function StageRefProvider({ children }) {
	const stageRef = useRef(null);
	return (
		<VideoEditorStageContext.Provider value={stageRef}>
			{children}
		</VideoEditorStageContext.Provider>
	);
}
