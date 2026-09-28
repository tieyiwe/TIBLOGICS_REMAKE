"use client";

import { Lightbulb, PiggyBank } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { recommendationText } from "@/lib/calculator/summary";
import { useCalc, useFmt } from "./context";
import { Section } from "./ui";

export default function RecommendationsSection() {
  const t = useT();
  const f = useFmt();
  const { inputs, results } = useCalc();
  const recs = results.recommendations;
  const totalSaving = recs.filter((r) => r.saving).reduce((s, r) => s + r.amount, 0);

  return (
    <Section id="savings" step={7} title={t("calculator.recs.title")} subtitle={t("calculator.recs.subtitle")}>
      {recs.length === 0 ? (
        <p className="font-dm text-sm text-[#3A4A5C]">{t("calculator.recs.none")}</p>
      ) : (
        <>
          <ul className="grid md:grid-cols-2 gap-3">
            {recs.map((r) => {
              const { title, body } = recommendationText(r, inputs, t, f);
              const Icon = r.saving ? PiggyBank : Lightbulb;
              return (
                <li key={r.id} className="rounded-xl border border-[#D2DCE8] p-4 flex gap-3 break-inside-avoid">
                  <Icon size={20} className={`shrink-0 mt-0.5 ${r.saving ? "text-[#166534]" : "text-[#B8500A]"}`} aria-hidden />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="font-syne font-bold text-sm text-[#0D1B2A]">{title}</h3>
                      <span
                        className={`font-dm text-xs font-bold rounded-full px-2.5 py-0.5 tabular-nums ${
                          r.saving ? "bg-[#EEF9F1] text-[#166534]" : "bg-[#FEF0E3] text-[#9A4A00]"
                        }`}
                      >
                        {r.saving
                          ? t("calculator.recs.save", { amount: f.money(r.amount) })
                          : t("calculator.recs.amount", { amount: f.money(r.amount) })}
                      </span>
                    </div>
                    <p className="font-dm text-sm text-[#3A4A5C] mt-1 leading-relaxed">{body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="font-dm text-xs text-[#5B6B7F] mt-3">
            {totalSaving > 0 ? t("calculator.recs.overlap") + " " : ""}
            {t("calculator.recs.test")}
          </p>
        </>
      )}
    </Section>
  );
}
