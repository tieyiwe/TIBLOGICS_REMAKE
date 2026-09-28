"use client";

import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/client";
import { COST_CATEGORIES } from "@/lib/calculator/types";
import { useCalc, useFmt } from "./context";
import { CATEGORY_COLORS } from "./colors";
import { NumberInput, Section } from "./ui";

const Charts = dynamic(() => import("./ScenarioCharts"), {
  ssr: false,
  loading: () => <div className="h-[340px] rounded-xl bg-[#F4F7FB] animate-pulse" aria-hidden />,
});

export default function ScenariosSection() {
  const t = useT();
  const f = useFmt();
  const { inputs: i, update, results } = useCalc();
  const sc = results.scenarios;

  const setMult = (key: "scenarioUsers" | "scenarioFixed", n: number, v: number) => {
    const next = [...i[key]] as [number, number, number];
    next[n] = v;
    update({ [key]: next });
  };

  const cell = "py-2 px-2 text-right tabular-nums";
  return (
    <Section id="scenarios" step={6} title={t("calculator.scenarios.title")} subtitle={t("calculator.scenarios.subtitle")}>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[520px] font-dm text-sm">
          <caption className="sr-only">{t("calculator.scenarios.caption")}</caption>
          <thead>
            <tr className="text-[#0D1B2A]">
              <th scope="col" className="text-left py-2 pr-2 font-semibold text-xs text-[#5B6B7F] w-[34%]">
                <span className="sr-only">{t("calculator.csv.item")}</span>
              </th>
              {sc.map((s) => (
                <th key={s.key} scope="col" className="py-2 px-2 text-right font-syne font-bold">
                  {t(`calculator.scenario.${s.key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[#E4EAF2] no-print">
              <th scope="row" className="text-left py-2 pr-2 font-medium text-[#3A4A5C]">{t("calculator.scenarios.userMult")}</th>
              {sc.map((s, n) => (
                <td key={s.key} className="py-1.5 px-2">
                  <NumberInput
                    ariaLabel={`${t("calculator.scenarios.userMult")}: ${t(`calculator.scenario.${s.key}`)}`}
                    value={i.scenarioUsers[n]}
                    onChange={(v) => setMult("scenarioUsers", n, v)}
                    step={0.5}
                    max={10_000}
                    suffix="x"
                    className="ml-auto max-w-[110px]"
                  />
                </td>
              ))}
            </tr>
            <tr className="border-t border-[#E4EAF2] no-print">
              <th scope="row" className="text-left py-2 pr-2 font-medium text-[#3A4A5C]">
                {t("calculator.scenarios.fixedMult")}
                <span className="block text-xs font-normal text-[#7A8FA6]">{t("calculator.scenarios.fixedMultHint")}</span>
              </th>
              {sc.map((s, n) => (
                <td key={s.key} className="py-1.5 px-2">
                  <NumberInput
                    ariaLabel={`${t("calculator.scenarios.fixedMult")}: ${t(`calculator.scenario.${s.key}`)}`}
                    value={i.scenarioFixed[n]}
                    onChange={(v) => setMult("scenarioFixed", n, v)}
                    step={0.5}
                    max={10_000}
                    suffix="x"
                    className="ml-auto max-w-[110px]"
                  />
                </td>
              ))}
            </tr>
            <tr className="border-t border-[#E4EAF2]">
              <th scope="row" className="text-left py-2 pr-2 font-medium text-[#3A4A5C]">{t("calculator.csv.users")}</th>
              {sc.map((s) => <td key={s.key} className={cell}>{f.num(s.m.users)}</td>)}
            </tr>
            {COST_CATEGORIES.map((c) => (
              <tr key={c} className="border-t border-[#E4EAF2]">
                <th scope="row" className="text-left py-2 pr-2 font-normal text-[#3A4A5C]">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle" style={{ background: CATEGORY_COLORS[c] }} aria-hidden />
                  {t(`calculator.cat.${c}`)}
                </th>
                {sc.map((s) => <td key={s.key} className={cell}>{f.money(s.m.categories[c])}</td>)}
              </tr>
            ))}
            <tr className="border-t-2 border-[#C3CFDD] font-semibold text-[#0D1B2A]">
              <th scope="row" className="text-left py-2 pr-2">{t("calculator.csv.totalCost")}</th>
              {sc.map((s) => <td key={s.key} className={cell}>{f.money(s.m.total)}</td>)}
            </tr>
            <tr className="border-t border-[#E4EAF2] text-[#0D1B2A]">
              <th scope="row" className="text-left py-2 pr-2 font-medium">{t("calculator.csv.revenue")}</th>
              {sc.map((s) => <td key={s.key} className={cell}>{f.money(s.m.revenue)}</td>)}
            </tr>
            <tr className="border-t border-[#E4EAF2] text-[#0D1B2A]">
              <th scope="row" className="text-left py-2 pr-2 font-medium">{t("calculator.pricing.grossMargin")}</th>
              {sc.map((s) => {
                const gm = s.m.grossMarginPct;
                return (
                  <td key={s.key} className={`${cell} font-semibold ${gm !== null && gm < 0 ? "text-[#B42318]" : gm !== null && gm < i.targetMarginPct ? "text-[#9A4A00]" : "text-[#166534]"}`}>
                    {gm === null ? "-" : f.pct(gm)}
                  </td>
                );
              })}
            </tr>
            <tr className="border-t border-[#E4EAF2] text-[#0D1B2A]">
              <th scope="row" className="text-left py-2 pr-2 font-medium">{t("calculator.csv.profit")}</th>
              {sc.map((s) => (
                <td key={s.key} className={`${cell} ${s.m.profit < 0 ? "text-[#B42318]" : ""}`}>{f.money(s.m.profit)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="font-dm text-xs text-[#5B6B7F] mt-2">{t("calculator.scenarios.note")}</p>
      <div className="mt-6 calc-charts">
        <Charts />
      </div>
    </Section>
  );
}
