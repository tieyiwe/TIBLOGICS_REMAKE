import ClientMessages from "@/components/i18n/ClientMessages";
import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/ai-times",
    locale,
    title: t("pages.aiTimes.meta.title"),
    description: t("pages.aiTimes.meta.description"),
    socialTitle: t("pages.aiTimes.meta.ogTitle"),
    socialDescription: t("pages.aiTimes.meta.ogDescription"),
    keywords: [
      "AI blog", "AI for business", "AI best practices", "AI readiness",
      "AI news", "AI tools", "AI case studies", "AI TIMES", "AI implementation tips",
      "advanced tech", "AI chips", "quantum computing", "robotics", "space tech", "climate tech",
    ],
  });
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <ClientMessages area="pagesBlog">{children}</ClientMessages>;
}
