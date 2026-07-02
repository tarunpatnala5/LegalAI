import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: "var(--card)",
                "card-border": "var(--card-border)",
                muted: "var(--muted)",
                "muted-foreground": "var(--muted-foreground)",
                accent: "var(--accent)",
                "accent-hover": "var(--accent-hover)",
                "accent-foreground": "var(--accent-foreground)",
                destructive: "var(--destructive)",
                "destructive-hover": "var(--destructive-hover)",
                separator: "var(--separator)",
            },
            fontFamily: {
                sans: ["var(--font-sf-text)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
                display: ["var(--font-sf-display)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
            },
            borderRadius: {
                "apple-xs": "var(--radius-xs)",
                "apple-sm": "var(--radius-sm)",
                "apple-md": "var(--radius-md)",
                "apple-lg": "var(--radius-lg)",
                "apple-xl": "var(--radius-xl)",
                "apple-2xl": "var(--radius-2xl)",
            },
            boxShadow: {
                "apple-sm": "var(--shadow-sm)",
                "apple-md": "var(--shadow-md)",
                "apple-lg": "var(--shadow-lg)",
                "apple-xl": "var(--shadow-xl)",
                "apple-glass": "var(--shadow-glass)",
            },
            backdropBlur: {
                "apple": "40px",
                "apple-heavy": "60px",
            },
        },
    },
    plugins: [],
};
export default config;
