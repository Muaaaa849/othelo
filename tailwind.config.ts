import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#12151C",
        board: "#1E2430",
        line: "#3A4252",
        card: "#1E2430",
        gold: "#C99A1C",
        // カテゴリ色（第3.1節）
        hobby: "#2FA85A",
        memory: "#F08C1A",
        if: "#8A5CF0",
        values: "#2F72E0",
        love: "#E5484D",
        you: "#C99A1C",
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "system-ui", "sans-serif"],
      },
      fontSize: {
        question: ["24px", { lineHeight: "1.4", fontWeight: "700" }],
        body: ["16px", "1.6"],
        note: ["13px", "1.5"],
      },
    },
  },
  plugins: [],
};

export default config;
