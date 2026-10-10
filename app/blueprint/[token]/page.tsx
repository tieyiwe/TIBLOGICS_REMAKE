import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, UserRound, Zap } from "lucide-react";
import { findBlueprintByToken } from "@/lib/blueprint/access";
import { formatMoney, MAX_ATTEMPTS } from "@/lib/blueprint/config";
import type { BlueprintResult } from "@/lib/blueprint/generate";
import { getLocale, getT } from "@/lib/i18n/server";
import BlueprintStatus from "./BlueprintStatus";
import PrintButton from "./PrintButton";

// The customer's blueprint. The URL is the credential: kept out of search
// engines and out of the Referer header. "Automation Blueprint" is a product
// name, the same in every language.
export const metadata: Metadata = {
  title: "Automation Blueprint",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

const EFFORT: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800" };

export default async function BlueprintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bp = await findBlueprintByToken(token);
  if (!bp) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const longDate = (d: Date) => d.toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" });
  const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  const result = bp.status === "ready" ? (bp.result as unknown as BlueprintResult) : null;
  const totalCurrent = result?.hours.reduce((n, h) => n + h.current, 0) ?? 0;
  const totalSaved = result?.hours.reduce((n, h) => n + h.saved, 0) ?? 0;
  const [quoteBefore, quoteAfter] = t("tools.bpv.quote").split("{code}");
  const [privateBefore, privateAfter] = t("tools.bpv.private").split("{link}");

  return (
    <div className="min-h-screen bg-[#F4F7FB] print:bg-white">
      <header className="bg-[#0D1B2A] print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-syne font-extrabold text-white tracking-wide">
            TIB<span className="text-[#F47C20]">LOGICS</span>
            <span className="font-dm font-medium text-white/60 text-sm ml-2">Automation Blueprint</span>
          </Link>
          {result && <PrintButton label={t("tools.bpv.print")} />}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 print:py-0">
        <div>
          <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#B8500A]">Automation Blueprint</p>
          <h1 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-1 break-words">{bp.company}</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">
            {t("tools.bpv.preparedFor", { name: bp.name })}{bp.readyAt ? ` · ${longDate(bp.readyAt)}` : ""}
          </p>
        </div>

        {bp.status === "draft" && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 font-dm text-sm text-[#3A4A5C]">
            {t("tools.bpv.unpaid")}
          </div>
        )}
        {(bp.status === "paid" || bp.status === "generating" || bp.status === "failed") && (
          <BlueprintStatus token={token} status={bp.status} canRetry={bp.status === "failed" && bp.attempts < MAX_ATTEMPTS} />
        )}

        {result && (
          <>
            <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 print:border-0 print:p-0">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{t("tools.bpv.summary")}</h2>
              <p className="font-dm text-[15px] leading-7 text-[#3A4A5C] mt-2 whitespace-pre-line">{result.summary}</p>
              <div className="grid sm:grid-cols-3 gap-3 mt-5">
                <Stat label={t("tools.bpv.stat.today")} value={num.format(Math.round(totalCurrent))} />
                <Stat label={t("tools.bpv.stat.freed")} value={`~${num.format(Math.round(totalSaved))}`} />
                <Stat label={t("tools.bpv.stat.processes")} value={num.format(result.processes.length)} />
              </div>
              <p className="font-dm text-xs text-[#7A8FA6] mt-3">
                {t("tools.bpv.hoursNote")}
              </p>
            </section>

            {result.quickWins.length > 0 && (
              <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 print:border-0 print:p-0">
                <h2 className="font-syne font-bold text-lg text-[#0D1B2A] flex items-center gap-2"><Zap size={18} className="text-[#B8500A]" aria-hidden /> {t("tools.bpv.quickWins")}</h2>
                <ul className="mt-3 space-y-3">
                  {result.quickWins.map((w, i) => (
                    <li key={i} className="font-dm text-sm"><p className="font-semibold text-[#0D1B2A]">{w.title}</p><p className="text-[#3A4A5C] mt-0.5">{w.detail}</p></li>
                  ))}
                </ul>
              </section>
            )}

            {result.processes.map((p, i) => {
              const h = result.hours[i];
              return (
                <section key={i} className="bg-white border border-[#D2DCE8] rounded-2xl p-6 break-inside-avoid-page print:border-0 print:p-0">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 className="font-syne font-bold text-lg text-[#0D1B2A] break-words">{i + 1}. {p.name}</h2>
                    {h && <p className="font-dm text-sm text-[#3A4A5C]">{t("tools.bpv.procHours", { current: num.format(h.current), saved: num.format(h.saved) })}</p>}
                  </div>
                  {p.currentState.length > 0 && (
                    <div className="mt-3">
                      <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#7A8FA6]">{t("tools.bpv.howToday")}</p>
                      <ol className="mt-1.5 list-decimal pl-5 space-y-0.5 font-dm text-sm text-[#3A4A5C]">
                        {p.currentState.map((s, j) => <li key={j}>{s}</li>)}
                      </ol>
                    </div>
                  )}
                  <div className="mt-4 space-y-3">
                    {p.opportunities.map((o, j) => (
                      <div key={j} className="rounded-xl border border-[#E6EBF1] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-dm font-semibold text-[#0D1B2A]">{o.title}</p>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${EFFORT[o.effort]}`}>{t(`tools.bpv.effort.${o.effort}`)}</span>
                        </div>
                        <p className="font-dm text-sm text-[#3A4A5C] mt-1">{o.description}</p>
                        {o.tools.length > 0 && <p className="font-dm text-xs text-[#7A8FA6] mt-1.5">{t("tools.bpv.tools", { list: o.tools.join(", ") })}</p>}
                        {o.rationale && <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{t("tools.bpv.why", { text: o.rationale })}</p>}
                      </div>
                    ))}
                  </div>
                  {p.keepHuman && (
                    <p className="font-dm text-sm text-[#3A4A5C] mt-4 flex gap-2"><UserRound size={16} className="text-[#2251A3] shrink-0 mt-0.5" aria-hidden /><span><span className="font-semibold">{t("tools.bpv.keepHuman")}</span> {p.keepHuman}</span></p>
                  )}
                </section>
              );
            })}

            <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 break-inside-avoid-page print:border-0 print:p-0">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A] flex items-center gap-2"><Clock size={18} className="text-[#B8500A]" aria-hidden /> {t("tools.bpv.roadmap")}</h2>
              <ol className="mt-3 space-y-4">
                {result.roadmap.map((r, i) => (
                  <li key={i}>
                    <p className="font-dm font-semibold text-[#0D1B2A]">{r.phase} <span className="font-normal text-[#7A8FA6]">· {r.weeks}</span></p>
                    <ul className="mt-1 list-disc pl-5 font-dm text-sm text-[#3A4A5C] space-y-0.5">{r.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
                  </li>
                ))}
              </ol>
            </section>

            {result.stack.length > 0 && (
              <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 break-inside-avoid-page print:border-0 print:p-0">
                <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{t("tools.bpv.stack")}</h2>
                <ul className="mt-3 grid sm:grid-cols-2 gap-3">
                  {result.stack.map((s, i) => (
                    <li key={i} className="font-dm text-sm">
                      <p className="font-semibold text-[#0D1B2A]">{s.tool} {s.alreadyUsed && <span className="text-xs font-normal text-green-700">{t("tools.bpv.alreadyHave")}</span>}</p>
                      <p className="text-[#3A4A5C]">{s.role}</p>
                    </li>
                  ))}
                </ul>
                <p className="font-dm text-xs text-[#7A8FA6] mt-3">{t("tools.bpv.checkPricing")}</p>
              </section>
            )}

            {(result.risks.length > 0 || result.measure.length > 0) && (
              <section className="grid md:grid-cols-2 gap-6 break-inside-avoid-page">
                {result.risks.length > 0 && (
                  <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 print:border-0 print:p-0">
                    <h2 className="font-syne font-bold text-lg text-[#0D1B2A] flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" aria-hidden /> {t("tools.bpv.risks")}</h2>
                    <ul className="mt-3 space-y-3 font-dm text-sm">
                      {result.risks.map((r, i) => <li key={i}><p className="font-semibold text-[#0D1B2A]">{r.risk}</p><p className="text-[#3A4A5C]">{r.mitigation}</p></li>)}
                    </ul>
                  </div>
                )}
                {result.measure.length > 0 && (
                  <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 print:border-0 print:p-0">
                    <h2 className="font-syne font-bold text-lg text-[#0D1B2A] flex items-center gap-2"><CheckCircle2 size={18} className="text-green-600" aria-hidden /> {t("tools.bpv.measure")}</h2>
                    <ul className="mt-3 list-disc pl-5 space-y-1 font-dm text-sm text-[#3A4A5C]">{result.measure.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {bp.status !== "draft" && (
          <section className="bg-[#0D1B2A] rounded-2xl p-6 text-white print:hidden">
            <h2 className="font-syne font-bold text-lg">{t("tools.bpv.build")}</h2>
            <p className="font-dm text-sm text-white/70 mt-1">
              {quoteBefore}<strong className="text-white break-all">{bp.creditCode}</strong>{quoteAfter}{" "}
              {bp.amountPaid === 0
                ? t("tools.bpv.complimentary")
                : bp.creditUsedAt
                ? t("tools.bpv.used")
                : bp.creditExpiresAt && bp.creditExpiresAt > new Date()
                ? t("tools.bpv.credit", { amount: formatMoney(bp.amountPaid, locale), date: longDate(bp.creditExpiresAt) })
                : t("tools.bpv.expired")}
            </p>
            <Link href="/book" className="btn-primary mt-4 inline-flex">{t("tools.common.bookCall")}</Link>
          </section>
        )}
        <p className="font-dm text-xs text-[#7A8FA6] print:hidden">
          {privateBefore}
          <Link href="/tools/automation-blueprint" className="underline">{t("tools.bpv.privateLink")}</Link>
          {privateAfter}
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F4F7FB] p-4 print:border print:border-[#E6EBF1]">
      <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{value}</p>
      <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{label}</p>
    </div>
  );
}
