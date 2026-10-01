import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/contact",
    locale,
    title: t("pages.contact.meta.title"),
    description: t("pages.contact.meta.description"),
    socialTitle: t("pages.contact.meta.ogTitle"),
    socialDescription: t("pages.contact.meta.ogDescription"),
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
