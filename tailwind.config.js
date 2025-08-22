/** @type {import('tailwindcss').Config} */
module.exports = {
    safelist: [
        'bg-background',
        'text-foreground',
        'border-border',
    ],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '475px',
            },
            colors: {
                brand: {
                    primary: "hsl(275, 56%, 60%)", // Soft Violet (from top-right wing)
                    'primary-dark': "hsl(275, 56%, 40%)", // Darker shade of primary
                    secondary: "hsl(186, 43%, 45%)", // Teal Green (from top-left wing)
                    accent: "hsl(269, 45%, 50%)", // Rich Purple (bottom wings)
                    success: "hsl(142, 76%, 36%)", // Keep for positive actions
                    warning: "hsl(39, 100%, 50%)", // Slightly softer amber
                    error: "hsl(0, 84%, 60%)", // Red (default)
                    info: "hsl(217, 91%, 60%)", // Blue (default)
                },
                surface: {
                    primary: "hsl(0, 0%, 100%)", // White
                    secondary: "hsl(240, 20%, 97%)", // Light lavender gray
                    tertiary: "hsl(240, 20%, 93%)",
                    'tertiary-dark': "hsl(240, 2.80%, 79.00%)", // Lighter lavender gray
                    hover: "hsl(240, 20%, 89%)", // Hover lavender
                    active: "hsl(240, 20%, 85%)", // Active lavender
                },
                text: {
                    primary: "hsl(252, 15%, 15%)", // Deep purple gray
                    secondary: "hsl(252, 12%, 35%)", // Soft medium purple gray
                    tertiary: "hsl(252, 10%, 55%)", // Light text gray
                    inverse: "hsl(0, 0%, 100%)", // White
                    accent: "hsl(275, 56%, 60%)", // Brand Primary for highlights
                },
                border: {
                    primary: "hsl(252, 20%, 85%)",
                    secondary: "hsl(252, 20%, 75%)",
                    accent: "hsl(269, 45%, 50%)",
                    DEFAULT: "hsl(252, 20%, 85%)", // for border-border
                },
                codGray: "#070706", // Dark base
                amethystSmoke: "#a38ea6",
                bismark: "#477d82",
                mobster: "#857a96",
                martinique: "#393357",
                spectra: "#315657",
                elm: "#1b6e69",
                neptune: "#7eb4be",
                mountbattenPink: "#9c7484",
                gulfStream: "#7cacac",
            },
            backgroundColor: {
                background: "hsl(var(--background))",
            },
            animation: {
                "slide-in-right": "slide-in-right 0.3s ease-out",
                "slide-out-right": "slide-out-right 0.3s ease-in",
            },
            keyframes: {
                "slide-in-right": {
                    "0%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                "slide-out-right": {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(100%)" },
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            textColor: {
                foreground: "hsl(var(--foreground))",
            },
            borderColor: {
                border: "hsl(252, 20%, 85%)",
            },
            maxWidth: {
                  '7.5xl': '90rem', // 85rem = 1360px
                },
        },
    },
    plugins: [require("tailwindcss-animate")],
}