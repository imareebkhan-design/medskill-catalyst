import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Webinar palette token names preserved; hex values mapped to the
        // existing MedSkills Catalyst brand (navy / blue / cyan palette).
        teal: {
          deep: "#0A2A43", // navy   — authority / dark sections
          mid:  "#00589E", // blue   — primary brand
          pale: "#E8F2FB", // pale-blue — tints / light fills
          leg:  "#4AD0FF", // cyan   — accent only
        },
        emerald: {
          DEFAULT: "#00589E", // blue — primary CTA (rationed)
          dark:    "#004780", // cta-hover
        },
        ink:     "#0F1B27",
        canvas:  "#F7F9FB",
        surface: "#FFFFFF",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        body:    ["var(--font-plus-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Match the live site's --radius-* tokens exactly
        msc:      "8px",  // was 16px — now matches --radius-sm (buttons, inputs)
        "msc-lg": "20px", // was 24px — now matches --radius-lg (section cards)
      },
      boxShadow: {
        "msc-sm": "0 2px 8px rgba(10,42,67,0.04)",
        "msc-md": "0 16px 40px rgba(10,42,67,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
