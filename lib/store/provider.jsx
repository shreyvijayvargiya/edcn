import { Provider } from "react-redux";
import { store } from "./store";

export function VideoEditorProvider({ children }) {
	return <Provider store={store}>{children}</Provider>;
}
