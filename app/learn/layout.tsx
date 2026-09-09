import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "TIBLOGICS Learn", template: "%s | TIBLOGICS Learn" },
  robots: { index: false, follow: false },
};

// Bare shell. The member area supplies its own chrome in (member)/layout.tsx;
// the auth pages (login/signup) are full-bleed and need no nav.
export default function LearnRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
