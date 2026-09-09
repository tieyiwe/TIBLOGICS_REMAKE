import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import CollectionView from "@/components/shop/CollectionView";
import type { ShopProduct } from "@/components/shop/types";

export const revalidate = 30;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await prisma.collection.findUnique({ where: { slug } }).catch(() => null);
  if (!c || !c.published) return {};
  return {
    title: `${c.name} | TIBLOGICS Shop`,
    description: (c.description || `Shop the ${c.name} collection`).slice(0, 160),
    openGraph: { title: c.name, description: c.description.slice(0, 160), images: c.image ? [{ url: c.image }] : undefined },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const c = await prisma.collection.findUnique({ where: { slug } }).catch(() => null);
  if (!c || !c.published) return notFound();

  const raw = await prisma.product
    .findMany({ where: { published: true, collections: { has: slug } }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] })
    .catch(() => []);

  const products: ShopProduct[] = raw.map((p) => ({
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
