"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, ExternalLink, FileText, Info, Loader2, Lock, RefreshCw, ShieldAlert, XCircle, Bot, Search as SearchIcon, ShieldCheck } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { AgentView } from "@/lib/agent-ready/service";
import type { Area, CheckId, Status } from "@/lib/agent-ready/scan";
import HelpBox from "./HelpBox";

// The AI Agent Readiness report. The server decides what this visitor may
// see (lib/agent-ready/service.ts viewOf): free shows the score and the
// counts, the report adds every check and agent, the kit adds the fix guide,
// the files and re-scans.

type Check = NonNullable<AgentView["checks"]>[number];
const AREAS: Area[] = ["access", "read", "data", "guide"];
const PLATFORM_LABEL: Record<string, string> = {
  shopify: "Shopify", woocommerce: "WooCommerce", wordpress: "WordPress", wix: "Wix", squarespace: "Squarespace", webflow: "Webflow",
  bigcommerce: "BigCommerce", magento: "Magento", prestashop: "PrestaShop", godaddy: "GoDaddy", framer: "Framer", nextjs: "Next.js",
};

const STATUS_STYLE: Record<Status, { icon: typeof CheckCircle2; cls: string }> = {
  pass: { icon: CheckCircle2, cls: "text-[#1E9E6A]" },
  warn: { icon: AlertTriangle, cls: "text-[#C77700]" },
  fail: { icon: XCircle, cls: "text-[#C62828]" },
  info: { icon: Info, cls: "text-[#2251A3]" },
};

const VERDICT_STYLE: Record<AgentView["verdict"], string> = {
  ready: "#1E9E6A",
  partial: "#C77700",
  notReady: "#C62828",
};

export default function AgentReport({
  initial,
  prices,
  rescansTotal,
  paidReturn,
  canceled,
}: {
  initial: AgentView;
  prices: { report: string | null; kit: string | null };
  rescansTotal: number;
  paidReturn: boolean;
  canceled: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [view, setView] = useState(initial);
  const [buying, setBuying] = useState<"report" | "kit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [rescanned, setRescanned] = useState(false);
  const [waiting, setWaiting] = useState(paidReturn && initial.tier === "free");

  // Back from Stripe before the payment is recorded: check a few times.
  useEffect(() => {
    if (!waiting) return;
    let n = 0;
    const id = setInterval(async () => {
      n++;
      const res = await fetch(`/api/tools/agent-ready/${view.token}`, { cache: "no-store" }).catch(() => null);
      const next = res?.ok ? ((await res.json()) as AgentView) : null;
      if (next && next.tier !== "free") {
        setView(next);
        setWaiting(false);
      }
      if (n >= 10) setWaiting(false);
    }, 2000);
    return () => clearInterval(id);
  }, [waiting, view.token]);

  async function buy(kind: "report" | "kit") {
    setBuying(kind);
    setError(null);
    try {
      const res = await fetch(`/api/tools/agent-ready/${view.token}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buy: kind }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || t("tools.agent.err.failed"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tools.agent.err.failed"));
      setBuying(null);
    }
  }

  async function rescan() {
    setRescanning(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/agent-ready/${view.token}/rescan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = (await res.json().catch(() => ({}))) as AgentView & { error?: string };
      if (!res.ok) throw new Error(data.error || t("tools.agent.err.generic"));
      setView(data);
      setRescanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tools.agent.err.generic"));
    } finally {
      setRescanning(false);
    }
  }

  const s = view.summary;
  const platformName = t(`tools.agent.platform.${view.guidePlatform}`);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(view.scannedAt));

  return (
    <div className="space-y-6" data-testid="agent-report" data-tier={view.tier}>
      {view.staff && <p className="rounded-xl bg-[#EBF0FA] px-4 py-2 font-dm text-sm text-[#1B3A6B]">{t("tools.agent.r.staff")}</p>}
      {canceled && <Notice tone="info">{t("tools.agent.paid.canceled")}</Notice>}
      {paidReturn && waiting && (
        <Notice tone="info">
          <Loader2 size={15} className="mr-1 inline animate-spin" aria-hidden /> {t("tools.agent.paid.wait")}
        </Notice>
      )}
      {paidReturn && !waiting && view.tier !== "free" && <Notice tone="ok">{t("tools.agent.paid.thanks")}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {rescanned && <Notice tone="ok">{t("tools.agent.kit.rescanDone")}</Notice>}

      {/* Score and verdict */}
      <section className="rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={view.score} color={VERDICT_STYLE[view.verdict]} label={t("tools.agent.r.score")} />
          <div className="min-w-0 flex-1">
            <p className="font-syne text-2xl font-extrabold" style={{ color: VERDICT_STYLE[view.verdict] }} data-testid="agent-verdict">
              {t(`tools.agent.verdict.${view.verdict}`)}
            </p>
            <p className="mt-1.5 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(`tools.agent.verdict.${view.verdict}.body`)}</p>
            <div className="mt-3 flex flex-wrap gap-2 font-dm text-xs text-[#3A4A5C]">
              <Chip>{t("tools.agent.r.scanned", { date })}</Chip>
              {view.platform && <Chip>{t("tools.agent.r.platform", { platform: PLATFORM_LABEL[view.platform] ?? view.platform })}</Chip>}
              {view.shop && <Chip>{t("tools.agent.r.shop")}</Chip>}
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat icon={Bot} label={t("tools.agent.stat.assistants")} tip={t("tools.agent.stat.assistantsTip")} value={t("tools.agent.stat.of", { n: s.assistantsBlocked, total: s.assistantsTotal })} bad={s.assistantsBlocked > 0} testid="stat-assistants" />
          <Stat icon={SearchIcon} label={t("tools.agent.stat.search")} tip={t("tools.agent.stat.searchTip")} value={t("tools.agent.stat.of", { n: s.searchBlocked, total: s.searchTotal })} bad={s.searchBlocked > 0} testid="stat-search" />
          <Stat icon={ShieldAlert} label={t("tools.agent.stat.firewall")} tip={t("tools.agent.stat.firewallTip")} value={String(s.firewallRefused)} bad={s.firewallRefused > 0} testid="stat-firewall" />
        </div>
      </section>

      {/* Free: what is behind the lock */}
      {view.tier === "free" && (
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-7" data-testid="agent-locked">
          <h2 className="font-syne text-xl font-bold text-[#0D1B2A]">{s.problems ? t("tools.agent.locked.title", { n: s.problems }) : t("tools.agent.locked.none")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {AREAS.map((area) => (
              <div key={area} className="rounded-xl border border-[#E6EBF1] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-dm font-semibold text-[#0D1B2A]">{t(`tools.agent.area.${area}`)}</p>
                  <span className={`rounded-full px-2.5 py-0.5 font-dm text-xs font-bold ${s.byArea[area] ? "bg-[#FDECEC] text-[#C62828]" : "bg-[#E8F6EF] text-[#1E9E6A]"}`}>
                    {s.byArea[area] ? t("tools.agent.locked.problems", { n: s.byArea[area] }) : t("tools.agent.locked.ok")}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {s.checks.filter((c) => c.area === area).map((c) => (
                    <li key={c.id} className="flex items-center gap-2 font-dm text-sm text-[#7A8FA6]">
                      <Lock size={13} aria-hidden /> {t(`tools.agent.check.${c.id}.name`)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <BuyButtons view={view} prices={prices} rescansTotal={rescansTotal} buying={buying} onBuy={buy} platformName={platformName} />
        </section>
      )}

      {/* Report and kit: the fix guide first for kit owners */}
      {view.tier === "kit" && view.fixes && (
        <section className="rounded-2xl border border-[#F47C20]/40 bg-white p-5 sm:p-7" data-testid="agent-kit">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-syne text-xl font-bold text-[#0D1B2A]">{t("tools.agent.kit.title")}</h2>
              <p className="mt-1 font-dm text-sm text-[#3A4A5C]">{view.fixes.length ? t("tools.agent.kit.body", { platform: platformName }) : t("tools.agent.kit.none")}</p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <button type="button" onClick={rescan} disabled={rescanning || (view.rescansLeft ?? 0) <= 0} data-testid="agent-rescan" className="inline-flex items-center gap-2 rounded-xl border border-[#1B3A6B] px-4 py-2.5 font-dm text-sm font-semibold text-[#1B3A6B] hover:bg-[#EBF0FA] disabled:opacity-50">
                {rescanning ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <RefreshCw size={15} aria-hidden />} {rescanning ? t("tools.agent.kit.rescanning") : t("tools.agent.kit.rescan")}
              </button>
              {!view.staff && <p className="mt-1 font-dm text-xs text-[#7A8FA6]">{t("tools.agent.kit.rescansLeft", { n: view.rescansLeft ?? 0 })}</p>}
            </div>
          </div>
          <ol className="mt-5 space-y-4">
            {view.fixes.map((f, i) => (
              <li key={f.check} className="rounded-xl border border-[#E6EBF1] p-4" data-testid={`fix-${f.check}`}>
                <p className="font-syne font-bold text-[#0D1B2A]">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F47C20] font-dm text-xs text-white">{i + 1}</span>
                  {t(`tools.agent.check.${f.check}.name`)}
                </p>
                <ul className="mt-2 space-y-2 pl-8">
                  {f.steps.map((st, j) => (
                    <li key={j} className="list-disc font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(st.key, st.vars ?? {})}</li>
                  ))}
                  {f.file && (
                    <li className="list-none">
                      <a href={`/api/tools/agent-ready/${view.token}/file/${f.file}?download=1`} className="inline-flex items-center gap-1.5 font-dm text-sm font-semibold text-[#2251A3] hover:underline">
                        <Download size={14} aria-hidden /> {t("tools.agent.kit.useFile", { file: t(`tools.agent.kit.file.${f.file}`) })}
                      </a>
                    </li>
                  )}
                </ul>
              </li>
            ))}
          </ol>
          {view.files && (
            <div className="mt-7">
              <h3 className="font-syne text-lg font-bold text-[#0D1B2A]">{t("tools.agent.kit.files")}</h3>
              <p className="mt-1 font-dm text-sm text-[#3A4A5C]">{t("tools.agent.kit.filesBody")}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {view.files.map((f) => (
                  <div key={f} className="flex flex-col rounded-xl border border-[#E6EBF1] p-4" data-testid={`file-${f}`}>
                    <p className="flex items-center gap-2 font-dm font-semibold text-[#0D1B2A]">
                      <FileText size={16} className="text-[#2251A3]" aria-hidden /> {t(`tools.agent.kit.file.${f}`)}
                    </p>
                    <p className="mt-1 flex-1 font-dm text-xs leading-relaxed text-[#3A4A5C]">{t(`tools.agent.kit.file.${f}.body`)}</p>
                    <div className="mt-3 flex gap-4">
                      <a href={`/api/tools/agent-ready/${view.token}/file/${f}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-dm text-sm text-[#2251A3] hover:underline">
                        <ExternalLink size={14} aria-hidden /> {t("tools.agent.kit.open")}
                      </a>
                      <a href={`/api/tools/agent-ready/${view.token}/file/${f}?download=1`} className="inline-flex items-center gap-1 font-dm text-sm font-semibold text-[#2251A3] hover:underline">
                        <Download size={14} aria-hidden /> {t("tools.agent.kit.download")}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {view.checks && (
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-7" data-testid="agent-checks">
          <h2 className="font-syne text-xl font-bold text-[#0D1B2A]">{t("tools.agent.r.checks")}</h2>
          {AREAS.map((area) => (
            <div key={area} className="mt-5">
              <h3 className="font-dm text-xs font-bold uppercase tracking-wider text-[#7A8FA6]">{t(`tools.agent.area.${area}`)}</h3>
              <ul className="mt-2 divide-y divide-[#EEF2F7]">
                {view.checks!.filter((c) => c.area === area).map((c) => {
                  const st = STATUS_STYLE[c.status];
                  const Icon = st.icon;
                  return (
                    <li key={c.id} className="flex gap-3 py-3" data-testid={`check-${c.id}`} data-status={c.status}>
                      <Icon size={20} className={`mt-0.5 shrink-0 ${st.cls}`} aria-label={t(`tools.agent.status.${c.status}`)} />
                      <div className="min-w-0">
                        <p className="font-dm font-semibold text-[#0D1B2A]">{t(`tools.agent.check.${c.id}.name`)}</p>
                        <p className="mt-0.5 break-words font-dm text-sm text-[#0D1B2A]">{checkText(c, t)}</p>
                        <p className="mt-1 font-dm text-xs leading-relaxed text-[#7A8FA6]">{t(`tools.agent.check.${c.id}.why`)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {view.product && (
            <div className="mt-6 rounded-xl bg-[#F4F7FB] p-4" data-testid="agent-product">
              <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{t("tools.agent.r.product")}</p>
              <p className="mt-1 break-words font-dm text-sm text-[#3A4A5C]">
                {view.product.hasSchema
                  ? t("tools.agent.r.productRow", { name: view.product.name ?? "?", price: view.product.price ?? "?", currency: view.product.currency ?? "", availability: view.product.availability ?? "?" })
                  : t("tools.agent.r.productNone", { url: view.product.url })}
              </p>
            </div>
          )}
        </section>
      )}

      {view.agents && (
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-7" data-testid="agent-agents">
          <h2 className="font-syne text-xl font-bold text-[#0D1B2A]">{t("tools.agent.r.agents")}</h2>
          <p className="mt-1 font-dm text-sm text-[#3A4A5C]">{t("tools.agent.r.agentsBody")}</p>
          {view.testedPaths && <p className="mt-1 break-words font-dm text-xs text-[#7A8FA6]">{t("tools.agent.r.tested", { paths: view.testedPaths.join(", ") })}</p>}
          {(["assistant", "search", "training"] as const).map((role) => (
            <div key={role} className="mt-5">
              <h3 className="font-dm text-xs font-bold uppercase tracking-wider text-[#7A8FA6]">{t(`tools.agent.role.${role}`)}</h3>
              <div className="mt-2 hidden grid-cols-[1.1fr_1.4fr_1fr_0.9fr] gap-3 border-b border-[#EEF2F7] pb-2 font-dm text-xs font-semibold text-[#7A8FA6] md:grid">
                <span>{t("tools.agent.col.agent")}</span>
                <span>{t("tools.agent.col.powers")}</span>
                <span>{t("tools.agent.col.robots")}</span>
                <span>{t("tools.agent.col.live")}</span>
              </div>
              <ul className="divide-y divide-[#EEF2F7]">
                {view.agents!.filter((a) => a.role === role).map((a) => (
                  <li key={a.token} className="grid gap-1 py-2.5 md:grid-cols-[1.1fr_1.4fr_1fr_0.9fr] md:gap-3" data-testid={`agent-${a.token}`} data-robots={a.robots}>
                    <span className="font-dm text-sm font-semibold text-[#0D1B2A]">
                      {a.token} <span className="font-normal text-[#7A8FA6]">· {a.company}</span>
                    </span>
                    <span className="font-dm text-xs text-[#3A4A5C] md:text-sm">{t(`tools.agent.powers.${a.token}`)}</span>
                    <span className="font-dm text-sm">
                      <span className={a.robots === "allowed" ? "text-[#1E9E6A]" : a.robots === "partial" ? "text-[#C77700]" : "text-[#C62828]"}>
                        <span className="text-[#7A8FA6] md:hidden">{t("tools.agent.label", { label: t("tools.agent.col.robots") })}</span>
                        {t(`tools.agent.robots.${a.robots}`)}
                      </span>
                      {a.rule && <span className="block break-all font-mono text-[11px] text-[#7A8FA6]">{t("tools.agent.r.rule", { line: a.rule.line, text: a.rule.text })}</span>}
                    </span>
                    <span className={`font-dm text-sm ${a.live === "ok" ? "text-[#1E9E6A]" : a.live === "blocked" || a.live === "challenge" ? "text-[#C62828]" : "text-[#7A8FA6]"}`}>
                      <span className="text-[#7A8FA6] md:hidden">{t("tools.agent.label", { label: t("tools.agent.col.live") })}</span>
                      {a.live ? t(`tools.agent.live.${a.live}`, { status: a.liveStatus ?? "" }) : t("tools.agent.live.none")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {view.tier === "report" && (
        <section className="rounded-2xl border border-[#F47C20]/50 bg-[#FFF8F1] p-5 sm:p-7" data-testid="agent-upgrade">
          <h2 className="flex items-center gap-2 font-syne text-xl font-bold text-[#0D1B2A]">
            <ShieldCheck size={20} className="text-[#F47C20]" aria-hidden /> {t("tools.agent.plans.kit")}
          </h2>
          <p className="mt-1 font-dm text-sm text-[#3A4A5C]">{t("tools.agent.buy.upgradeBody", { platform: platformName, n: rescansTotal })}</p>
          {prices.kit && (
            <button type="button" onClick={() => buy("kit")} disabled={!!buying} data-testid="buy-kit" data-track="cta-agent-ready-upgrade" className="btn-primary mt-4 justify-center rounded-xl px-5 py-3">
              {buying === "kit" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null} {t("tools.agent.buy.upgrade", { price: prices.kit })}
            </button>
          )}
          <p className="mt-2 font-dm text-xs text-[#7A8FA6]">{t("tools.agent.buy.secure")}</p>
        </section>
      )}

      <HelpBox />
    </div>
  );
}

function BuyButtons({ view, prices, rescansTotal, buying, onBuy, platformName }: { view: AgentView; prices: { report: string | null; kit: string | null }; rescansTotal: number; buying: "report" | "kit" | null; onBuy: (k: "report" | "kit") => void; platformName: string }) {
  const t = useT();
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      {prices.report && (
        <div className="flex flex-col rounded-xl border border-[#D2DCE8] p-5">
          <p className="font-syne text-lg font-bold text-[#0D1B2A]">{t("tools.agent.plans.report")}</p>
          <ul className="mt-2 flex-1 space-y-1">
            {[1, 2, 3].map((n) => (
              <li key={n} className="font-dm text-sm text-[#3A4A5C]">· {t(`tools.agent.plans.report.${n}`)}</li>
            ))}
          </ul>
          <button type="button" onClick={() => onBuy("report")} disabled={!!buying} data-testid="buy-report" data-track="cta-agent-ready-report" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-[#1B3A6B] px-5 py-3 font-dm text-sm font-semibold text-[#1B3A6B] hover:bg-[#EBF0FA] disabled:opacity-60">
            {buying === "report" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Lock size={15} aria-hidden />} {t("tools.agent.buy.report", { price: prices.report })}
          </button>
        </div>
      )}
      {prices.kit && (
        <div className="flex flex-col rounded-xl border-2 border-[#F47C20] p-5">
          <p className="font-syne text-lg font-bold text-[#0D1B2A]">
            {t("tools.agent.plans.kit")} <span className="ml-1 rounded-full bg-[#F47C20] px-2 py-0.5 align-middle font-dm text-[11px] font-bold text-white">{t("tools.agent.plans.kitBadge")}</span>
          </p>
          <p className="mt-2 flex-1 font-dm text-sm text-[#3A4A5C]">{t("tools.agent.buy.upgradeBody", { platform: platformName, n: rescansTotal })}</p>
          <button type="button" onClick={() => onBuy("kit")} disabled={!!buying} data-testid="buy-kit" data-track="cta-agent-ready-kit" className="btn-primary mt-4 justify-center rounded-xl px-5 py-3">
            {buying === "kit" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ShieldCheck size={16} aria-hidden />} {t("tools.agent.buy.kit", { price: prices.kit })}
          </button>
        </div>
      )}
      <p className="font-dm text-xs text-[#7A8FA6] md:col-span-2">{t("tools.agent.buy.secure")}</p>
    </div>
  );
}

type T = (k: string, v?: Record<string, string | number>) => string;
const join = (v: unknown) => (Array.isArray(v) ? (v as string[]).join(", ") : "");

function checkText(c: Check, t: T): string {
  const f = c.facts;
  const k = `tools.agent.check.${c.id}`;
  const ok = c.status === "pass";
  switch (c.id as CheckId) {
    case "assistants":
    case "search":
      return ok ? t(`${k}.pass`, { total: Number(f.total) }) : t(`${k}.issue`, { agents: [join(f.blocked), join(f.partial)].filter(Boolean).join(", ") });
    case "firewall":
      if (f.inconclusive) return t(`${k}.inconclusive`);
      if (c.status === "info") return t(`${k}.info`, { agents: join(f.refused) });
      return ok ? t(`${k}.pass`) : t(`${k}.issue`, { agents: join(f.refusedUseful) });
    case "training":
      return join(f.blocked) ? t(`${k}.some`, { agents: join(f.blocked) }) : t(`${k}.none`);
    case "rendered":
      return t(ok ? `${k}.pass` : `${k}.issue`, { words: Number(f.words) });
    case "speed":
      return t(ok ? `${k}.pass` : `${k}.issue`, { ms: Number(f.ms) });
    case "basics":
    case "social":
      return ok ? t(`${k}.pass`) : t(`${k}.issue`, { missing: join(f.missing) });
    case "noBlockTags":
      return ok ? t(`${k}.pass`) : t(`${k}.issue`, { tags: join(f.tags) });
    case "org":
      return ok ? t(`${k}.pass`, { type: String(f.type ?? "") }) : f.type ? t(`${k}.issuePartial`, { type: String(f.type), missing: join(f.missing) }) : t(`${k}.issue`);
    case "product":
      return ok ? t(`${k}.pass`) : t(`${k}.issue`, { url: String(f.url ?? ""), missing: join(f.missing) });
    case "content":
      return ok ? t(`${k}.pass`, { types: join(f.types) }) : t(`${k}.issue`, { types: join(f.types) ? ` (${join(f.types)})` : "" });
    case "sitemap":
      return ok ? t(`${k}.pass`) : f.found ? t(`${k}.issueDeclare`) : t(`${k}.issue`);
    case "robotsFile":
      return !f.found ? t(`${k}.missing`) : ok ? t(`${k}.pass`) : t(`${k}.issue`, { lines: join(f.typos) });
    default:
      return t(ok ? `${k}.pass` : `${k}.issue`);
  }
}

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28 shrink-0 self-center" role="img" aria-label={`${label}: ${score}/100`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF2F7" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-syne text-3xl font-extrabold text-[#0D1B2A]" data-testid="agent-score">{score}</span>
        <span className="font-dm text-[10px] text-[#7A8FA6]">/100</span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, tip, value, bad, testid }: { icon: typeof Bot; label: string; tip: string; value: string; bad: boolean; testid: string }) {
  return (
    <div className={`rounded-xl border p-4 ${bad ? "border-[#F5C2C2] bg-[#FFF6F6]" : "border-[#CDEBDC] bg-[#F3FBF7]"}`} data-testid={testid}>
      <p className="flex items-center gap-2 font-dm text-xs font-semibold text-[#3A4A5C]">
        <Icon size={15} aria-hidden /> {label}
      </p>
      <p className={`mt-1 font-syne text-2xl font-extrabold ${bad ? "text-[#C62828]" : "text-[#1E9E6A]"}`}>{value}</p>
      <p className="mt-1 font-dm text-xs leading-relaxed text-[#7A8FA6]">{tip}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#F4F7FB] px-2.5 py-1">{children}</span>;
}

function Notice({ tone, children }: { tone: "ok" | "info" | "error"; children: React.ReactNode }) {
  const cls = tone === "ok" ? "border-[#CDEBDC] bg-[#F3FBF7] text-[#14603F]" : tone === "error" ? "border-red-200 bg-red-50 text-[#7A2020]" : "border-[#D2DCE8] bg-white text-[#1B3A6B]";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 font-dm text-sm ${cls}`}>
      {children}
    </p>
  );
}
