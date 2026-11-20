"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, Lock, LogOut, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { useCalc } from "./context";
import { inputCls } from "./ui";

// The Full Plan: what it adds, the price and the checkout, or its status when
// active. Paid sections render <PaidSection>, which shows a locked card in
// their place until the plan is active.

export const PLAN_FEATURES = ["build", "pricing", "scenarios", "savings", "export", "ai"] as const;

export function PlanCard() {
  const t = useT();
  const { plan, buyPlan, forgetPlan } = useCalc();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan.loaded) return null;

  if (plan.full) {
    const until = plan.expiresAt ? new Date(plan.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : null;
    return (
      <div id="plan" data-testid="plan-active" className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#BFE3C9] bg-[#EEF9F1] px-4 py-3 font-dm text-sm text-[#166534] scroll-mt-28">
        <span className="flex items-center gap-2">
          <Sparkles size={16} aria-hidden />
          {plan.via === "staff" ? t("calculator.plan.activeStaff") : t("calculator.plan.active", { date: until ?? "" })}
        </span>
        {plan.via === "plan" && (
          <button type="button" onClick={() => void forgetPlan()} className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2">
            <LogOut size={12} aria-hidden />
            {t("calculator.plan.forget")}
          </button>
        )}
      </div>
    );
  }

  async function buy(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await buyPlan(email.trim() || undefined);
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <section id="plan" aria-labelledby="plan-title" data-testid="plan-card" className="no-print calc-card rounded-2xl border-2 border-[#F47C20] bg-white p-5 sm:p-6 scroll-mt-28">
      <div className="grid md:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF0E3] px-3 py-1 font-dm text-xs font-bold text-[#9A4A00]">
            <Sparkles size={13} aria-hidden />
            {t("calculator.plan.tag")}
          </span>
          <h2 id="plan-title" className="font-syne font-extrabold text-xl sm:text-2xl text-[#0D1B2A] mt-2">
            {t("calculator.plan.title")}
          </h2>
          <p className="font-dm text-sm text-[#3A4A5C] mt-1">{t("calculator.plan.body")}</p>
          <ul className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {PLAN_FEATURES.map((k) => (
              <li key={k} className="flex items-start gap-2 font-dm text-sm text-[#0D1B2A]">
                <Check size={16} className="shrink-0 mt-0.5 text-[#166534]" aria-hidden />
                {t(`calculator.plan.f.${k}`)}
              </li>
            ))}
          </ul>
          <p className="font-dm text-xs text-[#5B6B7F] mt-3">{t("calculator.plan.freeStays")}</p>
        </div>
        <div className="rounded-xl bg-[#F4F7FB] p-4">
          {plan.price ? (
            <form onSubmit={buy} className="space-y-3">
              <p className="font-syne font-extrabold text-3xl text-[#0D1B2A]">
                {plan.price}
                <span className="font-dm text-sm font-normal text-[#5B6B7F]"> {t("calculator.plan.once", { days: plan.days })}</span>
              </p>
              <label className="block">
                <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{t("calculator.plan.email")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  autoComplete="email"
                  placeholder={t("calculator.plan.emailPh")}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <button type="submit" disabled={busy} data-testid="plan-buy" className="btn-primary w-full justify-center disabled:opacity-60">
                <Lock size={16} aria-hidden />
                {busy ? t("calculator.plan.opening") : t("calculator.plan.buy", { price: plan.price })}
              </button>
              {error && <p role="alert" className="font-dm text-xs text-[#B42318]">{error}</p>}
              <p className="font-dm text-[11px] text-[#5B6B7F]">{t("calculator.plan.secure")}</p>
            </form>
          ) : (
            <p className="font-dm text-sm text-[#3A4A5C]">{t("calculator.plan.offSale")}</p>
          )}
          <Link href="/book?from=calculator" className="mt-3 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-[#2251A3] underline underline-offset-2">
            <CalendarCheck size={15} aria-hidden />
            {t("calculator.plan.call")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** A paid section: the real one with the Full Plan, a short locked card without. */
export function PaidSection({
  id,
  step,
  titleKey,
  teaserKey,
  children,
}: {
  id: string;
  step: number;
  titleKey: string;
  teaserKey: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const { full, fullStale, plan } = useCalc();
  if (full) {
    return (
      <div className={`transition-opacity ${fullStale ? "opacity-70" : ""}`} aria-busy={fullStale}>
        {children}
      </div>
    );
  }
  return (
    <section id={id} aria-labelledby={`${id}-title`} data-testid={`locked-${id}`} className="calc-card bg-white border border-dashed border-[#B9C7D8] rounded-2xl p-5 sm:p-6 scroll-mt-28">
      <div className="flex items-start gap-3">
        <span aria-hidden className="shrink-0 w-8 h-8 rounded-full bg-[#E4EAF2] text-[#5B6B7F] font-syne font-bold text-sm flex items-center justify-center">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="font-syne font-bold text-lg sm:text-xl text-[#0D1B2A] leading-tight flex items-center gap-2">
            {t(titleKey)}
            <Lock size={16} className="text-[#B8500A]" aria-label={t("calculator.plan.lockedLabel")} />
          </h2>
          <p className="font-dm text-sm text-[#3A4A5C] mt-1">{t(teaserKey)}</p>
          {plan.loaded && plan.full ? (
            <p className="font-dm text-xs text-[#5B6B7F] mt-3">{t("calculator.plan.loading")}</p>
          ) : (
            <a href="#plan" className="no-print mt-3 inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-[#B8500A] underline underline-offset-2">
              {plan.price ? t("calculator.plan.unlockWith", { price: plan.price }) : t("calculator.plan.unlock")}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
