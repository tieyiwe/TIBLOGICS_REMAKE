import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI TIMES — AI Insights for Business",
  description:
    "Practical AI knowledge for businesses, builders, and curious minds. AI best practices, readiness guides, tool reviews, and industry news — curated by TIBLOGICS.",
  keywords: [
    "AI blog", "AI for business", "AI best practices", "AI readiness",
    "machine learning news", "AI tools reviews", "AI case studies",
    "AI TIMES", "TIBLOGICS blog", "AI insights", "AI implementation tips",
  ],
  alternates: { canonical: "https://tiblogics.com/ai-times" },
  openGraph: {
    title: "AI TIMES — AI Insights for Business | TIBLOGICS",
    description: "Practical AI knowledge for businesses — case studies, tool reviews, tips, and industry news curated by TIBLOGICS.",
    url: "https://tiblogics.com/ai-times",
    type: "website",
    images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630, alt: "AI TIMES by TIBLOGICS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI TIMES — AI Insights for Business",
    description: "Case studies, tool reviews, tips, and industry news curated by TIBLOGICS.",
    creator: "@tiblogics",
    images: ["https://tiblogics.com/og-image.png"],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
