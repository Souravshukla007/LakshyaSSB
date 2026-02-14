import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                'brand-orange': '#FF5E3A',
                'brand-dark': '#1a1a1a',
                'brand-bg': '#fafaf9',
                'brand-purple': '#7C3AED',
                'brand-green': '#10B981',
                'brand-yellow': '#FBBF24',
            },
            fontFamily: {
                'hero': ['Inter', 'system-ui', 'sans-serif'],
                'logo': ['Inter', 'system-ui', 'sans-serif'],
                'noname': ['Inter', 'system-ui', 'sans-serif'],
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'mono': ['ui-monospace', 'monospace'],
            },
            animation: {
                'marquee': 'marquee 30s linear infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            backgroundImage: {
                'grid-pattern': 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid-pattern': '40px 40px',
            },
        },
    },
    plugins: [],
};
export default config;
