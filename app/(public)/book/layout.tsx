import ClientMessages from "@/components/i18n/ClientMessages";
import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/book",
    locale,
    title: t("pages.book.meta.title"),
    description: t("pages.book.meta.description"),
    socialTitle: t("pages.book.meta.ogTitle"),
    socialDescription: t("pages.book.meta.ogDescription"),
  });
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientMessages area="pagesBook">
      <div className="pt-16 min-h-screen bg-[#F4F7FB]">{children}</div>
    </ClientMessages>
  );
}
