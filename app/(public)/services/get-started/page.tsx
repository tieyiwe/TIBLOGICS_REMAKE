"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles, Send, ChevronDown } from "lucide-react";
import OpenTiboButton from "@/components/public/OpenTiboButton";
import { useLocale, useT } from "@/lib/i18n/client";

// `value` is what the form submits and the team reads, so it stays English;
// the visitor sees the translated label.
const SERVICES = [
  { id: "agents", value: "AI Implementation & Agents" },
  { id: "automation", value: "Workflow Automation" },
  { id: "strategy", value: "AI Strategy & Consulting" },
  { id: "web", value: "Web & App Development" },
  { id: "security", value: "Cybersecurity" },
  { id: "data", value: "Data Analytics" },
  { id: "mobile", value: "Mobile Development" },
  { id: "training", value: "AI Training & Academy" },
  { id: "iot", value: "System Design & IoT" },
  { id: "other", value: "Other / Not sure yet" },
];

type Money = (n: number) => string;
const BUDGETS: { value: string; label: (t: T, m: Money) => string }[] = [
  { value: "Under $19,000", label: (t, m) => t("pages.getStarted.budget.under", { a: m(19_000) }) },
  { value: "$19,000 – $50,000", label: (_t, m) => `${m(19_000)} – ${m(50_000)}` },
  { value: "$50,000 – $150,000", label: (_t, m) => `${m(50_000)} – ${m(150_000)}` },
  { value: "$150,000 – $500,000", label: (_t, m) => `${m(150_000)} – ${m(500_000)}` },
  { value: "$500,000 – $1M", label: (_t, m) => `${m(500_000)} – ${m(1_000_000)}` },
  { value: "$1M – $3M", label: (_t, m) => `${m(1_000_000)} – ${m(3_000_000)}` },
  { value: "$3M+", label: (t, m) => t("pages.getStarted.budget.over", { a: m(3_000_000) }) },
  { value: "Not sure / Let's discuss", label: (t) => t("pages.getStarted.budget.discuss") },
];

const TIMELINES = [
  { id: "asap", value: "ASAP (within 2 weeks)" },
  { id: "1-3", value: "1–3 months" },
  { id: "3-6", value: "3–6 months" },
  { id: "6+", value: "6+ months" },
  { id: "flexible", value: "Flexible" },
];

type T = (key: string, vars?: Record<string, string | number>) => string;

interface TiboMessage { role: "user" | "assistant"; content: string }

export default function GetStartedPage() {
  const t = useT();
  const locale = useLocale();
  const money: Money = (n) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const searchParams = useSearchParams();
  const router = useRouter();
  const preService = searchParams.get("service") ?? "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    service: preService,
    description: "",
    budget: "",
    timeline: "",
  });
  const [tiboAssisted, setTiboAssisted] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tibo panel
  const [tiboOpen, setTiboOpen] = useState(false);
  const [tiboMessages, setTiboMessages] = useState<TiboMessage[]>([
    { role: "assistant", content: t("pages.getStarted.tibo.greeting") },
  ]);
  const [tiboInput, setTiboInput] = useState("");
  const [tiboLoading, setTiboLoading] = useState(false);
  const tiboEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tiboEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tiboMessages]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function askTibo() {
    const q = tiboInput.trim();
    if (!q || tiboLoading) return;
    setTiboInput("");
    const updated: TiboMessage[] = [...tiboMessages, { role: "user", content: q }];
    setTiboMessages(updated);
    setTiboLoading(true);
    try {
      const sys = `You are Tibo, TIBLOGICS' AI assistant helping a potential client fill out a service request form.
Your job: ask 1-2 clarifying questions about their goals, then produce a clean, professional project description they can paste into the form.
When you have enough context (after 2-3 exchanges), output a summary prefixed exactly with "DESCRIPTION:" on its own line, followed by the description text (2-4 sentences, professional tone).
Also suggest which TIBLOGICS service fits best, prefixed with "SERVICE:" on its own line.
Keep responses short and friendly.`;
      const res = await fetch("/api/claude/float", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const text: string = data.text ?? t("pages.getStarted.tibo.trouble");

      // Parse out DESCRIPTION: and SERVICE: markers
      const descMatch = text.match(/DESCRIPTION:\s*([\s\S]+?)(?:\n\n|SERVICE:|$)/);
      const serviceMatch = text.match(/SERVICE:\s*(.+)/);
      const displayText = text.replace(/DESCRIPTION:[\s\S]+/, "").replace(/SERVICE:.+/, "").trim()
        || (descMatch ? t("pages.getStarted.tibo.drafted") : text);

      setTiboMessages((m) => [...m, { role: "assistant", content: displayText || text }]);

      if (descMatch) {
        const desc = descMatch[1].trim();
        setAiSummary(desc);
        // Show a "use this" message
        setTiboMessages((m) => [
          ...m,
          { role: "assistant", content: t("pages.getStarted.tibo.draftedWith", { desc }) },
        ]);
        if (serviceMatch) {
          const svc = SERVICES.find(s => s.value.toLowerCase().includes(serviceMatch[1].trim().toLowerCase().split(" ")[0]));
          if (svc && !form.service) setForm(f => ({ ...f, service: svc.value }));
        }
        setTiboAssisted(true);
      }
    } finally {
      setTiboLoading(false);
    }
  }

  function applyTiboDescription() {
    if (!aiSummary) return;
    setForm((f) => ({ ...f, description: aiSummary }));
    setTiboMessages((m) => [...m, { role: "assistant", content: t("pages.getStarted.tibo.applied") }]);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = t("pages.getStarted.err.required");
    if (!form.lastName.trim()) e.lastName = t("pages.getStarted.err.required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t("pages.getStarted.err.email");
    if (!form.service) e.service = t("pages.getStarted.err.service");
    if (!form.description.trim() || form.description.trim().length < 30) e.description = t("pages.getStarted.err.description");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tiboAssisted, aiSummary: tiboAssisted ? aiSummary : null }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        // A failure used to do nothing at all: the button stopped spinning
        // and the visitor could not tell whether the request had gone.
        const data = await res.json().catch(() => ({}));
        setSubmitError(data?.error || t("pages.getStarted.err.send"));
      }
    } catch {
      setSubmitError(t("pages.getStarted.err.network"));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldCls = (err?: string) =>
    `w-full bg-white border ${err ? "border-red-400" : "border-[#D2DCE8]"} rounded-xl px-4 py-3 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-2 focus:ring-[#2251A3]/10 transition-colors`;

  if (submitted) {
    return (
      <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4">
        <div className="bg-white border border-[#D2DCE8] rounded-3xl p-12 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mb-3">{t("pages.getStarted.done.title")}</h2>
          <p className="font-dm text-[#3A4A5C] leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t("pages.getStarted.done.body") }} />
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/ai-times")} className="btn-primary justify-center">
              {t("pages.getStarted.done.blog")}
            </button>
            <OpenTiboButton className="btn-secondary justify-center">
              {t("pages.getStarted.done.tibo")}
            </OpenTiboButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      {/* Hero */}
      <div className="bg-[#1B3A6B] py-12 text-center">
        <span className="section-tag-light">{t("pages.getStarted.hero.tag")}</span>
        <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white mt-3">
          {t("pages.getStarted.hero.title")}
        </h1>
        <p className="font-dm text-white/70 mt-3 max-w-lg mx-auto text-base">
          {t("pages.getStarted.hero.body")}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main form */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-5">
            {/* Name row */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-4">
              <h3 className="font-syne font-bold text-sm text-[#0D1B2A] uppercase tracking-wide">{t("pages.getStarted.yourInfo")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input value={form.firstName} onChange={set("firstName")} placeholder={t("pages.getStarted.firstName")} aria-label={t("pages.getStarted.firstName")} className={fieldCls(errors.firstName)} />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input value={form.lastName} onChange={set("lastName")} placeholder={t("pages.getStarted.lastName")} aria-label={t("pages.getStarted.lastName")} className={fieldCls(errors.lastName)} />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input value={form.email} onChange={set("email")} placeholder={t("pages.getStarted.email")} aria-label={t("pages.getStarted.email")} type="email" className={fieldCls(errors.email)} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <input value={form.phone} onChange={set("phone")} placeholder={t("pages.getStarted.phone")} aria-label={t("pages.getStarted.phone")} type="tel" className={fieldCls()} />
              </div>
              <input value={form.company} onChange={set("company")} placeholder={t("pages.getStarted.company")} aria-label={t("pages.getStarted.company")} className={fieldCls()} />
            </div>

            {/* Service & project */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-4">
              <h3 className="font-syne font-bold text-sm text-[#0D1B2A] uppercase tracking-wide">{t("pages.getStarted.projectDetails")}</h3>
              <div className="relative">
                <select value={form.service} onChange={set("service")} aria-label={t("pages.getStarted.selectService")} className={`${fieldCls(errors.service)} appearance-none pr-10`}>
                  <option value="">{t("pages.getStarted.selectService")}</option>
                  {SERVICES.map((s) => <option key={s.id} value={s.value}>{t(`pages.services.svc.${s.id}.name`)}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] pointer-events-none" />
                {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5">
                  <label htmlFor="gs-description" className="font-dm text-sm text-[#3A4A5C]">{t("pages.getStarted.describeLabel")}</label>
                  {tiboAssisted && <span className="text-xs text-purple-500 font-dm flex items-center gap-1"><Sparkles size={11} /> {t("pages.getStarted.tiboAssisted")}</span>}
                </div>
                <textarea
                  id="gs-description"
                  value={form.description}
                  onChange={set("description")}
                  rows={5}
                  placeholder={t("pages.getStarted.describePlaceholder")}
                  className={`${fieldCls(errors.description)} resize-none`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <select value={form.budget} onChange={set("budget")} aria-label={t("pages.getStarted.budget")} className={`${fieldCls()} appearance-none pr-10`}>
                    <option value="">{t("pages.getStarted.budget")}</option>
                    {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label(t, money)}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={form.timeline} onChange={set("timeline")} aria-label={t("pages.getStarted.timeline")} className={`${fieldCls()} appearance-none pr-10`}>
                    <option value="">{t("pages.getStarted.timeline")}</option>
                    {TIMELINES.map((tl) => <option key={tl.id} value={tl.value}>{t(`pages.getStarted.timeline.${tl.id}`)}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1B3A6B] hover:bg-[#2251A3] text-white rounded-2xl py-4 font-syne font-bold text-base disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={18} className="animate-spin" /> {t("pages.getStarted.submitting")}</> : t("pages.getStarted.submit")}
            </button>
            {submitError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-dm text-red-700">
                {submitError}
              </p>
            )}
            <p className="text-center font-dm text-xs text-[#7A8FA6]">
              {t("pages.getStarted.note")}
            </p>
          </form>

          {/* Tibo assist panel */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden sticky top-24">
              <button
                onClick={() => setTiboOpen(!tiboOpen)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#F4F7FB] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("pages.getStarted.tibo.title")}</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">{t("pages.getStarted.tibo.subtitle")}</p>
                </div>
                <span className="text-xs font-dm text-[#2251A3] font-medium">{tiboOpen ? t("pages.getStarted.tibo.close") : t("pages.getStarted.tibo.open")}</span>
              </button>

              {tiboOpen && (
                <>
                  <div className="border-t border-[#F4F7FB] h-72 overflow-y-auto p-4 bg-[#F8FAFD] space-y-3">
                    {tiboMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm font-dm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-[#1B3A6B] text-white rounded-tr-sm"
                            : "bg-white border border-[#E8EFF8] text-[#0D1B2A] rounded-tl-sm"
                        }`}>
                          {m.content.replace(/\*\*(.*?)\*\*/g, "$1")}
                        </div>
                      </div>
                    ))}
                    {tiboLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-[#E8EFF8] rounded-2xl px-3 py-2 flex gap-1">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7A8FA6] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={tiboEndRef} />
                  </div>

                  {aiSummary && (
                    <div className="px-4 py-2 border-t border-[#F4F7FB]">
                      <button
                        onClick={applyTiboDescription}
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white rounded-xl py-2.5 text-sm font-semibold font-dm hover:opacity-90 transition-opacity"
                      >
                        {t("pages.getStarted.tibo.use")}
                      </button>
                    </div>
                  )}

                  <div className="px-3 py-3 border-t border-[#D2DCE8] flex gap-2">
                    <input
                      value={tiboInput}
                      onChange={(e) => setTiboInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askTibo()}
                      placeholder={t("pages.getStarted.tibo.placeholder")}
                      aria-label={t("pages.getStarted.tibo.placeholder")}
                      className="flex-1 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-3 py-2 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3]"
                      disabled={tiboLoading}
                    />
                    <button
                      onClick={askTibo}
                      disabled={tiboLoading || !tiboInput.trim()}
                      aria-label={t("pages.getStarted.tibo.send")}
                      className="w-9 h-9 rounded-xl bg-[#1B3A6B] flex items-center justify-center disabled:opacity-40 hover:bg-[#2251A3] transition-colors flex-shrink-0"
                    >
                      <Send size={14} className="text-white" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 bg-gradient-to-br from-[#1B3A6B]/5 to-[#2251A3]/5 border border-[#D2DCE8] rounded-2xl p-5">
              <p className="font-syne font-bold text-sm text-[#0D1B2A] mb-2">{t("pages.getStarted.talk.title")}</p>
              <p className="font-dm text-xs text-[#7A8FA6] mb-3 leading-relaxed">
                {t("pages.getStarted.talk.body")}
              </p>
              <a href="/book" className="block text-center bg-[#F47C20] hover:bg-[#d96b18] text-white rounded-xl py-2.5 text-sm font-dm font-semibold transition-colors">
                {t("pages.getStarted.talk.button")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
