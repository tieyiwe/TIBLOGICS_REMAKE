import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/services",
    locale,
    title: t("pages.services.meta.title"),
    description: t("pages.services.meta.description"),
    socialTitle: t("pages.services.meta.ogTitle"),
    socialDescription: t("pages.services.meta.ogDescription"),
    keywords: [
      "AI implementation services", "workflow automation", "AI strategy consulting",
      "web development", "cybersecurity", "data analytics", "mobile development",
      "AI training", "AI academy", "IoT systems",
    ],
  });
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
