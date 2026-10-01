import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/events",
    locale,
    title: t("pages.events.meta.title"),
    description: t("pages.events.meta.description"),
    socialDescription: t("pages.events.meta.ogDescription"),
  });
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
