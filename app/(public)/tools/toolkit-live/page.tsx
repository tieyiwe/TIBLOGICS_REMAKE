import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Wand2, Check, AlertTriangle, XCircle } from "lucide-react";
import { toolkitPlans, formatPrice } from "@/lib/toolkit/config";
import { LIBRARY_VERTICALS, LIBRARY_SIZE, sampleTitles } from "@/lib/toolkit/library";
import { scanText } from "@/lib/toolkit/guard/scan";
import ToolkitWaitlist from "./ToolkitWaitlist";

export const metadata: Metadata = {
  title: "Toolkit Live and Compliance Guard",
  description:
    "Industry prompt libraries that write with your business details, and a compliance check that flags Fair Housing, financial-advertising and FTC risks before you publish.",
  alternates: { canonical: "https://tiblogics.com/tools/toolkit-live" },
};

// Prices are read from server configuration per request.
export const dynamic = "force-dynamic";

const DEMO =
  "Charming 3-bed bungalow in an exclusive neighborhood, perfect for young professionals. Safe area with a great school district. Updated kitchen, fenced yard, walking distance to Riverside Park.";

export default async function ToolkitLivePage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const sp = await searchParams;
  const plans = toolkitPlans();
  const demo = scanText(DEMO, "realtor");
  const anyOnSale = !!(plans.toolkit.amount || plans.guard.amount);

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
            Checkout was canceled and you have not been charged.
          </div>
        )}

        <div className="max-w-3xl">
          <span className="section-tag">Toolkit Live</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2 leading-tight">
            Industry prompts that write like your business, and check themselves.
          </h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-4">
            {LIBRARY_SIZE} prompts from our industry toolkits, filled in with your business details and run for you.
            Every draft is screened by Compliance Guard for the phrases that get businesses in trouble.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mt-10">
          {(["toolkit", "guard"] as const).map((id) => {
            const p = plans[id];
            return (
              <div key={id} className={`bg-white rounded-2xl p-6 border ${id === "toolkit" ? "border-[#B8500A] shadow-[0_8px_32px_rgba(184,80,10,0.12)]" : "border-[#D2DCE8]"}`}>
                <div className="flex items-center gap-2">
                  {id === "toolkit" ? <Wand2 size={20} className="text-[#B8500A]" /> : <ShieldCheck size={20} className="text-[#2251A3]" />}
                  <h2 className="font-syne font-bold text-xl text-[#0D1B2A]">{p.name}</h2>
                </div>
                <p className="font-dm text-sm text-[#3A4A5C] mt-2">{p.blurb}</p>
                <ul className="mt-4 space-y-2 font-dm text-sm text-[#3A4A5C]">
                  {(id === "toolkit"
                    ? [`All ${LIBRARY_SIZE} prompts across ${LIBRARY_VERTICALS.length} industries`, "Remembers your business, voice and required disclosures", "Compliance Guard on every draft", `${p.monthlyRuns} AI runs a month`]
                    : ["Instant rule check on any text, unlimited", "Deep AI review for context the rules miss", "Real estate, finance, nonprofit, agency and restaurant rules", `${p.monthlyRuns} deep checks a month`]
                  ).map((t) => (
                    <li key={t} className="flex gap-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" />{t}</li>
                  ))}
                </ul>
                <div className="mt-6 flex items-end justify-between gap-3">
                  {p.amount ? (
                    <>
                      <p className="font-syne font-extrabold text-3xl text-[#0D1B2A]">
                        {formatPrice(p.amount)}<span className="font-dm text-base font-medium text-[#7A8FA6]"> / month</span>
                      </p>
                      <Link href={`/toolkit?plan=${id}`} className="btn-primary">Get started</Link>
                    </>
                  ) : (
                    <p className="font-dm text-sm font-semibold text-[#7A8FA6]">Opening soon</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!anyOnSale && <ToolkitWaitlist />}

        <section className="mt-14 grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="font-syne font-bold text-2xl text-[#0D1B2A]">Compliance Guard, on a real listing</h2>
            <p className="font-dm text-sm text-[#3A4A5C] mt-2">
              This is the actual check running on the sample below, not a mock-up. It flags wording, explains the
              concern and suggests a safer version. It is a screening tool, not legal advice.
            </p>
            <div className="mt-4 bg-white border border-[#D2DCE8] rounded-2xl p-5 font-dm text-sm leading-7 text-[#0D1B2A]">
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
            {demo.map((f) => (
              <li key={f.index} className="bg-white border border-[#D2DCE8] rounded-2xl p-4 font-dm text-sm">
                <p className="flex items-center gap-2 font-semibold text-[#0D1B2A]">
                  {f.severity === "high" ? <XCircle size={16} className="text-red-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
                  &ldquo;{f.quote}&rdquo;
                </p>
                <p className="text-[#3A4A5C] mt-1">{f.why}</p>
                <p className="text-[#0F6E56] mt-1">Try: {f.fix}</p>
                <p className="text-xs text-[#7A8FA6] mt-1">{f.basis}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-syne font-bold text-2xl text-[#0D1B2A]">What&apos;s in the library</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {LIBRARY_VERTICALS.map((v) => (
              <div key={v.id} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
                <p className="font-syne font-bold text-[#0D1B2A]">{v.label}</p>
                <p className="font-dm text-xs text-[#7A8FA6]">{v.count} prompts</p>
                <ul className="mt-3 space-y-1 font-dm text-sm text-[#3A4A5C]">
                  {sampleTitles(v.id, 3).map((t) => <li key={t}>· {t}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="font-dm text-sm text-[#7A8FA6] mt-4">
            Prefer to own the prompts outright? Each toolkit is also sold as a PDF in the <Link href="/store" className="text-[#2251A3] underline">store</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
