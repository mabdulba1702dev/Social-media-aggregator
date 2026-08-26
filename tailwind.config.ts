import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Tokens mirrored from docs/design-system.md — keep the two in sync.
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "text-faint": "var(--text-faint)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        platform: {
          instagram: "#d6249f",
          x: "#111111",
          tiktok: "#00d8c6",
          youtube: "#ff0000",
          facebook: "#1877f2",
          reddit: "#ff4500",
          threads: "#000000",
          pinterest: "#e60023",
          linkedin: "#0a66c2",
          bluesky: "#1185fe"
        }
      },
      borderRadius: {
        // Modernist system: zero corner radius on every rectangular
        // element, deliberately — see docs/Social media embed aggregator
        // UI's readme.md "Don't". Overriding sm/md/lg (not just the custom
        // `card` token) so shadcn primitives (button, input, dialog) built
        // against Tailwind's default scale honor this too, without editing
        // each component file individually. `full` is deliberately left
        // alone — true circles (avatars, status dots) aren't "rounded
        // corners" in the same sense, and the mockup itself keeps those.
        card: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px"
      }
    }
  },
  plugins: [animate]
};

export default config;
