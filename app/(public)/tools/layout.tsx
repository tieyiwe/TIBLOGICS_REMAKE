import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/tools",
    locale,
    title: t("tools.meta.title"),
    description: t("tools.meta.description"),
    socialTitle: t("tools.meta.ogTitle"),
    socialDescription: t("tools.meta.ogDescription"),
    keywords: [
      "website AI scanner", "AI readiness test", "AI cost calculator",
      "automation blueprint", "prompt library", "free AI tools",
    ],
  });
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
