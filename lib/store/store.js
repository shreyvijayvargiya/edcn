import { configureStore } from "@reduxjs/toolkit";
import videoEditorReducer from "./slices/videoEditorSlice";

export const store = configureStore({
	reducer: {
		videoEditor: videoEditorReducer,
	},
});
