"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarCheck, Check, CheckCircle2, Copy, Download, FileText, Gauge, Lightbulb,
  Loader2, Lock, RefreshCw, Rocket, ScanSearch, Shield, Sparkles, Users, Wrench, XCircle, Zap,
} from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Area, ReportView as View, ViewFinding } from "@/lib/scanner/view";

// One scan's report on /tools/scanner/report/<token> (and right after a scan).
// The server decides what is in `view`: locked parts arrive empty and are
// drawn here as blurred placeholders, so nothing paid is ever in the page.

const AREA_ICON: Record<Area, typeof Zap> = { growth: Users, ai: Sparkles, seo: ScanSearch, perf: Zap, ux: Gauge, security: Shield };
const AREA_ORDER: Area[] = ["growth", "ai", "seo", "perf", "ux", "security"];

function color(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 50) return "#E06D12";
  return "#dc2626";
}

function Ring({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90" aria-hidden>
        <circle cx="72" cy="72" r={r} fill="none" stroke="#E8EFF8" strokeWidth="12" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={color(score)} strokeWidth="12" strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-syne text-3xl font-extrabold text-[#0D1B2A]">{score}</span>
        <span className="font-dm text-xs text-[#7A8FA6]">/ 100</span>
      </div>
    </div>
  );
}

function FindingRow({ f, locked }: { f: ViewFinding; locked?: boolean }) {
  const t = useT();
  const Icon = f.type === "bad" ? XCircle : f.type === "warning" ? AlertTriangle : CheckCircle2;
  const tone = f.type === "bad" ? "text-red-500" : f.type === "warning" ? "text-[#E06D12]" : "text-green-600";
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon size={17} className={`mt-0.5 shrink-0 ${tone}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-dm text-sm text-[#0D1B2A] break-words">{f.text}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-dm text-[11.5px] text-[#7A8FA6]">
          <span>{t(`tools.sr.area.${f.area}`)}</span>
          {f.service && <span>· {f.service}</span>}
          {locked && f.type !== "good" && (
            <span className="inline-flex items-center gap-1 text-[#B8500A]"><Lock size={11} aria-hidden /> {t("tools.sr.fixLocked")}</span>
          )}
        </p>
      </div>
    </li>
  );
}

/** Blurred stand-in for a locked section: fixed shapes, no real content. */
function Blurred({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-[#D2DCE8] bg-[#F8FAFD] p-4" aria-label={label}>
      <div className="pointer-events-none select-none space-y-3 blur-[5px]" aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 rounded bg-[#C9D5E4]" style={{ width: `${70 - ((i * 13) % 30)}%` }} />
            <div className="h-2.5 rounded bg-[#DDE5EF]" style={{ width: `${90 - ((i * 7) % 25)}%` }} />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 font-dm text-xs font-semibold text-[#1B3A6B] shadow-sm ring-1 ring-[#D2DCE8]">
          <Lock size={12} aria-hidden /> {label}
        </span>
      </div>
    </div>
  );
}

const card = "rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-6";
const h2 = "font-syne text-lg font-bold text-[#0D1B2A]";

function saveRecent(domain: string, token: string) {
  try {
    const key = "tib:scanner:reports";
    const list = (JSON.parse(localStorage.getItem(key) ?? "[]") as Array<{ domain: string; token: string; at: number }>).filter((r) => r.token !== token);
    list.unshift({ domain, token, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
  } catch {
    /* storage blocked */
  }
}

export default function ReportView({ initial, paidReturn = false, canceled = false }: { initial: View; paidReturn?: boolean; canceled?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const [v, setV] = useState(initial);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const polls = useRef(0);
  const nf = new Intl.NumberFormat(locale);

  useEffect(() => {
    if (v.domain && v.token) saveRecent(v.domain, v.token);
  }, [v.domain, v.token]);

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/scanner/report/${v.token}`, { cache: "no-store" }).catch(() => null);
    if (r?.ok) setV(await r.json());
  }, [v.token]);

  // Poll while a payment is being confirmed.
  const waiting = paidReturn && v.level !== "full";
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => {
      polls.current += 1;
      if (polls.current > 60) clearInterval(id);
      else void refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [waiting, refresh]);

  async function post(path: string, body: unknown, key: string): Promise<Response | null> {
    setBusy(key);
    setErr(null);
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(typeof j.error === "string" ? j.error : t("tools.common.error"));
        return null;
      }
      return r;
    } catch {
      setErr(t("tools.common.error"));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return setErr(t("tools.sr.email.needConsent"));
    const r = await post(`/api/scanner/report/${v.token}/email`, { email, consent: true }, "email");
    if (r) setV(await r.json());
  }

  async function buy() {
    const r = await post(`/api/scanner/report/${v.token}/checkout`, {}, "buy");
    if (r) window.location.href = (await r.json()).url;
  }

  async function compare(e: React.FormEvent) {
    e.preventDefault();
    const urls = competitors.map((c) => c.trim()).filter(Boolean);
    if (!urls.length) return;
    const r = await post(`/api/scanner/report/${v.token}/compare`, { urls }, "compare");
    if (r) {
      setV(await r.json());
      setCompetitors(["", "", ""]);
    }
  }

  async function rescan() {
    const r = await post("/api/scanner/audit", { url: v.url, rescanToken: v.token }, "rescan");
    if (r) {
      const j = await r.json();
      if (j.token) window.location.href = `/tools/scanner/report/${j.token}`;
    }
  }

  function copyLink() {
    void navigator.clipboard?.writeText(window.location.origin + `/tools/scanner/report/${v.token}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(v.createdAt));
  const locked = v.level !== "full";
  const bookHref = `/book?scan=${v.token}`;

  // ── Bought over the free limit, not paid yet ───────────────────────────────
  if (v.held) {
    return (
      <div className={`${card} mx-auto max-w-xl text-center`} data-testid="report-held">
        <Lock className="mx-auto text-[#1B3A6B]" size={28} aria-hidden />
        <h2 className={`${h2} mt-3`}>{t("tools.sr.held.title", { domain: v.domain })}</h2>
        <p className="mt-2 font-dm text-sm text-[#3A4A5C]">{paidReturn ? t("tools.sr.paid.confirming") : t("tools.sr.held.body", { price: v.price ?? "" })}</p>
        {paidReturn ? (
          <Loader2 className="mx-auto mt-4 animate-spin text-[#F47C20]" aria-hidden />
        ) : (
          <button type="button" onClick={buy} disabled={busy === "buy"} className="btn-primary mt-5 justify-center px-6 py-3 rounded-xl">
            {busy === "buy" ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} aria-hidden />} {t("tools.sr.unlock.buy", { price: v.price ?? "" })}
          </button>
        )}
        {err && <p className="mt-3 font-dm text-sm text-red-600">{err}</p>}
      </div>
    );
  }

  const overall = v.scores.overall ?? 0;
  const problemsShown = v.problems ?? v.top;
  const hiddenProblems = Math.max(0, v.problemsTotal - problemsShown.length);

  return (
    <div className="space-y-6" data-testid="scan-report" data-level={v.level}>
      {paidReturn && v.level !== "full" && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-dm text-sm text-green-800">
          <Loader2 size={16} className="animate-spin" aria-hidden /> {t("tools.sr.paid.confirming")}
        </div>
      )}
      {canceled && v.level !== "full" && (
        <div className="rounded-xl border border-[#D2DCE8] bg-white px-4 py-3 font-dm text-sm text-[#3A4A5C]">{t("tools.common.canceled")}</div>
      )}

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className={`${card} flex flex-col items-center text-center`}>
          <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#7A8FA6]">{t("tools.sr.overall")}</p>
          <p className="mt-1 max-w-full break-all font-syne text-base font-bold text-[#1B3A6B]">{v.domain}</p>
          <div className="mt-3"><Ring score={overall} /></div>
          <p className="mt-3 font-syne text-base font-bold" style={{ color: color(overall) }}>
            {t(`tools.scanner.verdict.${overall >= 70 ? "ready" : overall >= 50 ? "work" : "critical"}`)}
          </p>
          {v.percentile !== null && (
            <p className="mt-1 font-dm text-sm text-[#3A4A5C]">{t("tools.sr.percentile", { p: nf.format(v.percentile) })}</p>
          )}
          {v.platform && <p className="mt-2 rounded-full bg-[#EBF0FA] px-3 py-1 font-dm text-xs font-semibold text-[#1B3A6B]">{t("tools.sr.builtWith", { platform: v.platform })}</p>}
          <p className="mt-3 font-dm text-xs text-[#7A8FA6]">{t("tools.sr.scannedOn", { date })}</p>
        </div>

        <div className={card}>
          <h2 className={h2}>{t("tools.sr.areas")}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {AREA_ORDER.map((a) => {
              const s = v.scores[a];
              if (s === null) return null;
              const c = v.counts[a];
              const Icon = AREA_ICON[a];
              const n = c.bad + c.warning;
              return (
                <li key={a} className="rounded-xl bg-[#F4F7FB] p-3" data-testid={`area-${a}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 font-dm text-[13px] font-semibold text-[#0D1B2A]">
                      <Icon size={14} className="shrink-0 text-[#1B3A6B]" aria-hidden /> <span className="truncate">{t(`tools.sr.area.${a}`)}</span>
                    </span>
                    <span className="font-syne text-lg font-bold" style={{ color: color(s) }}>{s}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#DCE4EF]">
                    <div className="h-full rounded-full" style={{ width: `${s}%`, backgroundColor: color(s) }} />
                  </div>
                  <p className="mt-1.5 font-dm text-[11.5px] text-[#7A8FA6]">
                    {n === 0 ? t("tools.sr.count.none") : n === 1 ? t("tools.sr.count.one") : t("tools.sr.count.other", { n: nf.format(n) })}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Problems ─────────────────────────────────────────────────────── */}
      {v.level !== "full" && (
        <div className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={h2}>{v.level === "free" ? t("tools.sr.top") : t("tools.sr.problems", { n: nf.format(v.problemsTotal) })}</h2>
            <span className="font-dm text-xs text-[#7A8FA6]">{t("tools.sr.problemsTotal", { n: nf.format(v.problemsTotal) })}</span>
          </div>
          {problemsShown.length === 0 ? (
            <p className="mt-3 font-dm text-sm text-[#3A4A5C]">{t("tools.sr.noProblems")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-[#EEF2F7]">{problemsShown.map((f, i) => <FindingRow key={`${f.check}-${i}`} f={f} locked />)}</ul>
          )}

          {v.level === "free" && (
            <>
              {hiddenProblems > 0 && <div className="mt-3"><Blurred rows={Math.min(4, hiddenProblems)} label={t("tools.sr.moreHidden", { n: nf.format(hiddenProblems) })} /></div>}
              <form onSubmit={submitEmail} className="mt-5 rounded-xl bg-[#F4F7FB] p-4" data-testid="email-gate">
                <p className="font-syne text-base font-bold text-[#0D1B2A]">{t("tools.sr.email.title")}</p>
                <p className="mt-0.5 font-dm text-sm text-[#3A4A5C]">{t("tools.sr.email.body")}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("tools.scanner.email.placeholder")} aria-label={t("tools.common.yourEmail")}
                    className="input-base min-w-0 flex-1 px-3 py-2.5 text-sm"
                  />
                  <button type="submit" disabled={busy === "email"} className="btn-primary justify-center rounded-lg px-5 py-2.5 text-sm">
                    {busy === "email" ? <Loader2 size={15} className="animate-spin" /> : null} {t("tools.sr.email.send")}
                  </button>
                </div>
                <label className="mt-2.5 flex items-start gap-2 font-dm text-xs text-[#3A4A5C]">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" data-testid="email-consent" />
                  <span>{t("tools.sr.email.consent")}</span>
                </label>
              </form>
            </>
          )}
          {v.level === "email" && (
            <p className="mt-3 flex items-center gap-2 font-dm text-sm text-green-700"><Check size={16} aria-hidden /> {t("tools.sr.email.done")}</p>
          )}
          {err && <p className="mt-3 font-dm text-sm text-red-600" role="alert">{err}</p>}
        </div>
      )}

      {/* ── We fix it for you ───────────────────────────────────────────── */}
      <FixOffer n={v.problemsTotal} href={bookHref} />

      {/* ── Unlock ───────────────────────────────────────────────────────── */}
      {locked && (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#1B3A6B] p-6 text-white sm:p-8" data-testid="unlock">
          <p className="font-dm text-xs font-semibold uppercase tracking-[0.16em] text-[#F47C20]">{t("tools.sr.unlock.tag")}</p>
          <h2 className="mt-2 font-syne text-2xl font-bold">{t("tools.sr.unlock.title")}</h2>
          <ul className="mt-4 grid gap-2.5 font-dm text-sm text-white/85 sm:grid-cols-2">
            {[
              [Rocket, t("tools.sr.unlock.fixes", { n: nf.format(v.problemsTotal) })],
              [Lightbulb, t("tools.sr.unlock.ideas", { n: nf.format(v.ideasCount) })],
              [Shield, t("tools.sr.unlock.security")],
              [Gauge, t("tools.sr.unlock.pagespeed")],
              [Users, t("tools.sr.unlock.compare")],
              [FileText, t("tools.sr.unlock.pdf")],
              [RefreshCw, t("tools.sr.unlock.rescan")],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Zap;
              return (
                <li key={i} className="flex items-start gap-2"><I size={16} className="mt-0.5 shrink-0 text-[#F47C20]" aria-hidden /> <span>{text as string}</span></li>
              );
            })}
          </ul>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Blurred rows={2} label={t("tools.sr.locked.fixes")} />
            <Blurred rows={2} label={t("tools.sr.locked.ideas", { n: nf.format(v.ideasCount) })} />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {v.price && (
              <button type="button" onClick={buy} disabled={busy === "buy"} className="btn-primary justify-center rounded-xl px-6 py-3" data-testid="unlock-buy">
                {busy === "buy" ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} aria-hidden />} {t("tools.sr.unlock.buy", { price: v.price })}
              </button>
            )}
            <Link href={bookHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-dm text-sm font-semibold text-white hover:bg-white/10" data-testid="unlock-call">
              <CalendarCheck size={16} aria-hidden /> {t("tools.sr.unlock.call")}
            </Link>
          </div>
          <p className="mt-3 font-dm text-xs text-white/60">{t("tools.sr.unlock.note")}</p>
          {err && v.level !== "free" && <p className="mt-3 font-dm text-sm text-red-300" role="alert">{err}</p>}
        </div>
      )}

      {/* ── Full report ──────────────────────────────────────────────────── */}
      {v.full && <FullReport v={v} busy={busy} err={err} onCompare={compare} competitors={competitors} setCompetitors={setCompetitors} onRescan={rescan} onCopy={copyLink} copied={copied} />}
    </div>
  );
}

/** "We'll fix these issues for you": shown on every report with problems. */
function FixOffer({ n, href }: { n: number; href: string }) {
  const t = useT();
  if (n <= 0) return null;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#F47C20] bg-gradient-to-br from-[#FFF6EE] to-white p-6 sm:flex-row sm:items-center sm:p-7" data-testid="fix-offer">
      <div className="min-w-0 flex-1">
        <p className="font-dm text-xs font-semibold uppercase tracking-[0.16em] text-[#E06D12]">{t("tools.sr.fix.tag")}</p>
        <h2 className="mt-1 font-syne text-xl font-bold text-[#0D1B2A]">{n === 1 ? t("tools.sr.fix.title.one") : t("tools.sr.fix.title.other", { n: String(n) })}</h2>
        <p className="mt-1.5 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t("tools.sr.fix.body")}</p>
        <p className="mt-1.5 font-dm text-xs text-[#7A8FA6]">{t("tools.sr.fix.note")}</p>
      </div>
      <Link href={href} className="btn-primary shrink-0 justify-center rounded-xl px-6 py-3" data-testid="fix-offer-cta">
        <Wrench size={16} aria-hidden /> {t("tools.sr.fix.cta")}
      </Link>
    </div>
  );
}

function FullReport(props: {
  v: View;
  busy: string | null;
  err: string | null;
  onCompare: (e: React.FormEvent) => void;
  competitors: string[];
  setCompetitors: (c: string[]) => void;
  onRescan: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const { v, busy, err } = props;
  const t = useT();
  const locale = useLocale();
  const f = v.full!;
  const ideas = f.ideas.map((i) => ({ ...i, outcome: "" }));
  const ms = (n: number | null) => (n == null ? "-" : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n / 1000)} s`);
  const tech = f.tech;

  return (
    <div className="space-y-6" data-testid="full-report">
      {/* The full report: what is wrong and why it matters. No written fix
          plan: fixing it is what TIBLOGICS is booked for. */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={h2}>{t("tools.sr.fullReport")}</h2>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/scanner/report/${v.token}/pdf`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D2DCE8] px-3 py-2 font-dm text-sm font-semibold text-[#1B3A6B] hover:border-[#1B3A6B]" data-testid="report-pdf">
              <Download size={15} aria-hidden /> {t("tools.sr.pdf")}
            </a>
            <button type="button" onClick={props.onCopy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D2DCE8] px-3 py-2 font-dm text-sm font-semibold text-[#1B3A6B] hover:border-[#1B3A6B]">
              {props.copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {props.copied ? t("tools.sr.copied") : t("tools.sr.share")}
            </button>
          </div>
        </div>
        <p className="mt-3 font-dm text-[15px] leading-relaxed text-[#3A4A5C]">{t("tools.sr.fullReport.body", { n: v.problemsTotal })}</p>
      </div>

      {/* Build ideas */}
      <div className={card}>
        <h2 className={h2}>{t("tools.sr.ideas")}</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {ideas.map((i) => (
            <li key={i.key + i.title} className="rounded-xl bg-[#FEF6EE] p-4">
              <p className="flex items-center gap-1.5 font-syne text-[15px] font-bold text-[#0D1B2A]"><Lightbulb size={15} className="text-[#E06D12]" aria-hidden /> {i.title}</p>
              <p className="mt-1 font-dm text-sm text-[#3A4A5C]">{i.body}</p>
              {i.outcome && <p className="mt-1.5 font-dm text-sm font-semibold text-green-700">{t("tools.sr.outcome")} {i.outcome}</p>}
            </li>
          ))}
        </ul>
        <Link href={`/book?scan=${v.token}`} className="btn-primary mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm">
          {t("tools.sr.ideas.cta")} <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      {/* Every check */}
      <div className={card}>
        <h2 className={h2}>{t("tools.sr.allChecks")}</h2>
        <div className="mt-2 grid gap-x-8 md:grid-cols-2">
          {AREA_ORDER.map((a) => {
            const list = f.findings.filter((x) => x.area === a);
            if (!list.length) return null;
            return (
              <div key={a} className="mt-4">
                <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#7A8FA6]">{t(`tools.sr.area.${a}`)}</p>
                <ul className="divide-y divide-[#EEF2F7]">{list.map((x, i) => <FindingRow key={`${x.check}-${i}`} f={x} />)}</ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Detected tools */}
        <div className={card}>
          <h2 className={h2}>{t("tools.sr.tech")}</h2>
          {tech ? (
            <dl className="mt-3 space-y-2 font-dm text-sm">
              {([
                ["platform", [tech.cms, tech.cmsVersion].filter(Boolean).join(" ")],
                ["shop", tech.shop ?? ""],
                ["analytics", [...tech.analytics, ...tech.pixels].join(", ")],
                ["booking", tech.booking ?? ""],
                ["chat", tech.chat.join(", ")],
                ["languages", tech.languages.join(", ")],
                ["libraries", tech.libraries.map((x) => `${x.name}${x.version ? ` ${x.version}` : ""}${x.outdated ? ` (${t("tools.sr.tech.outdated")})` : ""}`).join(", ")],
              ] as const).map(([k, val]) => (
                <div key={k} className="flex flex-wrap gap-x-2">
                  <dt className="text-[#7A8FA6]">{t(`tools.sr.tech.${k}`)}:</dt>
                  <dd className="min-w-0 break-words text-[#0D1B2A]">{val || t("tools.sr.tech.none")}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 font-dm text-sm text-[#7A8FA6]">{t("tools.sr.tech.none")}</p>
          )}
        </div>

        {/* PageSpeed */}
        <div className={card}>
          <h2 className={h2}>{t("tools.sr.pagespeed")}</h2>
          {f.pageSpeed ? (
            <div className="mt-3">
              <p className="font-syne text-3xl font-extrabold" style={{ color: color(f.pageSpeed.performance) }}>
                {f.pageSpeed.performance}<span className="font-dm text-sm font-normal text-[#7A8FA6]"> / 100 · {t("tools.sr.ps.mobile")}</span>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 font-dm text-sm">
                {([["LCP", ms(f.pageSpeed.lcpMs)], ["FCP", ms(f.pageSpeed.fcpMs)], ["TBT", f.pageSpeed.tbtMs == null ? "-" : `${f.pageSpeed.tbtMs} ms`], ["CLS", f.pageSpeed.cls == null ? "-" : String(f.pageSpeed.cls)]] as const).map(([k, val]) => (
                  <div key={k} className="rounded-lg bg-[#F4F7FB] px-3 py-2"><dt className="text-[11px] text-[#7A8FA6]">{k}</dt><dd className="font-semibold text-[#0D1B2A]">{val}</dd></div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="mt-3 font-dm text-sm text-[#7A8FA6]">{t("tools.sr.ps.unavailable")}</p>
          )}
        </div>
      </div>

      {/* Competitors */}
      <div className={card}>
        <h2 className={h2}>{t("tools.sr.compare")}</h2>
        <p className="mt-1 font-dm text-sm text-[#3A4A5C]">{t("tools.sr.compare.body")}</p>
        {f.compare.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] font-dm text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#7A8FA6]">
                  <th className="py-2 pr-3">{t("tools.sr.compare.site")}</th>
                  <th className="py-2 pr-3">{t("tools.sr.overall")}</th>
                  {AREA_ORDER.map((a) => <th key={a} className="py-2 pr-3">{t(`tools.sr.areaShort.${a}`)}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#EEF2F7] font-semibold">
                  <td className="py-2 pr-3 text-[#1B3A6B]">{v.domain}</td>
                  <td className="py-2 pr-3" style={{ color: color(v.scores.overall ?? 0) }}>{v.scores.overall}</td>
                  {AREA_ORDER.map((a) => <td key={a} className="py-2 pr-3">{v.scores[a] ?? "-"}</td>)}
                </tr>
                {f.compare.map((c) => (
                  <tr key={c.host} className="border-t border-[#EEF2F7]">
                    <td className="py-2 pr-3 break-all">{c.host}</td>
                    {c.ok && c.scores ? (
                      <>
                        <td className="py-2 pr-3" style={{ color: color(c.scores.overall) }}>{c.scores.overall}</td>
                        {AREA_ORDER.map((a) => <td key={a} className="py-2 pr-3">{c.scores![a]}</td>)}
                      </>
                    ) : (
                      <td colSpan={7} className="py-2 pr-3 text-[#7A8FA6]">{c.error}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form onSubmit={props.onCompare} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          {props.competitors.map((c, i) => (
            <input
              key={i} value={c} onChange={(e) => props.setCompetitors(props.competitors.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={t("tools.sr.compare.placeholder", { n: i + 1 })} aria-label={t("tools.sr.compare.placeholder", { n: i + 1 })}
              className="input-base min-w-0 px-3 py-2 text-sm"
            />
          ))}
          <button type="submit" disabled={busy === "compare"} className="btn-primary justify-center rounded-lg px-4 py-2 text-sm" data-testid="compare-run">
            {busy === "compare" ? <Loader2 size={15} className="animate-spin" /> : null} {t("tools.sr.compare.run")}
          </button>
        </form>
        {err && busy === null && <p className="mt-2 font-dm text-sm text-red-600" role="alert">{err}</p>}
      </div>

      {/* Re-scan */}
      {f.rescan.credits > 0 && f.rescan.until && (
        <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <h2 className={h2}>{t("tools.sr.rescan.title")}</h2>
            <p className="mt-0.5 font-dm text-sm text-[#3A4A5C]">{t("tools.sr.rescan.body", { date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(f.rescan.until)) })}</p>
          </div>
          <button type="button" onClick={props.onRescan} disabled={busy === "rescan"} className="btn-primary justify-center rounded-xl px-5 py-2.5 text-sm" data-testid="rescan">
            {busy === "rescan" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} aria-hidden />} {t("tools.sr.rescan.run")}
          </button>
        </div>
      )}
    </div>
  );
}
