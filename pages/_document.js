import { Head, Html, Main, NextScript } from "next/document";

const themeInitScript = `(function(){try{var t=localStorage.getItem("edcn-theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function Document() {
	return (
		<Html lang="en" suppressHydrationWarning>
			<Head />
			<body>
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
