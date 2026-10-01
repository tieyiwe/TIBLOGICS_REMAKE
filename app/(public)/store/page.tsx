import prisma from "@/lib/prisma";
import StoreFront from "@/components/shop/StoreFront";
import type { ShopProduct, ShopCollection } from "@/components/shop/types";
import { pickSpotlight, daysUntilRotation } from "@/lib/shop/spotlight";

// Rendered on every request. A cached listing went stale on the hosted
// deployment (publishing a product in admin did not show it in the store),
// and the store is small enough that a live query costs nothing noticeable.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  // Not wrapped in .catch(() => []): a failed query shows the error page
  // instead of an empty storefront that looks like the shop has no products.
  const [rawProducts, rawCollections] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.collection.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
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
    fileFormat: p.fileFormat,
  }));

  const collections: ShopCollection[] = rawCollections.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    image: c.image,
    featured: c.featured,
  }));

  // The spotlight rotates on a fixed cadence so every featured product gets
  // its turn, instead of one being pinned to the top permanently. Computed on
  // the server from the date, so all visitors in a period see the same pick
  // and the markup stays cacheable.
  const featured = products.filter((p) => p.featured);
  const spotlight = pickSpotlight(featured);

  return (
    <StoreFront
      products={products}
      collections={collections}
      spotlightSlug={spotlight?.slug ?? null}
      rotatesInDays={daysUntilRotation()}
      featuredCount={featured.length}
    />
  );
}
