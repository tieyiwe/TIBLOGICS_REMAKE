import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import ShopClient, { type Order } from "./ShopClient";
import { listDownloadFiles } from "@/lib/shop/delivery-fields";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Products, collections and orders, rendered on the server (was fetched on mount). */
export default async function AdminShopPage() {
  await requireAdminPage();

  let needsSync = false;
  const [products, collections, orders] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }).catch((err) => {
      // A missing table: the page offers "Sync Database" instead of failing.
      console.error("[admin/shop page] products", err);
      needsSync = true;
      return [];
    }),
    prisma.collection.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }).catch(() => []),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []),
  ]);

  return (
    <ShopClient
      // Same shape the admin APIs return, dates as ISO strings.
      products={JSON.parse(JSON.stringify(products))}
      collections={JSON.parse(JSON.stringify(collections))}
      orders={JSON.parse(JSON.stringify(orders)) as Order[]}
      needsSync={needsSync}
      files={listDownloadFiles()}
    />
  );
}
