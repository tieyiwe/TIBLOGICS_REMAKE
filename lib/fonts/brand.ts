import { DM_Sans, Syne } from "next/font/google";

// The event landing pages, the training terms and the store's order
// confirmation use the original brand faces, Syne and DM Sans. Self-hosted
// through next/font (was a render-blocking @import of Google Fonts CSS).
// Not preloaded: the variables are set on <html> by the root layout, and the
// browser downloads a face only on a page that actually uses it.
export const brandSyne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-brand-syne",
  display: "swap",
  preload: false,
});

export const brandDm = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-brand-dm",
  display: "swap",
  preload: false,
});

/** CSS font-family values for inline styles and <style> blocks. */
export const SYNE = "var(--font-brand-syne), 'Syne', sans-serif";
export const DM = "var(--font-brand-dm), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
