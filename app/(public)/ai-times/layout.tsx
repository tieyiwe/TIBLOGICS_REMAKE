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
    title: "AI TIMES — Real Insights. Less Than 5 Min Reads. | TIBLOGICS",
    description: "Stay up to date with the most relevant AI tech info without wasting time or getting lost in dreadful articles.",
    url: "https://tiblogics.com/ai-times",
    type: "website",
    siteName: "AI Times | TIBLOGICS",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI TIMES — Real Insights. Less Than 5 Min Reads.",
    description: "Stay up to date with the most relevant AI tech info without wasting time or getting lost in dreadful articles.",
    creator: "@tiblogics",
    site: "@tiblogics",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
