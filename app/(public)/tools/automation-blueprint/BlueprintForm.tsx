"use client";
import { useEffect, useState } from "react";
import { Loader2, Lock, Plus, Trash2 } from "lucide-react";

const input =
  "w-full px-3.5 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] bg-white";
const label = "font-dm text-xs font-semibold text-[#3A4A5C]";

interface Proc {
  name: string; steps: string; timesPer: string; per: "day" | "week" | "month"; minutesEach: string; people: string; tools: string; pain: string;
}
const emptyProc = (): Proc => ({ name: "", steps: "", timesPer: "", per: "week", minutesEach: "", people: "1", tools: "", pain: "" });
const PER = { day: 21.7, week: 4.33, month: 1 };
const DRAFT_KEY = "tiblogics-blueprint-draft";

export default function BlueprintForm({ price, creditDays, testMode = false }: { price: string | null; creditDays: number; testMode?: boolean }) {
  const [f, setF] = useState({ name: "", email: "", company: "", industry: "", teamSize: "2-5", tools: "", goals: "", budget: "not-sure" });
  const [procs, setProcs] = useState<Proc[]>([emptyProc()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkMsg, setLinkMsg] = useState<string | null>(null);

  // A long form: keep a draft in this browser so a reload does not lose it.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      if (saved?.f) setF(saved.f);
      if (Array.isArray(saved?.procs) && saved.procs.length) setProcs(saved.procs);
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ f, procs })); } catch { /* storage unavailable */ }
  }, [f, procs]);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const setP = (i: number, k: keyof Proc, v: string) => setProcs((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const hours = (p: Proc) => {
    const n = (Number(p.timesPer) || 0) * PER[p.per] * (Number(p.minutesEach) || 0) / 60;
    return Math.round(n * 10) / 10;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Test mode (admin only, checked again by the API) skips checkout and
    // writes the blueprint for free.
    const res = await fetch(testMode ? "/api/admin/test-access" : "/api/blueprint/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testMode ? { tool: "blueprint", intake: { ...f, processes: procs } } : { ...f, processes: procs }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    const next = d.url ?? d.link;
    if (res?.ok && next) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      window.location.href = next;
      return;
    }
    setError(d.error ?? "Something went wrong. Please try again.");
    setBusy(false);
  }

  async function waitlist(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email, product: "automation-blueprint" }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setNotice(res?.ok ? "You're on the list. We'll email you when it opens." : d.error ?? "Something went wrong.");
  }

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/blueprint/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: linkEmail }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setLinkMsg(d.message ?? d.error ?? "Please try again.");
  }

  if (!price && !testMode) {
    return (
      <div className="max-w-xl bg-white border border-[#D2DCE8] rounded-2xl p-6">
        <p className="font-syne font-bold text-xl text-[#0D1B2A]">Opening soon</p>
        <p className="font-dm text-sm text-[#3A4A5C] mt-1">Leave your email and we&apos;ll tell you when blueprints open.</p>
        {notice ? (
          <p className="font-dm text-sm text-green-700 mt-4">{notice}</p>
        ) : (
          <form onSubmit={waitlist} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input className={input} type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@business.com" />
            <button className="btn-primary justify-center shrink-0">Join the waitlist</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      <form onSubmit={submit} className="space-y-6">
        {testMode && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-dm text-sm text-amber-900">
            <strong>Admin test mode.</strong> No checkout. The blueprint is written for free and opens when you submit.
          </p>
        )}
        <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
          <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">About your business</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <label className="block"><span className={label}>Your name</span><input className={`${input} mt-1`} required value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label className="block"><span className={label}>Email for the blueprint</span><input className={`${input} mt-1`} type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
            <label className="block"><span className={label}>Company</span><input className={`${input} mt-1`} required value={f.company} onChange={(e) => set("company", e.target.value)} /></label>
            <label className="block"><span className={label}>Industry</span><input className={`${input} mt-1`} required value={f.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Property management" /></label>
            <label className="block"><span className={label}>Team size</span>
              <select className={`${input} mt-1`} value={f.teamSize} onChange={(e) => set("teamSize", e.target.value)}>
                {["1", "2-5", "6-20", "21-50", "51+"].map((s) => <option key={s} value={s}>{s === "1" ? "Just me" : `${s} people`}</option>)}
              </select>
            </label>
            <label className="block"><span className={label}>Budget if you build it</span>
              <select className={`${input} mt-1`} value={f.budget} onChange={(e) => set("budget", e.target.value)}>
                <option value="not-sure">Not sure yet</option><option value="under-1k">Under $1,000</option><option value="1k-5k">$1,000 to $5,000</option>
                <option value="5k-15k">$5,000 to $15,000</option><option value="15k-plus">Over $15,000</option>
              </select>
            </label>
          </div>
          <label className="block mt-4"><span className={label}>Software you already use</span>
            <textarea className={`${input} mt-1 min-h-[70px]`} required value={f.tools} onChange={(e) => set("tools", e.target.value)} placeholder="Google Workspace, QuickBooks Online, HubSpot free, Calendly, Slack" />
          </label>
          <label className="block mt-4"><span className={label}>What would make this worth it?</span>
            <textarea className={`${input} mt-1 min-h-[70px]`} required value={f.goals} onChange={(e) => set("goals", e.target.value)} placeholder="Stop spending Friday afternoons on invoicing; respond to new leads within an hour" />
          </label>
        </section>

        {procs.map((p, i) => (
          <section key={i} className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Process {i + 1}</h2>
              {procs.length > 1 && (
                <button type="button" onClick={() => setProcs((ps) => ps.filter((_, j) => j !== i))} className="btn-ghost text-sm"><Trash2 size={14} /> Remove</button>
              )}
            </div>
            <label className="block mt-4"><span className={label}>What is it called?</span>
              <input className={`${input} mt-1`} required value={p.name} onChange={(e) => setP(i, "name", e.target.value)} placeholder="Monthly client invoicing" />
            </label>
            <label className="block mt-4"><span className={label}>How does it work today, step by step?</span>
              <textarea className={`${input} mt-1 min-h-[100px]`} required value={p.steps} onChange={(e) => setP(i, "steps", e.target.value)} placeholder="Export hours from the timesheet, copy them into a spreadsheet, build each invoice in QuickBooks, email the PDF, chase late payers by hand…" />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <label className="block"><span className={label}>How often</span><input className={`${input} mt-1`} type="number" min="0.25" step="any" required value={p.timesPer} onChange={(e) => setP(i, "timesPer", e.target.value)} placeholder="3" /></label>
              <label className="block"><span className={label}>Per</span>
                <select className={`${input} mt-1`} value={p.per} onChange={(e) => setP(i, "per", e.target.value)}><option value="day">day</option><option value="week">week</option><option value="month">month</option></select>
              </label>
              <label className="block"><span className={label}>Minutes each time</span><input className={`${input} mt-1`} type="number" min="1" required value={p.minutesEach} onChange={(e) => setP(i, "minutesEach", e.target.value)} placeholder="45" /></label>
              <label className="block"><span className={label}>People involved</span><input className={`${input} mt-1`} type="number" min="1" required value={p.people} onChange={(e) => setP(i, "people", e.target.value)} /></label>
            </div>
            {hours(p) > 0 && <p className="font-dm text-xs text-[#7A8FA6] mt-2">That&apos;s about {hours(p)} hours a month.</p>}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <label className="block"><span className={label}>Tools used for it (optional)</span><input className={`${input} mt-1`} value={p.tools} onChange={(e) => setP(i, "tools", e.target.value)} /></label>
              <label className="block"><span className={label}>What goes wrong (optional)</span><input className={`${input} mt-1`} value={p.pain} onChange={(e) => setP(i, "pain", e.target.value)} placeholder="Typos in amounts, invoices go out late" /></label>
            </div>
          </section>
        ))}
        {procs.length < 3 && (
          <button type="button" onClick={() => setProcs((ps) => [...ps, emptyProc()])} className="btn-secondary text-sm"><Plus size={15} /> Add another process</button>
        )}

        {error && <p className="font-dm text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto justify-center disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
          {testMode
            ? busy ? "Creating..." : "Create free test blueprint"
            : busy ? "Starting checkout..." : `Continue to secure checkout · ${price}`}
        </button>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-32">
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <p className="font-syne font-extrabold text-3xl text-[#0D1B2A]">{testMode ? "Free (test)" : price}</p>
          <p className="font-dm text-sm text-[#7A8FA6]">One time. No subscription.</p>
          <ul className="mt-4 space-y-2 font-dm text-sm text-[#3A4A5C]">
            <li>· Delivered by private link, usually within minutes</li>
            <li>· Printable, to share with your team</li>
            <li>· Credited in full if you hire us to build it within {creditDays} days</li>
          </ul>
        </div>
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <p className="font-dm text-sm font-semibold text-[#0D1B2A]">Lost your link?</p>
          {linkMsg ? (
            <p className="font-dm text-sm text-[#3A4A5C] mt-2">{linkMsg}</p>
          ) : (
            <form onSubmit={requestLink} className="mt-2 flex gap-2">
              <input className={input} type="email" required value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="Your email" />
              <button className="btn-secondary !px-4 text-sm shrink-0">Send</button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
