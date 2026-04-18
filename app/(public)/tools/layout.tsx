import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Testing & AI Tools",
  description:
    "Test your platform with AI-powered analysis. Get instant AI readiness scores, load speed measurements, UX insights, and personalized recommendations — free.",
  keywords: [
    "website AI scanner", "AI readiness test", "website speed test",
    "AI cost calculator", "AI project advisor", "platform testing",
    "website analysis tool", "free AI tools",
  ],
  alternates: { canonical: "https://tiblogics.com/tools" },
  openGraph: {
    title: "Platform Testing & AI Tools — TIBLOGICS",
    description: "Scan your website for AI readiness, speed, and UX gaps in seconds.",
    url: "https://tiblogics.com/tools",
    type: "website",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
