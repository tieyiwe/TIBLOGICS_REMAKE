import { pageSales, withProductSales } from "@/lib/promotions/display";
import { cleanCopy, cleanLine } from "@/lib/text/clean-copy";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { cachedPublicData } from "@/lib/cache/public-data";
import { ensureStoreCatalog } from "@/lib/shop/ensure-catalog";

/**
 * generateMetadata and the page component both need this row, and Next calls
 * them separately — so every product page ran the same findUnique twice.
 * React's cache() dedupes it within a single render pass.
 */
const getProduct = cache(async (slug: string) => {
  // A toolkit added in code must not 404 before anyone opens the store.
  await ensureStoreCatalog();
  // Public data, cached until a product changes (lib/cache/public-data.ts).
  // Errors are not cached.
  return cachedPublicData("shop", `product:${slug}`, () => prisma.product.findUnique({ where: { slug } })).catch(() => null);
});
import ProductDetail from "@/components/shop/ProductDetail";
import { getLocale, getT } from "@/lib/i18n/server";
import { fitTitle, pageMetadata, plain } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode, productNode } from "@/lib/seo/jsonld";
import type { ShopProduct } from "@/components/shop/types";

// Rendered on every request. A cached page went stale on the hosted
// deployment (publishing a product in admin did not show it in the store).
// Only the product rows are cached, in process, and any write to Product or
// Collection drops them at once (lib/cache/public-data.ts).
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function toShopProduct(p: {
  id: string; slug: string; name: string; tagline: string | null; description: string;
  price: number; compareAtPrice: number | null; currency: string; images: string[];
  category: string; collections: string[]; tags: string[]; stock: number | null; digital: boolean;
  featured: boolean; onSale: boolean; soldCount: number; fileFormat: string | null;
}): ShopProduct {
  return {
    // Pasted copy can carry markdown and stray characters (lib/text/clean-copy).
    id: p.id, slug: p.slug, name: cleanLine(p.name), tagline: p.tagline ? cleanLine(p.tagline) : null, description: cleanCopy(p.description),
    price: p.price, compareAtPrice: p.compareAtPrice, currency: p.currency, images: p.images,
    category: p.category, collections: p.collections, tags: p.tags, stock: p.stock, digital: p.digital,
    featured: p.featured, onSale: p.onSale, soldCount: p.soldCount, fileFormat: p.fileFormat,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  // A real 404 for crawlers that get blocking metadata (next.config.js).
  if (!p || !p.published) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: `/store/${p.slug}`,
    locale,
    title: fitTitle([p.name]),
    absoluteTitle: true,
    description: (p.tagline ? `${cleanLine(p.tagline)} ${plain(cleanCopy(p.description))}` : plain(cleanCopy(p.description))) || `${p.name}. ${t("seo.meta.store.description")}`,
    image: p.images?.[0] ? { url: p.images[0], alt: p.name } : undefined,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p || !p.published) return notFound();

  // Related products, sale prices and texts are independent: one round.
  const [related, sales, t] = await Promise.all([
    cachedPublicData("shop", `related:${p.id}:${p.category}`, () =>
      prisma.product.findMany({
        where: { published: true, category: p.category, NOT: { id: p.id } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }, { slug: "asc" }],
        take: 3,
      }),
    ).catch(() => []),
    // Live automatic sale prices (admin: /admin_pro/promotions), display only.
    pageSales(),
    getT(),
  ]);
  const [shown] = withProductSales([p], sales);
  return (
    <>
      {/* Product + Offer with the price shown on the page. No ratings:
          there are no real reviews to mark up. */}
      <JsonLd
        data={[
          productNode({
            slug: p.slug,
            name: p.name,
            description: plain(cleanCopy(p.tagline ? `${p.tagline}\n\n${p.description}` : p.description)).slice(0, 5000),
            priceCents: shown.price,
            currency: p.currency,
            images: p.images,
            category: p.category,
            sku: p.sku,
            inStock: p.stock == null || p.stock > 0,
            digital: p.digital,
          }),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("seo.store"), path: "/store" },
            { name: p.name, path: `/store/${p.slug}` },
          ]),
        ]}
      />
      <ProductDetail product={toShopProduct(shown)} related={withProductSales(related, sales).map(toShopProduct)} />
    </>
  );
}
