import { pageSales, withProductSales } from "@/lib/promotions/display";
import prisma from "@/lib/prisma";
import { cachedPublicData } from "@/lib/cache/public-data";
import StoreFront from "@/components/shop/StoreFront";
import type { ShopProduct, ShopCollection } from "@/components/shop/types";
import { pickSpotlight, daysUntilRotation } from "@/lib/shop/spotlight";
import { ensureStoreCatalog, sortStoreProducts } from "@/lib/shop/ensure-catalog";

// Rendered on every request. A cached page went stale on the hosted
// deployment (publishing a product in admin did not show it in the store),
// so only the rows are cached, and a write drops them at once.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  // Not wrapped in .catch(() => []): a failed query shows the error page
  // instead of an empty storefront that looks like the shop has no products.
  // The rows are cached in process and dropped by any write to Product or
  // Collection (lib/cache/public-data.ts); errors are never cached.
  //
  // First, make sure every toolkit defined in code is in the database and
  // renderable (once per process; see lib/shop/ensure-catalog.ts).
  await ensureStoreCatalog();
  const [rawProducts, rawCollections, sales] = await Promise.all([
    cachedPublicData("shop", "products:published", () =>
      prisma.product.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      }),
    ),
    cachedPublicData("shop", "collections:published", () =>
      prisma.collection.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    ),
    // A live automatic sale (admin: /admin_pro/promotions) shows as a
    // strike-through price; checkout recomputes it on the server.
    pageSales(),
  ]);
  const products: ShopProduct[] = withProductSales(sortStoreProducts(rawProducts), sales).map((p) => ({
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
