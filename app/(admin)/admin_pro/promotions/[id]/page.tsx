import { notFound } from "next/navigation";
import { Receipt } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, StatCard, tableStyles } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { getPromotion, listRedemptions } from "@/lib/promotions/service";
import { serialise } from "@/lib/promotions/admin";
import { fmtZoned } from "@/lib/promotions/shared";
import PromotionEditor from "../_components/PromotionEditor";
import { requirePromotionsPage, scopeOptions } from "../_components/data";
import { usd } from "../_components/format";

export const dynamic = "force-dynamic";

const PRODUCT: Record<string, string> = {
  learn: "ARFA monthly",
  "learn-track": "ARFA track",
  "learn-team": "ARFA team",
  "toolkit-live": "Toolkit Live",
  blueprint: "Blueprint",
  store: "Store order",
  event: "Event",
};
const SOURCE: Record<string, string> = { code: "Our code field", auto: "Automatic", stripe_code: "Code at Stripe" };

export default async function PromotionPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePromotionsPage();
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) notFound();
  const [promo, redemptions, opts] = await Promise.all([getPromotion(id), listRedemptions(id), scopeOptions()]);
  if (!promo) notFound();
  const revenue = redemptions.reduce((n, r) => n + r.totalCents, 0);
  const given = redemptions.reduce((n, r) => n + r.discountCents, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={promo.name}
        subtitle={promo.mode === "code" ? `Promo code ${promo.code ?? "(not set)"}` : "Automatic sale"}
        breadcrumb={[{ label: "Promotions", href: "/admin_pro/promotions" }, { label: promo.name }]}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Redemptions" value={promo.redemptionCount.toLocaleString("en")} hint={promo.maxRedemptions ? `of ${promo.maxRedemptions.toLocaleString("en")} allowed` : "No limit"} />
        <StatCard label="Revenue influenced" value={usd(revenue)} hint="Paid after discount" />
        <StatCard label="Discounts given" value={usd(given)} />
        <StatCard label="Average order" value={redemptions.length ? usd(Math.round(revenue / redemptions.length)) : "None yet"} />
      </div>

      <PromotionEditor promotion={serialise(promo)} tracks={opts.tracks} products={opts.products} />

      <Card title="Redemptions" subtitle="Paid checkouts that used this promotion, from the Stripe webhook." icon={Receipt} padded={false}>
        {redemptions.length === 0 ? (
          <EmptyState compact icon={Receipt} title="No redemptions yet" body="They appear here as soon as a discounted checkout is paid." />
        ) : (
          <>
            <div className={cn("hidden overflow-x-auto md:block")}>
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.th}>When (Toronto)</th>
                    <th className={tableStyles.th}>Customer</th>
                    <th className={tableStyles.th}>Product</th>
                    <th className={tableStyles.th}>How</th>
                    <th className={cn(tableStyles.th, "text-right")}>Before</th>
                    <th className={cn(tableStyles.th, "text-right")}>Discount</th>
                    <th className={cn(tableStyles.th, "text-right")}>Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r.id} className={tableStyles.tr}>
                      <td className={tableStyles.td}>{fmtZoned(r.createdAt)}</td>
                      <td className={tableStyles.td}>{r.email ?? "Unknown"}</td>
                      <td className={tableStyles.td}>{PRODUCT[r.product ?? ""] ?? r.product ?? "Other"}</td>
                      <td className={tableStyles.td}><Badge tone={r.source === "auto" ? "info" : "neutral"}>{SOURCE[r.source] ?? r.source}</Badge></td>
                      <td className={cn(tableStyles.td, "text-right tabular-nums")}>{usd(r.subtotalCents)}</td>
                      <td className={cn(tableStyles.td, "text-right tabular-nums")}>-{usd(r.discountCents)}</td>
                      <td className={cn(tableStyles.td, "text-right tabular-nums font-semibold text-[var(--a-ink)]")}>{usd(r.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-[var(--a-border)] md:hidden">
              {redemptions.map((r) => (
                <li key={r.id} className="px-4 py-3 font-dm text-[13px]">
                  <p className="break-words font-semibold text-[var(--a-ink)]">{r.email ?? "Unknown"}</p>
                  <p className="mt-0.5 text-[var(--a-ink-3)]">{fmtZoned(r.createdAt)} · {PRODUCT[r.product ?? ""] ?? r.product ?? "Other"}</p>
                  <p className="mt-1 tabular-nums text-[var(--a-ink-2)]">{usd(r.subtotalCents)} − {usd(r.discountCents)} = <strong>{usd(r.totalCents)}</strong></p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
