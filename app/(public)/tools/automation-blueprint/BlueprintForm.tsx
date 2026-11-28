"use client";
import { useEffect, useState } from "react";
import { Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";

const input =
  "w-full px-3.5 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] bg-white";
const label = "font-dm text-xs font-semibold text-[#3A4A5C]";

interface Proc {
  name: string; steps: string; timesPer: string; per: "day" | "week" | "month"; minutesEach: string; people: string; tools: string; pain: string;
}
const emptyProc = (): Proc => ({ name: "", steps: "", timesPer: "", per: "week", minutesEach: "", people: "1", tools: "", pain: "" });
const PER = { day: 21.7, week: 4.33, month: 1 };
const DRAFT_KEY = "tiblogics-blueprint-draft";
const TEAM_SIZES = ["1", "2-5", "6-20", "21-50", "51+"];

export default function BlueprintForm({ price, creditDays, testMode = false }: { price: string | null; creditDays: number; testMode?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const usd = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const hoursFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
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
      // locale: the blueprint is written in the language the form was filled in.
      body: JSON.stringify(testMode ? { tool: "blueprint", intake: { ...f, processes: procs, locale } } : { ...f, processes: procs, locale }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    const next = d.url ?? d.link;
    if (res?.ok && next) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      window.location.href = next;
      return;
    }
    setError(d.error ?? t("tools.common.error"));
    setBusy(false);
  }

  async function waitlist(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email, product: "automation-blueprint" }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setNotice(res?.ok ? t("tools.common.waitlistDone") : d.error ?? t("tools.common.error"));
  }

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/blueprint/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: linkEmail }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setLinkMsg(d.message ?? d.error ?? t("tools.common.tryAgain"));
  }

  if (!price && !testMode) {
    return (
      <div className="max-w-xl bg-white border border-[#D2DCE8] rounded-2xl p-6">
        <p className="font-syne font-bold text-xl text-[#0D1B2A]">{t("tools.common.openingSoon")}</p>
        <p className="font-dm text-sm text-[#3A4A5C] mt-1">{t("tools.bp.soonBody")}</p>
        {notice ? (
          <p className="font-dm text-sm text-green-700 mt-4">{notice}</p>
        ) : (
          <form onSubmit={waitlist} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input className={input} type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} placeholder={t("tools.common.waitlistPlaceholder")} aria-label={t("tools.common.yourEmail")} />
            <button className="btn-primary justify-center shrink-0">{t("tools.common.joinWaitlist")}</button>
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
            <strong>{t("tools.bp.testMode")}</strong> {t("tools.bp.testModeBody")}
          </p>
        )}
        <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
          <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{t("tools.bp.about")}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <label className="block"><span className={label}>{t("tools.bp.name")}</span><input className={`${input} mt-1`} required value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label className="block"><span className={label}>{t("tools.bp.email")}</span><input className={`${input} mt-1`} type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
            <label className="block"><span className={label}>{t("tools.bp.company")}</span><input className={`${input} mt-1`} required value={f.company} onChange={(e) => set("company", e.target.value)} /></label>
            <label className="block"><span className={label}>{t("tools.bp.industry")}</span><input className={`${input} mt-1`} required value={f.industry} onChange={(e) => set("industry", e.target.value)} placeholder={t("tools.bp.industryPh")} /></label>
            <label className="block"><span className={label}>{t("tools.bp.teamSize")}</span>
              <select className={`${input} mt-1`} value={f.teamSize} onChange={(e) => set("teamSize", e.target.value)}>
                {TEAM_SIZES.map((s) => <option key={s} value={s}>{s === "1" ? t("tools.bp.justMe") : t("tools.bp.people", { n: s.replace("-", "–") })}</option>)}
              </select>
            </label>
            <label className="block"><span className={label}>{t("tools.bp.budget")}</span>
              <select className={`${input} mt-1`} value={f.budget} onChange={(e) => set("budget", e.target.value)}>
                <option value="not-sure">{t("tools.bp.budget.not-sure")}</option>
                <option value="under-1k">{t("tools.bp.budget.under", { a: usd(1000) })}</option>
                <option value="1k-5k">{t("tools.bp.budget.range", { a: usd(1000), b: usd(5000) })}</option>
                <option value="5k-15k">{t("tools.bp.budget.range", { a: usd(5000), b: usd(15000) })}</option>
                <option value="15k-plus">{t("tools.bp.budget.over", { a: usd(15000) })}</option>
              </select>
            </label>
          </div>
          <label className="block mt-4"><span className={label}>{t("tools.bp.tools")}</span>
            <textarea className={`${input} mt-1 min-h-[70px]`} required value={f.tools} onChange={(e) => set("tools", e.target.value)} placeholder={t("tools.bp.toolsPh")} />
          </label>
          <label className="block mt-4"><span className={label}>{t("tools.bp.goals")}</span>
            <textarea className={`${input} mt-1 min-h-[70px]`} required value={f.goals} onChange={(e) => set("goals", e.target.value)} placeholder={t("tools.bp.goalsPh")} />
          </label>
        </section>

        {procs.map((p, i) => (
          <section key={i} className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{t("tools.bp.process", { n: i + 1 })}</h2>
              {procs.length > 1 && (
                <button type="button" onClick={() => setProcs((ps) => ps.filter((_, j) => j !== i))} className="btn-ghost text-sm"><Trash2 size={14} /> {t("tools.bp.remove")}</button>
              )}
            </div>
            <label className="block mt-4"><span className={label}>{t("tools.bp.procName")}</span>
              <input className={`${input} mt-1`} required value={p.name} onChange={(e) => setP(i, "name", e.target.value)} placeholder={t("tools.bp.procNamePh")} />
            </label>
            <label className="block mt-4"><span className={label}>{t("tools.bp.steps")}</span>
              <textarea className={`${input} mt-1 min-h-[100px]`} required value={p.steps} onChange={(e) => setP(i, "steps", e.target.value)} placeholder={t("tools.bp.stepsPh")} />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 items-end">
              <label className="block min-w-0"><span className={label}>{t("tools.bp.howOften")}</span><input className={`${input} mt-1`} type="number" min="0.25" step="any" required value={p.timesPer} onChange={(e) => setP(i, "timesPer", e.target.value)} placeholder="3" /></label>
              <label className="block min-w-0"><span className={label}>{t("tools.bp.per")}</span>
                <select className={`${input} mt-1`} value={p.per} onChange={(e) => setP(i, "per", e.target.value)}>
                  <option value="day">{t("tools.bp.per.day")}</option><option value="week">{t("tools.bp.per.week")}</option><option value="month">{t("tools.bp.per.month")}</option>
                </select>
              </label>
              <label className="block min-w-0"><span className={label}>{t("tools.bp.minutes")}</span><input className={`${input} mt-1`} type="number" min="1" required value={p.minutesEach} onChange={(e) => setP(i, "minutesEach", e.target.value)} placeholder="45" /></label>
              <label className="block min-w-0"><span className={label}>{t("tools.bp.peopleInvolved")}</span><input className={`${input} mt-1`} type="number" min="1" required value={p.people} onChange={(e) => setP(i, "people", e.target.value)} /></label>
            </div>
            {hours(p) > 0 && <p className="font-dm text-xs text-[#7A8FA6] mt-2">{t("tools.bp.hoursMonth", { n: hoursFmt.format(hours(p)) })}</p>}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <label className="block"><span className={label}>{t("tools.bp.procTools")}</span><input className={`${input} mt-1`} value={p.tools} onChange={(e) => setP(i, "tools", e.target.value)} /></label>
              <label className="block"><span className={label}>{t("tools.bp.pain")}</span><input className={`${input} mt-1`} value={p.pain} onChange={(e) => setP(i, "pain", e.target.value)} placeholder={t("tools.bp.painPh")} /></label>
            </div>
          </section>
        ))}
        {procs.length < 3 && (
          <button type="button" onClick={() => setProcs((ps) => [...ps, emptyProc()])} className="btn-secondary text-sm"><Plus size={15} /> {t("tools.bp.addProcess")}</button>
        )}

        {error && <p role="alert" className="font-dm text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto justify-center text-center disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Lock size={15} className="shrink-0" />}
          {testMode
            ? busy ? t("tools.bp.creating") : t("tools.bp.createTest")
            : busy ? t("tools.bp.starting") : t("tools.bp.continue", { price: price ?? "" })}
        </button>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-32">
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <p className="font-syne font-extrabold text-3xl text-[#0D1B2A]">{testMode ? t("tools.bp.freeTest") : price}</p>
          <p className="font-dm text-sm text-[#7A8FA6]">{t("tools.bp.oneTime")}</p>
          <ul className="mt-4 space-y-2 font-dm text-sm text-[#3A4A5C]">
            <li>· {t("tools.bp.li1")}</li>
            <li>· {t("tools.bp.li2")}</li>
            <li>· {t("tools.bp.li3", { n: creditDays })}</li>
          </ul>
        </div>
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{t("tools.bp.lost")}</p>
          {linkMsg ? (
            <p className="font-dm text-sm text-[#3A4A5C] mt-2">{linkMsg}</p>
          ) : (
            <form onSubmit={requestLink} className="mt-2 flex gap-2">
              <input className={`${input} min-w-0`} type="email" required value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder={t("tools.common.yourEmail")} aria-label={t("tools.common.yourEmail")} />
              <button className="btn-secondary !px-4 text-sm shrink-0">{t("tools.common.send")}</button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
