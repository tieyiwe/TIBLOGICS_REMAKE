import { revalidatePath } from "next/cache";

/**
 * Drop the cached storefront pages after anything that changes what the shop
 * shows.
 *
 * The listing is ISR-cached (good for traffic and database cost), which means
 * without this an admin adds a product and sees nothing until the window
 * expires — and on a fresh deploy the page can be prerendered from an empty
 * database and serve an empty shop.
 */
export function revalidateShop(slug?: string) {
  try {
    revalidatePath("/shop");
    revalidatePath("/shop/collections/[slug]", "page");
    if (slug) revalidatePath(`/shop/${slug}`);
  } catch (err) {
    // Never let cache housekeeping fail the write that triggered it.
    console.error("[shop] revalidate failed", err);
  }
}
