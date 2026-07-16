import prisma from "@/lib/prisma";
import StoreFront from "@/components/shop/StoreFront";
import type { ShopProduct } from "@/components/shop/types";

export const revalidate = 30;

export default async function ShopPage() {
  const raw = await prisma.product
    .findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    })
    .catch(() => []);

  const products: ShopProduct[] = raw.map((p) => ({
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
    tags: p.tags,
    stock: p.stock,
    digital: p.digital,
    featured: p.featured,
    onSale: p.onSale,
    soldCount: p.soldCount,
  }));

  return <StoreFront products={products} />;
}
