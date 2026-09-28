import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("pages.aiTimes.meta.title"),
    description: t("pages.aiTimes.meta.description"),
    keywords: [
      "AI blog", "AI for business", "AI best practices", "AI readiness",
      "machine learning news", "AI tools reviews", "AI case studies",
      "AI TIMES", "TIBLOGICS blog", "AI insights", "AI implementation tips",
    ],
    alternates: { canonical: "https://tiblogics.com/ai-times" },
    openGraph: {
      title: t("pages.aiTimes.meta.ogTitle"),
      description: t("pages.aiTimes.meta.ogDescription"),
      url: "https://tiblogics.com/ai-times",
      type: "website",
      siteName: "AI Times | TIBLOGICS",
    },
    twitter: {
      card: "summary_large_image",
      title: t("pages.aiTimes.meta.twitterTitle"),
      description: t("pages.aiTimes.meta.ogDescription"),
      creator: "@tiblogics",
      site: "@tiblogics",
    },
  };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
