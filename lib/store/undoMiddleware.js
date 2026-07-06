import { pushHistorySnapshot } from "./slices/videoEditorSlice";
import {
	HISTORY_TRACKED_ACTIONS,
	HISTORY_SKIP_ACTIONS,
	cloneEditorSnapshot,
} from "./historyConfig";

/** Captures pre-mutation editor state for undo before tracked actions run */
export function undoMiddleware(store) {
	return (next) => (action) => {
		if (
			HISTORY_TRACKED_ACTIONS.has(action.type) &&
			!HISTORY_SKIP_ACTIONS.has(action.type)
		) {
			const snapshot = cloneEditorSnapshot(store.getState().videoEditor);
			store.dispatch(pushHistorySnapshot(snapshot));
		}
		return next(action);
	};
}
