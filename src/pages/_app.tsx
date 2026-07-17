import type { AppProps } from "next/app";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

// The App Router gets its styles from src/app/layout.tsx, which Pages Router
// routes never execute. Without this file, /admin renders with no CSS at all —
// every Tailwind class on the page is inert.
import "../app/globals.css";

// tailwind.config.ts maps font-display/font-body onto these two variables, but
// only app/layout.tsx was defining them. Pages Router needs its own copy or the
// brand faces silently fall back to system serif/sans.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
