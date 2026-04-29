import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI TIMES — AI Insights for Business",
  description:
    "Practical AI knowledge for businesses, builders, and curious minds. AI best practices, readiness guides, tool reviews, and industry news — updated automatically.",
  keywords: [
    "AI blog", "AI for business", "AI best practices", "AI readiness",
    "machine learning news", "AI tools reviews", "AI mistakes small business",
    "AI TIMES", "TIBLOGICS blog", "AI insights",
  ],
  alternates: { canonical: "https://tiblogics.com/ai-times" },
  openGraph: {
    title: "AI TIMES — AI Insights | TIBLOGICS",
    description: "Practical AI knowledge for businesses. Updated automatically every 48 hours.",
    url: "https://tiblogics.com/ai-times",
    type: "website",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
