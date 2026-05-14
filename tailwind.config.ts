import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: "#2d3854",
                    blue: "#3c5491",
                    light: "#b1bbe8",
                    sand: "#ddcbcb",
                },
            },
        },
    },
    plugins: [],
};
export default config;