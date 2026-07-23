import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        paper: "#fbfbf8",
        line: "#d9ded6",
        moss: "#596e54",
        brick: "#a35643",
        sky: "#426a8c"
      }
    }
  },
  plugins: []
};

export default config;
