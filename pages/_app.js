import "../styles/globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }) {
	return (
		<ThemeProvider>
			<Toaster richColors />
			<Component {...pageProps} />
		</ThemeProvider>
	);
}
