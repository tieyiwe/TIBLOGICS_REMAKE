"use client";

import { useT } from "@/lib/i18n/client";
import { useCalc, useFmt } from "./context";
import { SubHeading } from "./ui";

// The same workload (users, tokens, thinking, caching, routing) priced on
// every current model, cheapest first. Free: it is how most people choose.

export default function ModelComparison() {
  const t = useT();
  const f = useFmt();
  const { results, update, inputs } = useCalc();
  const rows = results.comparison;
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.monthly), 0.0001);
  const current = rows.find((r) => r.current);

  return (
    <div data-testid="model-comparison">
      <SubHeading>{t("calculator.compare.title")}</SubHeading>
      <p className="font-dm text-xs text-[#5B6B7F] -mt-1 mb-3">{t("calculator.compare.subtitle")}</p>
      <ul className="space-y-1.5">
        {rows.map((r) => {
          const diff = current && !r.current && current.monthly > 0 ? ((r.monthly - current.monthly) / current.monthly) * 100 : null;
          return (
            <li key={r.id} className={`rounded-xl border px-3 py-2 ${r.current ? "border-[#1B3A6B] bg-[#EEF3FB]" : "border-[#E4EAF2]"}`}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-dm text-sm font-semibold text-[#0D1B2A] min-w-0">
                  {r.name}
                  <span className="ml-1.5 font-normal text-xs text-[#7A8FA6]">{t(`calculator.provider.${r.provider}`)}</span>
                </span>
                <span className="flex items-center gap-2 font-dm text-sm tabular-nums">
                  <span className="font-bold text-[#0D1B2A]">{t("calculator.compare.perMonth", { amount: f.money(r.monthly) })}</span>
                  {diff !== null && (
                    <span className={`text-xs font-semibold ${diff < 0 ? "text-[#166534]" : "text-[#9A4A00]"}`}>
                      {diff < 0 ? "-" : "+"}
                      {f.pct(Math.abs(diff))}
                    </span>
                  )}
                  {r.current ? (
                    <span className="text-[11px] font-semibold text-[#1B3A6B]">{t("calculator.compare.current")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => update({ model: r.id, fastMode: inputs.fastMode })}
                      className="no-print text-[11px] font-semibold text-[#2251A3] underline underline-offset-2"
                    >
                      {t("calculator.compare.use")}
                    </button>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-[#E4EAF2] overflow-hidden" aria-hidden>
                <div className="h-full rounded-full bg-[#2251A3]" style={{ width: `${Math.max(1.5, (r.monthly / max) * 100)}%` }} />
              </div>
              <p className="mt-1 font-dm text-[11px] text-[#7A8FA6]">{t("calculator.compare.perInteraction", { amount: f.moneyPrecise(r.perInteraction) })}</p>
            </li>
          );
        })}
      </ul>
      <p className="font-dm text-[11px] text-[#5B6B7F] mt-2">{t("calculator.compare.note")}</p>
    </div>
  );
}
