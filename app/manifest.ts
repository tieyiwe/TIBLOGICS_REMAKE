import type { MetadataRoute } from "next";

// Web app manifest for the TIBLOGICS Learn app (served at
// /manifest.webmanifest). Installing opens straight into the Learning Box;
// the scope keeps the app window to /learn pages, so a link to the rest of
// the site opens in the browser. Icons: public/pwa (made from app/icon.svg;
// the maskable ones keep the mark inside the safe zone on brand navy).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/learn",
    name: "TIBLOGICS Learn",
    short_name: "TIB Learn",
    description: "Practical AI courses from TIBLOGICS. Download lessons and keep learning offline.",
    start_url: "/learn",
    scope: "/learn",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1B3A6B",
    categories: ["education", "productivity"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
