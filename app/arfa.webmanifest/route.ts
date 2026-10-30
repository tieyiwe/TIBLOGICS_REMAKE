// Web app manifest for ARFA, the TIBLOGICS AI Academy, linked ONLY from the
// ARFA pages (app/learn/layout.tsx), so installing from the browser installs
// the academy, never the whole TIBLOGICS site. id "/learn" is kept from the
// earlier manifest so existing installs are the same app. The scope keeps the
// app window to /learn; links elsewhere open in the browser.
// related_applications lets Chrome on Android report "already installed"
// (navigator.getInstalledRelatedApps) so the install prompt is not shown again.

export const dynamic = "force-static";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
}

export function GET() {
  const manifest = {
    id: "/learn",
    name: "ARFA AI Academy",
    short_name: "ARFA",
    description:
      "ARFA (AI Readiness For All), the TIBLOGICS AI Academy: hands-on AI learning, career readiness, parent empowerment and community. Download lessons and keep learning offline.",
    start_url: "/learn?source=pwa",
    scope: "/learn",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#FFFFFF",
    theme_color: "#1B3A6B",
    categories: ["education", "productivity"],
    lang: "en",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Continue learning", url: "/learn", icons: [{ src: "/pwa/icon-96.png", sizes: "96x96", type: "image/png" }] },
      { name: "My tracks", url: "/learn/tracks", icons: [{ src: "/pwa/icon-96.png", sizes: "96x96", type: "image/png" }] },
    ],
    // The richer install dialog on Android and desktop Chrome/Edge. Taken from
    // real /learn pages (narrow: phone at 390x844 @2x; wide: 1280x800).
    screenshots: [
      { src: "/pwa/screenshots/narrow-dashboard.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Your ARFA dashboard" },
      { src: "/pwa/screenshots/narrow-lesson.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "A lesson" },
      { src: "/pwa/screenshots/wide-dashboard.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "Your ARFA dashboard" },
      { src: "/pwa/screenshots/wide-lesson.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "A lesson" },
    ],
    related_applications: [{ platform: "webapp", url: `${siteUrl()}/arfa.webmanifest` }],
    prefer_related_applications: false,
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
