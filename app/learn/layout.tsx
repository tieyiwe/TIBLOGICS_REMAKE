import type { Metadata, Viewport } from "next";
import ReadingPrefsApplier from "@/components/a11y/ReadingPrefsApplier";
import { READING_PREFS_BOOT } from "@/lib/a11y/reading-prefs";
import { atkinson, openDyslexic } from "@/lib/a11y/fonts";
import UtmCapture from "@/components/public/UtmCapture";
import ClientMessages from "@/components/i18n/ClientMessages";
import HelpWidget from "@/components/learn/support/HelpWidget";

export const metadata: Metadata = {
  title: { absolute: "ARFA · TIBLOGICS AI Academy", template: "%s · ARFA AI Academy" },
  robots: { index: false, follow: false },
  // Installed app: the ARFA manifest is linked only here, so installing from
  // the browser installs the academy, not the whole site (app/arfa.webmanifest).
  // iOS reads appleWebApp instead of the manifest.
  manifest: "/arfa.webmanifest",
  appleWebApp: { capable: true, title: "ARFA", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/pwa/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#1B3A6B" };

// Bare shell. The member area supplies its own chrome in (member)/layout.tsx;
// the auth pages (login/signup) are full-bleed and need no nav.
// Reading preferences (components/a11y/ReadingPrefsPanel): the inline script
// stamps the learner's saved choices on <html> before the first paint, the
// style names the self-hosted reading fonts, and the applier removes the
// choices again when the learner leaves /learn.
export default function LearnRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: READING_PREFS_BOOT }} />
      <style>{`:root{--rp-font-atkinson:${atkinson.style.fontFamily};--rp-font-dyslexic:${openDyslexic.style.fontFamily}}`}</style>
      <span hidden className={`${atkinson.className} ${openDyslexic.className}`} />
      <ReadingPrefsApplier />
      <UtmCapture />
      <ClientMessages area={["learn", "member"]}>
        {children}
        {/* "Need help?" on every learner page, signed in or not (components/learn/support). */}
        <HelpWidget />
      </ClientMessages>
    </>
  );
}
