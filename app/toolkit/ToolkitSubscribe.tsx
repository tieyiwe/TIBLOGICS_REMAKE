"use client";
import { useState } from "react";
import { Check, Loader2, ShieldCheck, Wand2 } from "lucide-react";
import ToolkitShell from "./ToolkitShell";
import { useLocale, useT } from "@/lib/i18n/client";

interface PlanCard {
  id: "toolkit" | "guard";
  name: string;
  blurb: string;
  amount: number | null;
  monthlyRuns: number;
}

const money = (c: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: c % 100 === 0 ? 0 : 2 }).format(c / 100);

export default function ToolkitSubscribe(props: {
  email: string;
  preselect: "toolkit" | "guard";
  pastStatus: string | null;
  hasBilling: boolean;
  welcome: boolean;
  plans: PlanCard[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();

  async function subscribe(plan: string) {
    setBusy(plan);
    setError(null);
    const res = await fetch("/api/toolkit/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && d.url) {
      window.location.href = d.url;
      return;
    }
    setError(d.error ?? t("toolkit.sub.checkoutFailed"));
    setBusy(null);
  }

  return (
    <ToolkitShell email={props.email}>
      {props.welcome && (
        <div className="mb-6 rounded-2xl border border-[#D2DCE8] bg-white p-5 font-dm text-sm text-[#3A4A5C]">
          {t("toolkit.sub.welcome")}{" "}
          <button onClick={() => window.location.reload()} className="text-[#2251A3] underline">{t("toolkit.sub.refresh")}</button>
        </div>
      )}
      {props.pastStatus === "canceled" && !props.welcome && (
        <div className="mb-6 rounded-2xl border border-[#D2DCE8] bg-white p-5 font-dm text-sm text-[#3A4A5C]">
          {t("toolkit.sub.ended")}
        </div>
      )}
      <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-[#0D1B2A]">{t("toolkit.sub.title")}</h1>
      <p className="font-dm text-sm text-[#7A8FA6] mt-1">{t("toolkit.sub.subtitle")}</p>
      <div className="grid md:grid-cols-2 gap-5 mt-6">
        {props.plans.map((p) => (
          <div key={p.id} className={`bg-white rounded-2xl p-6 border ${p.id === props.preselect ? "border-[#B8500A] shadow-[0_8px_32px_rgba(184,80,10,0.12)]" : "border-[#D2DCE8]"}`}>
            <div className="flex items-center gap-2">
              {p.id === "toolkit" ? <Wand2 size={20} className="text-[#B8500A]" /> : <ShieldCheck size={20} className="text-[#2251A3]" />}
              <h2 className="font-syne font-bold text-xl text-[#0D1B2A]">{p.name}</h2>
            </div>
            <p className="font-dm text-sm text-[#3A4A5C] mt-2">{t(`toolkit.plan.${p.id}.blurb`)}</p>
            <p className="font-dm text-sm text-[#3A4A5C] mt-3 flex gap-2"><Check size={16} className="text-green-600 mt-0.5" />{t("toolkit.sub.runs", { n: p.monthlyRuns.toLocaleString(locale) })}</p>
            <div className="mt-6 flex items-end justify-between gap-3">
              {p.amount ? (
                <>
                  <p className="font-syne font-extrabold text-3xl text-[#0D1B2A]">{money(p.amount, locale)}<span className="font-dm text-base font-medium text-[#7A8FA6]"> {t("toolkit.sub.perMonth")}</span></p>
                  <button onClick={() => subscribe(p.id)} disabled={!!busy} className="btn-primary disabled:opacity-60">
                    {busy === p.id && <Loader2 size={15} className="animate-spin" />}{t("toolkit.sub.subscribe")}
                  </button>
                </>
              ) : (
                <p className="font-dm text-sm font-semibold text-[#7A8FA6]">{t("toolkit.sub.soon")}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="font-dm text-sm text-red-600 mt-4">{error}</p>}
    </ToolkitShell>
  );
}
