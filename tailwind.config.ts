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
                brand: {
                    bg: '#FFFBF6',
                    dark: '#0F0F12',
                    orange: '#FF5E3A',
                    purple: '#7C3AED',
                    green: '#10B981',
                    yellow: '#FBBF24',
                    gray: '#F4F4F5'
                }
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                logo: ['"Outfit"', 'sans-serif'],
                helvetica: ['"Inter"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                gothic: ['"Nanum Gothic"', 'sans-serif'],
                noname: ['"DM Sans"', 'sans-serif'],
                hero: ['"Raleway"', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 20px 50px -20px rgba(0, 0, 0, 0.05)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                'glow': '0 0 20px rgba(255, 94, 58, 0.15)'
            },
            animation: {
                'marquee': 'marquee 25s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'fadeIn': 'fadeIn 0.4s ease-out both',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
            },
            backgroundSize: {
                'grid-pattern': '24px 24px',
            },
        },
    },
    plugins: [],
};
export default config;
