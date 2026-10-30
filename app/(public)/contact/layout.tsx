import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import ClientMessages from "@/components/i18n/ClientMessages";

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

// The donate box on this page (Partners) needs its texts on the client.
export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <ClientMessages area={["donate", "pagesContact"]}>{children}</ClientMessages>;
}
