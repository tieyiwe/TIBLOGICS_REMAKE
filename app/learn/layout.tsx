import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "TIBLOGICS Learn", template: "%s | TIBLOGICS Learn" },
  robots: { index: false, follow: false },
  // Installed app (app/manifest.ts). iOS reads these instead of the manifest.
  appleWebApp: { capable: true, title: "TIB Learn", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/pwa/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#1B3A6B" };

// Bare shell. The member area supplies its own chrome in (member)/layout.tsx;
// the auth pages (login/signup) are full-bleed and need no nav.
export default function LearnRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
