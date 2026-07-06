import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "edcn-theme";

const ThemeContext = createContext({
	theme: "light",
	setTheme: () => {},
	toggleTheme: () => {},
});

function getInitialTheme() {
	if (typeof window === "undefined") return "light";
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "dark" || stored === "light") return stored;
	} catch {
		/* ignore */
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
	const [theme, setThemeState] = useState("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setThemeState(getInitialTheme());
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		const root = document.documentElement;
		root.classList.toggle("dark", theme === "dark");
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			/* ignore */
		}
	}, [theme, mounted]);

	const setTheme = useCallback((next) => {
		setThemeState(next === "dark" ? "dark" : "light");
	}, []);

	const toggleTheme = useCallback(() => {
		setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
