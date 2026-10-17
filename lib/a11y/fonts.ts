import localFont from "next/font/local";

// Self-hosted reading fonts for the Learning Box reading preferences. Both
// are under the SIL Open Font License 1.1 (licence texts beside the files,
// taken from the @fontsource packages). Not preloaded: the browser only
// downloads a file when the learner picks that font.

export const atkinson = localFont({
  src: [
    { path: "./fonts/atkinson-hyperlegible-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/atkinson-hyperlegible-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  fallback: ["Verdana", "Tahoma", "sans-serif"],
});

export const openDyslexic = localFont({
  src: [
    { path: "./fonts/opendyslexic-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/opendyslexic-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  fallback: ["Verdana", "Tahoma", "sans-serif"],
});
