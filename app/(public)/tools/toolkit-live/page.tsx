import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Wand2, Check, AlertTriangle, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { toolkitPlans } from "@/lib/toolkit/config";
import { LIBRARY_VERTICALS, LIBRARY_SIZE, CATEGORY_COUNT, sampleTitles } from "@/lib/toolkit/library";
import { scanText } from "@/lib/toolkit/guard/scan";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedList } from "@/lib/i18n/content";
import ToolkitWaitlist from "./ToolkitWaitlist";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tools.tk.meta.title"),
    description: t("tools.tk.meta.description"),
    alternates: { canonical: "https://tiblogics.com/tools/toolkit-live" },
  };
}

// Prices are read from server configuration per request.
export const dynamic = "force-dynamic";

// Rows, steps and questions: tools.tk.row.<n>.*, tools.tk.step.<n>.*, tools.tk.faq.<n>.*
const COMPARISON = [1, 2, 3, 4, 5];
const STEPS = [1, 2, 3];
const FAQ = [1, 2, 3, 4, 5, 6];

// A US listing checked against US rules, so it stays in English on every
// language version of the page; the explanations are translated.
const DEMO =
  "Charming 3-bed bungalow in an exclusive neighborhood, perfect for young professionals. Safe area with a great school district. Updated kitchen, fenced yard, walking distance to Riverside Park.";

export default async function ToolkitLivePage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const sp = await searchParams;
  const plans = toolkitPlans();
  const demo = scanText(DEMO, "realtor");
  const anyOnSale = !!(plans.toolkit.amount || plans.guard.amount);
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const price = (cents: number) => {
    const v = cents / 100;
    const digits = v % 1 === 0 ? 0 : 2;
    return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
  };
  const vertical = (id: string, fallback: string) => {
    const key = `tools.vertical.${id}`;
    const label = t(key);
    return label === key ? fallback : label;
  };
  // Prompt titles and the guard's explanations are content, translated by the
  // model once and cached (lib/i18n/content.ts); English until that is ready.
  const [samples, demoText] = await Promise.all([
    localizedList(
      "tools:toolkit-live:samples",
      locale,
      LIBRARY_VERTICALS.flatMap((v) => sampleTitles(v.id, 3).map((title) => ({ vertical: v.id, title }))),
    ),
    localizedList("tools:toolkit-live:guard-demo", locale, demo.map((f) => ({ why: f.why, basis: f.basis }))),
  ]);
  const [pdfBefore, pdfAfter] = t("tools.tk.library.pdf").split("{link}");

  // Highlight the flagged words in the demo text.
  const parts: Array<{ text: string; sev?: string }> = [];
  let cursor = 0;
  for (const f of [...demo].sort((a, b) => a.index - b.index)) {
    if (f.index < cursor) continue;
    parts.push({ text: DEMO.slice(cursor, f.index) });
    parts.push({ text: f.quote, sev: f.severity });
    cursor = f.index + f.quote.length;
  }
  parts.push({ text: DEMO.slice(cursor) });

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {sp.canceled && (
          <div className="mb-8 rounded-2xl border border-[#D2DCE8] bg-white p-5 font-dm text-sm text-[#3A4A5C]">
            {t("tools.common.canceled")}
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl p-8 md:p-12" style={{ background: "linear-gradient(135deg,#0D1B2A 0%,#1B3A6B 60%,#2251A3 100%)" }}>
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle,#F47C20,transparent 70%)" }} />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-dm text-xs font-semibold text-[#F9A738]">
              <Sparkles size={13} aria-hidden /> Toolkit Live
            </span>
            <h1 className="font-syne font-extrabold text-4xl md:text-6xl text-white mt-4 leading-[1.05] break-words">
              {t("tools.tk.hero.title")}
            </h1>
            <p className="font-dm text-lg text-white/80 mt-5">
              {t("tools.tk.hero.lead", { n: LIBRARY_SIZE.toLocaleString(locale), fields: LIBRARY_VERTICALS.length })}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#plans" className="btn-primary">{t("tools.tk.seePlans")} <ArrowRight size={16} aria-hidden /></a>
              <a href="#guard-demo" className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                {t("tools.tk.watch")}
              </a>
            </div>
          </div>
          <dl className="relative mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              [LIBRARY_SIZE.toLocaleString(locale), t("tools.tk.stat.prompts")],
              [LIBRARY_VERTICALS.length.toLocaleString(locale), t("tools.tk.stat.industries")],
              [CATEGORY_COUNT.toLocaleString(locale), t("tools.tk.stat.categories")],
              [t("tools.tk.stat.every"), t("tools.tk.stat.screened")],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="font-syne font-extrabold text-2xl md:text-3xl text-white break-words">{n}</dt>
                <dd className="font-dm text-xs text-white/60 mt-1">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Why not a blank chat box */}
        <section className="mt-14">
          <h2 className="font-syne font-bold text-2xl md:text-3xl text-[#0D1B2A]">{t("tools.tk.why.title")}</h2>
          <p className="font-dm text-[#3A4A5C] mt-2 max-w-2xl">
            {t("tools.tk.why.body")}
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#D2DCE8] bg-white">
            <table className="w-full min-w-[560px] font-dm text-sm">
              <thead>
                <tr className="border-b border-[#EEF2F7] text-left">
                  <th className="p-4 font-semibold text-[#7A8FA6]"></th>
                  <th className="p-4 font-semibold text-[#7A8FA6]">{t("tools.tk.col.blank")}</th>
                  <th className="p-4 font-semibold text-[#B8500A]">Toolkit Live</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((n) => (
                  <tr key={n} className="border-b border-[#EEF2F7] last:border-0">
                    <td className="p-4 font-semibold text-[#0D1B2A]">{t(`tools.tk.row.${n}.label`)}</td>
                    <td className="p-4 text-[#7A8FA6]">{t(`tools.tk.row.${n}.blank`)}</td>
                    <td className="p-4 text-[#0D1B2A]"><span className="inline-flex gap-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" aria-hidden />{t(`tools.tk.row.${n}.live`)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-14 grid md:grid-cols-3 gap-4">
          {STEPS.map((n) => (
            <div key={n} className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
              <span className="font-syne font-extrabold text-3xl text-[#F47C20]">{n}</span>
              <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mt-2">{t(`tools.tk.step.${n}.title`)}</h3>
              <p className="font-dm text-sm text-[#3A4A5C] mt-1 leading-relaxed">{t(`tools.tk.step.${n}.body`)}</p>
            </div>
          ))}
        </section>

        <h2 id="plans" className="font-syne font-bold text-2xl md:text-3xl text-[#0D1B2A] mt-16 scroll-mt-28">{t("tools.tk.plans")}</h2>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
          {(["toolkit", "guard"] as const).map((id) => {
            const p = plans[id];
            return (
              <div key={id} className={`bg-white rounded-2xl p-6 border ${id === "toolkit" ? "border-[#B8500A] shadow-[0_8px_32px_rgba(184,80,10,0.12)]" : "border-[#D2DCE8]"}`}>
                <div className="flex items-center gap-2">
                  {id === "toolkit" ? <Wand2 size={20} className="text-[#B8500A]" /> : <ShieldCheck size={20} className="text-[#2251A3]" />}
                  <h2 className="font-syne font-bold text-xl text-[#0D1B2A]">{p.name}</h2>
                </div>
                <p className="font-dm text-sm text-[#3A4A5C] mt-2">{t(`tools.tk.plan.${id}.blurb`)}</p>
                <ul className="mt-4 space-y-2 font-dm text-sm text-[#3A4A5C]">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex gap-2">
                      <Check size={16} className="text-green-600 shrink-0 mt-0.5" aria-hidden />
                      {t(`tools.tk.plan.${id}.f${n}`, {
                        n: n === 1 && id === "toolkit" ? LIBRARY_SIZE.toLocaleString(locale) : n === 3 ? LIBRARY_VERTICALS.length : (p.monthlyRuns ?? 0).toLocaleString(locale),
                        v: LIBRARY_VERTICALS.length,
                      })}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                  {p.amount ? (
                    <>
                      <p className="font-syne font-extrabold text-3xl text-[#0D1B2A]">
                        {price(p.amount)}<span className="font-dm text-base font-medium text-[#7A8FA6]"> {t("tools.common.perMonth")}</span>
                      </p>
                      <Link href={`/toolkit?plan=${id}`} className="btn-primary">{t("tools.tk.getStarted")}</Link>
                    </>
                  ) : (
                    <p className="font-dm text-sm font-semibold text-[#7A8FA6]">{t("tools.common.openingSoon")}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!anyOnSale && <ToolkitWaitlist />}

        <section id="guard-demo" className="mt-14 grid lg:grid-cols-2 gap-8 items-start scroll-mt-28">
          <div>
            <h2 className="font-syne font-bold text-2xl text-[#0D1B2A]">{t("tools.tk.demo.title")}</h2>
            <p className="font-dm text-sm text-[#3A4A5C] mt-2">
              {t("tools.tk.demo.body")}
            </p>
            {locale !== "en" && <p className="font-dm text-xs text-[#7A8FA6] mt-2">{t("tools.tk.demo.englishNote")}</p>}
            <div lang="en" className="mt-4 bg-white border border-[#D2DCE8] rounded-2xl p-5 font-dm text-sm leading-7 text-[#0D1B2A]">
              {parts.map((p, i) =>
                p.sev ? (
                  <mark key={i} className={`rounded px-0.5 ${p.sev === "high" ? "bg-red-100 text-red-900" : p.sev === "medium" ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"}`}>{p.text}</mark>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </div>
          </div>
          <ul className="space-y-3">
            {demo.map((f, i) => (
              <li key={f.index} className="bg-white border border-[#D2DCE8] rounded-2xl p-4 font-dm text-sm">
                <p className="flex items-center gap-2 font-semibold text-[#0D1B2A]">
                  {f.severity === "high" ? <XCircle size={16} className="text-red-600 shrink-0" aria-hidden /> : <AlertTriangle size={16} className="text-amber-600 shrink-0" aria-hidden />}
                  <span lang="en">&ldquo;{f.quote}&rdquo;</span>
                </p>
                <p className="text-[#3A4A5C] mt-1">{demoText.value[i]?.why ?? f.why}</p>
                <p className="text-[#0F6E56] mt-1">{t("tools.tk.demo.try", { fix: f.fix })}</p>
                <p className="text-xs text-[#7A8FA6] mt-1">{demoText.value[i]?.basis ?? f.basis}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-syne font-bold text-2xl text-[#0D1B2A]">{t("tools.tk.library")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {LIBRARY_VERTICALS.map((v) => (
              <div key={v.id} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
                <p className="font-syne font-bold text-[#0D1B2A]">{vertical(v.id, v.label)}</p>
                <p className="font-dm text-xs text-[#7A8FA6]">{t("tools.tk.library.count", { n: v.count.toLocaleString(locale) })}</p>
                <ul className="mt-3 space-y-1 font-dm text-sm text-[#3A4A5C]">
                  {samples.value.filter((s) => s.vertical === v.id).map((s, i) => <li key={i}>· {s.title}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="font-dm text-sm text-[#7A8FA6] mt-4">
            {pdfBefore}<Link href="/store" className="text-[#2251A3] underline">{t("tools.tk.library.store")}</Link>{pdfAfter}
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="font-syne font-bold text-2xl md:text-3xl text-[#0D1B2A]">{t("tools.tk.faq")}</h2>
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {FAQ.map((n) => (
              <div key={n} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
                <h3 className="font-dm font-semibold text-[#0D1B2A]">{t(`tools.tk.faq.${n}.q`)}</h3>
                <p className="font-dm text-sm text-[#3A4A5C] mt-1.5 leading-relaxed">{t(`tools.tk.faq.${n}.a`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing call to action */}
        <section className="mt-16 rounded-3xl p-8 md:p-10 text-center" style={{ background: "linear-gradient(135deg,#0D1B2A,#1B3A6B)" }}>
          <h2 className="font-syne font-extrabold text-2xl md:text-4xl text-white">{t("tools.tk.closing.title")}</h2>
          <p className="font-dm text-white/75 mt-3 max-w-xl mx-auto">
            {t("tools.tk.closing.body")}
          </p>
          <a href="#plans" className="btn-primary mt-6 inline-flex">{t("tools.tk.closing.button")} <ArrowRight size={16} aria-hidden /></a>
        </section>
      </div>
    </div>
  );
}
