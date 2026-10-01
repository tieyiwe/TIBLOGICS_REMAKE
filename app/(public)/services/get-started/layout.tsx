import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/services/get-started",
    locale,
    title: t("pages.getStarted.meta.title"),
    description: t("seo.meta.getStarted.description"),
  });
}

export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
