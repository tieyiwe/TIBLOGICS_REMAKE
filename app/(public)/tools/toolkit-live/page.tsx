import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Wand2, Check, AlertTriangle, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { toolkitPlans, formatPrice } from "@/lib/toolkit/config";
import { LIBRARY_VERTICALS, LIBRARY_SIZE, CATEGORY_COUNT, sampleTitles } from "@/lib/toolkit/library";
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

const COMPARISON: Array<[string, string, string]> = [
  ["Where you start", "An empty box and a guess", "A prompt written for the exact task, in your industry"],
  ["Knows your business", "Only what you retype every time", "Your name, market, voice and disclosures, every time"],
  ["Compliance", "Nothing checks what it wrote", "Fair Housing, financial-advertising and FTC risks flagged, with safer wording"],
  ["Getting it right", "Trial and error", "What to fill in, and a pro tip for each prompt"],
  ["Your work", "Lost in a chat history", "Every draft and check saved in one place"],
];

const STEPS = [
  { title: "Tell it about your business", body: "Once. Your name, market, customers, voice and the disclosures that must appear. Every draft uses them." },
  { title: "Pick the task", body: "Listing description, lead follow-up, donor thank-you, client report, menu copy… search or browse by category." },
  { title: "Send it with confidence", body: "Get a finished draft, with any risky phrasing highlighted and a safer version suggested. Copy it and go." },
];

const FAQ: Array<[string, string]> = [
  ["Which AI writes the drafts?", "Anthropic's Claude, through its business API. Under Anthropic's commercial terms, what you send is not used to train its models."],
  ["Is Compliance Guard legal advice?", "No. It is a screening tool that flags wording regulators and platforms have called out, and explains why. A clean check is not a legal clearance; anything important should still be read by someone qualified."],
  ["Can I cancel?", "Yes, anytime, from Manage billing inside the tool. You keep access until the end of the month you paid for."],
  ["Who owns what it writes?", "You do. Copy it, edit it and use it anywhere."],
  ["I bought a toolkit PDF. Is this the same?", "Same prompts, but run for you: filled in with your details, written by the AI and checked for compliance, instead of copied and pasted by hand."],
  ["What if I need more AI runs?", "The instant compliance check is unlimited. If you regularly hit the monthly AI allowance, email us and we will sort out a plan that fits."],
];

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

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl p-8 md:p-12" style={{ background: "linear-gradient(135deg,#0D1B2A 0%,#1B3A6B 60%,#2251A3 100%)" }}>
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle,#F47C20,transparent 70%)" }} />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-dm text-xs font-semibold text-[#F9A738]">
              <Sparkles size={13} /> Toolkit Live
            </span>
            <h1 className="font-syne font-extrabold text-4xl md:text-6xl text-white mt-4 leading-[1.05]">
              Powerful prompts, built the way top performers in your field work.
            </h1>
            <p className="font-dm text-lg text-white/80 mt-5">
              {LIBRARY_SIZE} ready-to-run prompts for 12 fields, from real estate, medical practices and law firms to social work, HR, trades and e-commerce. They are
              filled in with your business details, written in your voice, and checked for compliance before you hit send.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#plans" className="btn-primary">See plans <ArrowRight size={16} /></a>
              <a href="#guard-demo" className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                Watch Compliance Guard work
              </a>
            </div>
          </div>
          <dl className="relative mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              [String(LIBRARY_SIZE), "prompts, ready to run"],
              [String(LIBRARY_VERTICALS.length), "industries covered"],
              [String(CATEGORY_COUNT), "task categories"],
              ["Every draft", "screened for compliance"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="font-syne font-extrabold text-2xl md:text-3xl text-white">{n}</dt>
                <dd className="font-dm text-xs text-white/60 mt-1">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Why not a blank chat box */}
        <section className="mt-14">
          <h2 className="font-syne font-bold text-2xl md:text-3xl text-[#0D1B2A]">Why not just open ChatGPT?</h2>
          <p className="font-dm text-[#3A4A5C] mt-2 max-w-2xl">
            A blank chat box gives back what you put in. Most people put in one line and get generic copy. Toolkit Live starts
            where the best operators in your industry start: with the right question, the right context and the rules you
            can&apos;t afford to break.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#D2DCE8] bg-white">
            <table className="w-full min-w-[560px] font-dm text-sm">
              <thead>
                <tr className="border-b border-[#EEF2F7] text-left">
                  <th className="p-4 font-semibold text-[#7A8FA6]"></th>
                  <th className="p-4 font-semibold text-[#7A8FA6]">A blank chat box</th>
                  <th className="p-4 font-semibold text-[#B8500A]">Toolkit Live</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([row, blank, live]) => (
                  <tr key={row} className="border-b border-[#EEF2F7] last:border-0">
                    <td className="p-4 font-semibold text-[#0D1B2A]">{row}</td>
                    <td className="p-4 text-[#7A8FA6]">{blank}</td>
                    <td className="p-4 text-[#0D1B2A]"><span className="inline-flex gap-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" />{live}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-14 grid md:grid-cols-3 gap-4">
          {STEPS.map((st, i) => (
            <div key={st.title} className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
              <span className="font-syne font-extrabold text-3xl text-[#F47C20]">{i + 1}</span>
              <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mt-2">{st.title}</h3>
              <p className="font-dm text-sm text-[#3A4A5C] mt-1 leading-relaxed">{st.body}</p>
            </div>
          ))}
        </section>

        <h2 id="plans" className="font-syne font-bold text-2xl md:text-3xl text-[#0D1B2A] mt-16 scroll-mt-28">Choose your plan</h2>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
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
                    : ["Instant rule check on any text, unlimited", "Deep AI review for context the rules miss", "Rules for 12 fields, including medical, legal, insurance and HR", `${p.monthlyRuns} deep checks a month`]
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

        <section id="guard-demo" className="mt-14 grid lg:grid-cols-2 gap-8 items-start scroll-mt-28">
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

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="font-syne font-bold text-2xl md:text-3xl text-[#0D1B2A]">Questions</h2>
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {FAQ.map(([q, a]) => (
              <div key={q} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
                <h3 className="font-dm font-semibold text-[#0D1B2A]">{q}</h3>
                <p className="font-dm text-sm text-[#3A4A5C] mt-1.5 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing call to action */}
        <section className="mt-16 rounded-3xl p-8 md:p-10 text-center" style={{ background: "linear-gradient(135deg,#0D1B2A,#1B3A6B)" }}>
          <h2 className="font-syne font-extrabold text-2xl md:text-4xl text-white">Stop starting from a blank page.</h2>
          <p className="font-dm text-white/75 mt-3 max-w-xl mx-auto">
            Pick the task, fill in what you know, and send something you&apos;d be proud to put your name on.
          </p>
          <a href="#plans" className="btn-primary mt-6 inline-flex">Get Toolkit Live <ArrowRight size={16} /></a>
        </section>
      </div>
    </div>
  );
}
