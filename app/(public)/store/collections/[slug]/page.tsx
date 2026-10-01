import { pageSales, withProductSales } from "@/lib/promotions/display";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import prisma from "@/lib/prisma";

/** Shared by generateMetadata and the page; see store/[slug] for why. */
const getCollection = cache(async (slug: string) =>
  prisma.collection.findUnique({ where: { slug } }).catch(() => null),
);
import CollectionView from "@/components/shop/CollectionView";
import { getLocale, getT } from "@/lib/i18n/server";
import { fitTitle, pageMetadata } from "@/lib/seo/meta";
import type { ShopProduct } from "@/components/shop/types";

// Rendered on every request. A cached listing went stale on the hosted
// deployment (publishing a product in admin did not show it in the store),
// and the store is small enough that a live query costs nothing noticeable.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c || !c.published) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: `/store/collections/${c.slug}`,
    locale,
    title: fitTitle([c.name]),
    absoluteTitle: true,
    description: c.description || t("pages.store.meta.collectionDescription", { name: c.name }),
    image: c.image ? { url: c.image, alt: c.name } : undefined,
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c || !c.published) return notFound();

  const raw = await prisma.product
    .findMany({ where: { published: true, collections: { has: slug } }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] })
    .catch(() => []);

  const products: ShopProduct[] = withProductSales(raw, await pageSales()).map((p) => ({
    id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, description: p.description,
    price: p.price, compareAtPrice: p.compareAtPrice, currency: p.currency, images: p.images,
    category: p.category, collections: p.collections, tags: p.tags, stock: p.stock, digital: p.digital,
    featured: p.featured, onSale: p.onSale, soldCount: p.soldCount,
  }));

  return (
    <CollectionView
      collection={{ slug: c.slug, name: c.name, description: c.description, image: c.image, featured: c.featured }}
      products={products}
    />
  );
}
