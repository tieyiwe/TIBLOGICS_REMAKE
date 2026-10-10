import { Plus } from "lucide-react";
import { Button, PageHeader, StatCard } from "@/components/admin/ui";
import { listPromotions, redemptionTotals, getReferralSetting } from "@/lib/promotions/service";
import { referralCouponId } from "@/lib/learn/referrals/service";
import { promoStatus } from "@/lib/promotions/shared";
import { serialise } from "@/lib/promotions/admin";
import PromotionsList, { type ListRow } from "./_components/PromotionsList";
import ReferralSettingCard from "./_components/ReferralSettingCard";
import { requirePromotionsPage, scopeOptions } from "./_components/data";
import { usd } from "./_components/format";

export const dynamic = "force-dynamic";

// Promotions: promo codes and automatic sales the owner runs from here.
// Publishing creates the Stripe coupon (and promotion code) at once; checkout
// reads promotions per request, so a publish or pause takes effect
// immediately. Owner or admin only.
export default async function PromotionsPage() {
  await requirePromotionsPage();
  const [promos, totals, referral, opts] = await Promise.all([listPromotions(), redemptionTotals(), getReferralSetting(), scopeOptions()]);
  const rows: ListRow[] = promos.map((p) => ({
    ...serialise(p),
    revenueCents: totals.get(p.id)?.revenue ?? 0,
    discountGivenCents: totals.get(p.id)?.discount ?? 0,
  }));
  const live = promos.filter((p) => promoStatus(p) === "live").length;
  const scheduled = promos.filter((p) => promoStatus(p) === "scheduled").length;
  const redemptions = promos.reduce((n, p) => n + p.redemptionCount, 0);
  const revenue = rows.reduce((n, r) => n + r.revenueCents, 0);
  const given = rows.reduce((n, r) => n + r.discountGivenCents, 0);
  const names: Record<string, string> = Object.fromEntries([...opts.tracks, ...opts.products].map((o) => [o.id, o.label]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        subtitle="Promo codes and automatic sales for ARFA · AI Academy, the store, Toolkit Live, Blueprints and events. Live the moment you publish."
        actions={<Button variant="primary" icon={Plus} href="/admin_pro/promotions/new">New promotion</Button>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live now" value={live} hint={scheduled ? `${scheduled} scheduled` : "None scheduled"} tone={live ? "success" : "default"} />
        <StatCard label="Redemptions" value={redemptions.toLocaleString("en")} hint="Paid checkouts, all time" />
        <StatCard label="Revenue influenced" value={usd(revenue)} hint="Paid after discount" />
        <StatCard label="Discounts given" value={usd(given)} hint="Off list prices" />
      </div>
      <PromotionsList rows={rows} names={names} />
      <ReferralSettingCard initial={referral} envCouponSet={!!referralCouponId()} />
    </div>
  );
}
