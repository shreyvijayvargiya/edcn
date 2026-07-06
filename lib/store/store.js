import { configureStore } from "@reduxjs/toolkit";
import videoEditorReducer from "./slices/videoEditorSlice";
import { undoMiddleware } from "./undoMiddleware";

export const store = configureStore({
	reducer: {
		videoEditor: videoEditorReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(undoMiddleware),
});
