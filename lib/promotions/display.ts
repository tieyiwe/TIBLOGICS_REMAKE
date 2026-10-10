// Server helpers for public pages: the live automatic sale applied to the
// prices a page is about to show. Read per request; never throws (a failure
// shows list prices). Checkout recomputes everything on the server.
import { PLANS } from "@/lib/payments/provider";
import { saleContext } from "./service";
import type { CheckoutLine, SaleView } from "./shared";

export type SaleInfo = Pick<SaleView, "saleCents" | "originalCents" | "duration" | "durationMonths">;

const info = (v: SaleView | null): SaleInfo | null =>
  v ? { saleCents: v.saleCents, originalCents: v.originalCents, duration: v.duration, durationMonths: v.durationMonths } : null;

export interface PageSales {
  monthly: SaleInfo | null;
  track: (id: string, priceCents: number) => SaleInfo | null;
  product: (id: string, priceCents: number) => SaleInfo | null;
  line: (line: CheckoutLine) => SaleInfo | null;
}

export async function pageSales(): Promise<PageSales> {
  const ctx = await saleContext();
  if (!ctx.any) return { monthly: null, track: () => null, product: () => null, line: () => null };
  return {
    monthly: info(ctx.sale({ key: "arfa_monthly", id: "monthly", amountCents: PLANS.monthly.amount })),
    track: (id, priceCents) => info(ctx.sale({ key: "tracks", id, amountCents: priceCents })),
    product: (id, priceCents) => info(ctx.sale({ key: "store", id, amountCents: priceCents })),
    line: (l) => info(ctx.sale(l)),
  };
}

/** Tracks with their sale price (null when no sale applies). */
export function withTrackSales<T extends { id: string; priceCents: number }>(tracks: T[], s: PageSales): Array<T & { salePriceCents: number | null }> {
  return tracks.map((t) => ({ ...t, salePriceCents: s.track(t.id, t.priceCents)?.saleCents ?? null }));
}

/**
 * Store products as the storefront shows them: an automatic sale lowers
 * `price` and keeps the old one as `compareAtPrice`, so the existing
 * strike-through display (ProductCard, ProductDetail) shows it.
 */
export function withProductSales<T extends { id: string; price: number; compareAtPrice: number | null; onSale: boolean }>(products: T[], s: PageSales): T[] {
  return products.map((p) => {
    const sale = s.product(p.id, p.price);
    if (!sale) return p;
    const before = p.onSale && p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : p.price;
    return { ...p, price: sale.saleCents, compareAtPrice: before, onSale: true };
  });
}
