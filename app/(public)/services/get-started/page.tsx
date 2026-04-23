"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles, Send, ChevronDown } from "lucide-react";

const SERVICES = [
  "AI Implementation & Agents",
  "Workflow Automation",
  "AI Strategy & Consulting",
  "Web & App Development",
  "Cybersecurity",
  "Data Analytics",
  "Mobile Development",
  "AI Training & Academy",
  "System Design & IoT",
  "Other / Not sure yet",
];

const BUDGETS = [
  "Under $19,000",
  "$19,000 – $50,000",
  "$50,000 – $150,000",
  "$150,000 – $500,000",
  "$500,000 – $1M",
  "$1M – $3M",
  "$3M+",
  "Not sure / Let's discuss",
];

const TIMELINES = [
  "ASAP (within 2 weeks)",
  "1–3 months",
  "3–6 months",
  "6+ months",
  "Flexible",
];

interface TiboMessage { role: "user" | "assistant"; content: string }

export default function GetStartedPage() {
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
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tibo panel
  const [tiboOpen, setTiboOpen] = useState(false);
  const [tiboMessages, setTiboMessages] = useState<TiboMessage[]>([
    { role: "assistant", content: "Hi! I'm Tibo 👋 Tell me what you want to achieve or what problem you're trying to solve, and I'll help turn it into a clear project description for the form." },
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
      const text: string = data.text ?? "I'm having trouble right now. Please type your description directly in the form.";

      // Parse out DESCRIPTION: and SERVICE: markers
      const descMatch = text.match(/DESCRIPTION:\s*([\s\S]+?)(?:\n\n|SERVICE:|$)/);
      const serviceMatch = text.match(/SERVICE:\s*(.+)/);
      const displayText = text.replace(/DESCRIPTION:[\s\S]+/, "").replace(/SERVICE:.+/, "").trim()
        || (descMatch ? "Here's a description I drafted for you — click 'Use this' to apply it to the form." : text);

      setTiboMessages((m) => [...m, { role: "assistant", content: displayText || text }]);

      if (descMatch) {
        const desc = descMatch[1].trim();
        setAiSummary(desc);
        // Show a "use this" message
        setTiboMessages((m) => [
          ...m,
          { role: "assistant", content: `Here's what I drafted:\n\n"${desc}"\n\nClick **"Use This Description"** below to apply it to your form.` },
        ]);
        if (serviceMatch) {
          const svc = SERVICES.find(s => s.toLowerCase().includes(serviceMatch[1].trim().toLowerCase().split(" ")[0]));
          if (svc && !form.service) setForm(f => ({ ...f, service: svc }));
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
    setTiboMessages((m) => [...m, { role: "assistant", content: "✅ Applied to your form! Review it and adjust if needed, then submit." }]);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (!form.service) e.service = "Please select a service";
    if (!form.description.trim() || form.description.trim().length < 30) e.description = "Please describe your project (min 30 characters)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tiboAssisted, aiSummary: tiboAssisted ? aiSummary : null }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldCls = (err?: string) =>
    `w-full bg-white border ${err ? "border-red-400" : "border-[#D2DCE8]"} rounded-xl px-4 py-3 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-2 focus:ring-[#2251A3]/10 transition-colors`;

  if (submitted) {
    return (
      <div className="pt-40 pb-20 min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4">
        <div className="bg-white border border-[#D2DCE8] rounded-3xl p-12 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mb-3">We got it! 🎉</h2>
          <p className="font-dm text-[#3A4A5C] leading-relaxed mb-6">
            Your project details have been sent to our team. Expect to hear back within <strong>1–2 business days</strong>. A confirmation email is on its way to you.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/blog")} className="btn-primary justify-center">
              Read Our Blog →
            </button>
            <button onClick={() => router.push("/tools/advisor")} className="btn-secondary justify-center">
              Chat with Tibo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-20 min-h-screen bg-[#F4F7FB]">
      {/* Hero */}
      <div className="bg-[#1B3A6B] py-12 text-center">
        <span className="section-tag-light">Start a Project</span>
        <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white mt-3">
          Tell us what you&apos;re building
        </h1>
        <p className="font-dm text-white/70 mt-3 max-w-lg mx-auto text-base">
          Fill in your details below. Tibo can help you describe your project if you&apos;re not sure what to write.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main form */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-5">
            {/* Name row */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-4">
              <h3 className="font-syne font-bold text-sm text-[#0D1B2A] uppercase tracking-wide">Your Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input value={form.firstName} onChange={set("firstName")} placeholder="First name *" className={fieldCls(errors.firstName)} />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input value={form.lastName} onChange={set("lastName")} placeholder="Last name *" className={fieldCls(errors.lastName)} />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input value={form.email} onChange={set("email")} placeholder="Email address *" type="email" className={fieldCls(errors.email)} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <input value={form.phone} onChange={set("phone")} placeholder="Phone (optional)" type="tel" className={fieldCls()} />
              </div>
              <input value={form.company} onChange={set("company")} placeholder="Company / Organization (optional)" className={fieldCls()} />
            </div>

            {/* Service & project */}
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-4">
              <h3 className="font-syne font-bold text-sm text-[#0D1B2A] uppercase tracking-wide">Project Details</h3>
              <div className="relative">
                <select value={form.service} onChange={set("service")} className={`${fieldCls(errors.service)} appearance-none pr-10`}>
                  <option value="">Select a service *</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] pointer-events-none" />
                {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-dm text-sm text-[#3A4A5C]">Describe your project / what you want to achieve *</label>
                  {tiboAssisted && <span className="text-xs text-purple-500 font-dm flex items-center gap-1"><Sparkles size={11} /> Tibo assisted</span>}
                </div>
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  rows={5}
                  placeholder="Tell us what you're trying to build, what problem you're solving, and what success looks like for you…"
                  className={`${fieldCls(errors.description)} resize-none`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <select value={form.budget} onChange={set("budget")} className={`${fieldCls()} appearance-none pr-10`}>
                    <option value="">Budget range (optional)</option>
                    {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={form.timeline} onChange={set("timeline")} className={`${fieldCls()} appearance-none pr-10`}>
                    <option value="">Timeline (optional)</option>
                    {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
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
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting…</> : "Submit Project Request →"}
            </button>
            <p className="text-center font-dm text-xs text-[#7A8FA6]">
              You'll receive a confirmation email. Our team responds within 1–2 business days.
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
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">Let Tibo help you</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">Describe your goals, I&apos;ll write the form</p>
                </div>
                <span className="text-xs font-dm text-[#2251A3] font-medium">{tiboOpen ? "Close" : "Open"}</span>
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
                        ✨ Use This Description
                      </button>
                    </div>
                  )}

                  <div className="px-3 py-3 border-t border-[#D2DCE8] flex gap-2">
                    <input
                      value={tiboInput}
                      onChange={(e) => setTiboInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askTibo()}
                      placeholder="What are you trying to achieve?"
                      className="flex-1 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-3 py-2 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3]"
                      disabled={tiboLoading}
                    />
                    <button
                      onClick={askTibo}
                      disabled={tiboLoading || !tiboInput.trim()}
                      className="w-9 h-9 rounded-xl bg-[#1B3A6B] flex items-center justify-center disabled:opacity-40 hover:bg-[#2251A3] transition-colors flex-shrink-0"
                    >
                      <Send size={14} className="text-white" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 bg-gradient-to-br from-[#1B3A6B]/5 to-[#2251A3]/5 border border-[#D2DCE8] rounded-2xl p-5">
              <p className="font-syne font-bold text-sm text-[#0D1B2A] mb-2">Prefer to talk first?</p>
              <p className="font-dm text-xs text-[#7A8FA6] mb-3 leading-relaxed">
                Book a free 30-minute discovery meeting — no commitment needed.
              </p>
              <a href="/book" className="block text-center bg-[#F47C20] hover:bg-[#d96b18] text-white rounded-xl py-2.5 text-sm font-dm font-semibold transition-colors">
                Book Free Meeting
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
