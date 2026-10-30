import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/products",
    locale,
    title: t("pages.products.meta.title"),
    description: t("pages.products.meta.description"),
    socialTitle: t("pages.products.meta.ogTitle"),
    socialDescription: t("pages.products.meta.ogDescription"),
  });
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
