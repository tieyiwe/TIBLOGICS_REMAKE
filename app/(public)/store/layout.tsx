import ClientMessages from "@/components/i18n/ClientMessages";
import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import { CartProvider } from "@/components/shop/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/store",
    locale,
    title: t("seo.meta.store.title"),
    description: t("seo.meta.store.description"),
  });
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientMessages area="pagesStore">
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </ClientMessages>
  );
}
