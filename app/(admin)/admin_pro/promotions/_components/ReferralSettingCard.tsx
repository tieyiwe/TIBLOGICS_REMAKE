"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { Badge, Button, Card, Segmented, Select, useConfirm, useToast } from "@/components/admin/ui";
import { discountLabel, durationLabel, type PromoDuration, type PromoKind } from "@/lib/promotions/shared";
import type { ReferralSetting } from "@/lib/promotions/service";
import { api } from "./format";
import { hintCls, inputCls, labelCls } from "./fields";

export default function ReferralSettingCard({ initial, envCouponSet }: { initial: ReferralSetting | null; envCouponSet: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [setting, setSetting] = useState<ReferralSetting | null>(initial);
  const [kind, setKind] = useState<PromoKind>(initial?.kind ?? "percent");
  const [value, setValue] = useState(initial ? String(initial.kind === "percent" ? initial.percentOff : (initial.amountOffCents ?? 0) / 100) : "20");
  const [duration, setDuration] = useState<PromoDuration>(initial?.duration ?? "once");
  const [months, setMonths] = useState(String(initial?.durationMonths ?? 3));
  const [busy, setBusy] = useState<"save" | "off" | null>(null);
  const on = !!setting?.enabled;

  async function save() {
    const n = Number(value);
    if (!(n > 0)) return toast.error("Enter a discount", kind === "percent" ? "Between 1 and 100." : "In dollars, for example 15.");
    const ok = await confirm({
      title: "Create the referral coupon in Stripe?",
      body: "New referred learners get this discount on their first checkout, instead of the STRIPE_REFERRAL_COUPON_ID coupon. Checkouts already open keep theirs.",
      confirmLabel: "Create and use it",
      danger: false,
    });
    if (!ok) return;
    setBusy("save");
    try {
      const res = await api<{ setting: ReferralSetting }>("/api/admin/promotions/referral", {
        body: {
          kind,
          percentOff: kind === "percent" ? n : null,
          amountOffCents: kind === "amount" ? Math.round(n * 100) : null,
          duration,
          durationMonths: duration === "repeating" ? Number(months) || 1 : null,
        },
      });
      setSetting(res.setting);
      toast.success("Referral welcome discount is on", `${discountLabel(res.setting)}, ${durationLabel(res.setting)} on subscriptions.`);
    } catch (err) {
      toast.error("Could not save the referral discount", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function off() {
    const ok = await confirm({
      title: "Turn off the admin referral discount?",
      body: envCouponSet ? "Referred learners go back to the STRIPE_REFERRAL_COUPON_ID coupon." : "Referred learners get no welcome discount (STRIPE_REFERRAL_COUPON_ID is not set).",
      confirmLabel: "Turn off",
    });
    if (!ok) return;
    setBusy("off");
    try {
      const res = await api<{ setting: ReferralSetting | null }>("/api/admin/promotions/referral", { method: "DELETE" });
      setSetting(res.setting);
      toast.success("Admin referral discount is off");
    } catch (err) {
      toast.error("Could not turn it off", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card
      icon={Gift}
      title="Referral welcome discount"
      subtitle="What a referred learner gets off their first ARFA checkout. Used only when no promo code or sale applies."
      action={
        on ? <Badge tone="success" dot>On</Badge> : envCouponSet ? <Badge tone="info">Using environment coupon</Badge> : <Badge tone="neutral">Off</Badge>
      }
    >
      {on && setting ? (
        <p className="mb-4 font-dm text-[13.5px] text-[var(--a-ink-2)]">
          Now: <strong className="text-[var(--a-ink)]">{discountLabel(setting)}</strong>, {durationLabel(setting)} on subscriptions. Stripe coupon{" "}
          <code className="font-mono text-[12px]">{setting.couponId}</code>. This overrides STRIPE_REFERRAL_COUPON_ID.
        </p>
      ) : (
        <p className="mb-4 font-dm text-[13.5px] text-[var(--a-ink-2)]">
          {envCouponSet ? "Referred learners get the coupon in STRIPE_REFERRAL_COUPON_ID. Set a discount here to replace it." : "No referral welcome discount is set. Set one here."}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div>
          <span className={labelCls}>Type</span>
          <Segmented
            ariaLabel="Referral discount type"
            value={kind}
            onChange={(v) => setKind(v as PromoKind)}
            options={[{ value: "percent", label: "Percent" }, { value: "amount", label: "Amount (USD)" }]}
          />
        </div>
        <label className="block">
          <span className={labelCls}>{kind === "percent" ? "Percent off" : "Amount off (USD)"}</span>
          <input className={inputCls} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="ref-value-hint" />
          <span id="ref-value-hint" className={hintCls}>{kind === "percent" ? "1 to 100" : "For example 15 or 9.99"}</span>
        </label>
        <label className="block">
          <span className={labelCls}>On subscriptions</span>
          <Select value={duration} onChange={(e) => setDuration(e.target.value as PromoDuration)} className="w-full" label="Duration on subscriptions">
            <option value="once">First payment only</option>
            <option value="repeating">For a number of months</option>
            <option value="forever">Every payment</option>
          </Select>
        </label>
        {duration === "repeating" ? (
          <label className="block">
            <span className={labelCls}>Months</span>
            <input className={inputCls} inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
          </label>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={save} loading={busy === "save"}>{on ? "Replace referral discount" : "Set referral discount"}</Button>
        {on ? <Button variant="secondary" onClick={off} loading={busy === "off"}>Turn off</Button> : null}
      </div>
    </Card>
  );
}
