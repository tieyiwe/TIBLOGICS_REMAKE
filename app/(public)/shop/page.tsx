import prisma from "@/lib/prisma";
import StoreFront from "@/components/shop/StoreFront";
import type { ShopProduct, ShopCollection } from "@/components/shop/types";

export const revalidate = 30;

export default async function ShopPage() {
  const [rawProducts, rawCollections] = await Promise.all([
    prisma.product
      .findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] })
      .catch(() => []),
    prisma.collection
      .findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })
      .catch(() => []),
  ]);

  const products: ShopProduct[] = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency,
    images: p.images,
    category: p.category,
    collections: p.collections,
    tags: p.tags,
    stock: p.stock,
    digital: p.digital,
    featured: p.featured,
    onSale: p.onSale,
    soldCount: p.soldCount,
  }));

  const collections: ShopCollection[] = rawCollections.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    image: c.image,
    featured: c.featured,
  }));

  return <StoreFront products={products} collections={collections} />;
}
