import type { Config } from "tailwindcss";

export default {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
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
        // Remaining homepage :root tokens (public/index.html) — no new hex values
        muted:   "#3A4D60", // --slate — captions, secondary text
        success: "#1A8F5C", // --success
        warning: "#B45309", // --warning
        danger:  "#B42318", // --error
        wa:      "#128C7E", // WhatsApp green — reserved for WhatsApp only
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        body:    ["var(--font-plus-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Match the live site's --radius-* tokens exactly
        msc:      "10px",  // --radius-sm (inputs, small chips)
        "msc-md": "14px",  // --radius-md
        "msc-lg": "22px",  // --radius-lg (section cards)
        "msc-xl": "32px",  // --radius-xl (hero card)
        pill:     "100px", // --radius-pill (buttons)
      },
      boxShadow: {
        "msc-sm":    "0 1px 2px rgba(10,42,67,0.04), 0 2px 10px rgba(10,42,67,0.05)",       // --shadow-sm
        "msc-md":    "0 2px 4px rgba(10,42,67,0.04), 0 14px 28px -8px rgba(10,42,67,0.10)",  // --shadow-md
        "msc-lg":    "0 4px 8px rgba(10,42,67,0.05), 0 26px 52px -14px rgba(10,42,67,0.16)", // --shadow-lg
        "msc-float": "0 8px 16px rgba(10,42,67,0.06), 0 34px 68px -18px rgba(10,42,67,0.22)",// --shadow-float
        "msc-glow":  "0 8px 30px rgba(0,88,158,0.25)", // --shadow-glow (primary CTAs)
      },
    },
  },
  plugins: [],
} satisfies Config;
