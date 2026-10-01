"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";
import type { TeamReport } from "@/lib/learn/team/report";
import { call, cls, type DashCtx, type LinkView, type PriceInfo, type TabId, type TeamInfo } from "./manager/ui";
import OverviewTab from "./manager/OverviewTab";
import PeopleTab from "./manager/PeopleTab";
import InviteTab from "./manager/InviteTab";
import AssignmentsTab from "./manager/AssignmentsTab";
import ReportsTab from "./manager/ReportsTab";
import BillingTab from "./manager/BillingTab";
import MemberDrawer from "./manager/MemberDrawer";

export interface TeamDashboardProps {
  team: TeamInfo;
  role: string;
  used: number;
  seatPriceCents: number;
  pricing: PriceInfo;
  aiPool: { used: number; limit: number };
  report: TeamReport;
  titles: Record<string, string>;
  link: LinkView | null;
  digestOn: boolean;
  tab?: string;
  welcome?: boolean;
}

const TABS: TabId[] = ["overview", "people", "invite", "assignments", "reports", "billing"];

/**
 * The manager's team dashboard: Overview, People, Invite, Assignments,
 * Reports and (owner only) Billing. All data is the viewer's own team,
 * loaded on the server; actions go through /api/learn/team/*, which check
 * the role again.
 */
export default function TeamDashboard(p: TeamDashboardProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const isOwner = p.role === "owner";
  const tabs = useMemo(() => TABS.filter((x) => x !== "billing" || isOwner), [isOwner]);
  const initial = tabs.includes(p.tab as TabId) ? (p.tab as TabId) : "overview";
  const [tab, setTab] = useState<TabId>(initial);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const goTab = useCallback((next: TabId) => {
    setTab(next);
    setMsg(null);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("tab", next);
      u.searchParams.delete("welcome");
      window.history.replaceState(null, "", u.toString());
    } catch {}
  }, []);

  useEffect(() => {
    tabRefs.current[tab]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);

  const run = useCallback<DashCtx["run"]>(
    async (key, fn, opts) => {
      setBusy(key);
      setMsg(null);
      try {
        const ok = await fn();
        if (ok) setMsg({ kind: "ok", text: ok });
        if (opts?.refresh !== false) router.refresh();
      } catch (err) {
        setMsg({ kind: "err", text: err instanceof Error ? err.message : t("team.error.generic") });
      } finally {
        setBusy(null);
      }
    },
    [router, t],
  );

  const free = Math.max(0, p.team.seats - p.used);
  const ctx: DashCtx = {
    team: p.team,
    role: p.role,
    isOwner,
    used: p.used,
    free,
    report: p.report,
    titles: p.titles,
    locale,
    busy,
    run,
    goTab,
    openMember: setDrawer,
  };

  const counts: Partial<Record<TabId, number>> = {
    people: p.report.members.length,
    assignments: p.report.assignments.filter((a) => a.overdue).length || undefined,
  };

  const portal = () =>
    run("portal", async () => {
      const d = await call<{ url: string }>("/api/learn/team/billing-portal", "POST");
      window.location.href = d.url;
    }, { refresh: false });

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    goTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={cls.kicker}>{t("team.dash.kicker")}</p>
          <h1 className="break-words text-2xl font-black text-[var(--ink)]">{p.team.name}</h1>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {t(`team.role.${p.role}`)} · {t(`team.teamStatus.${p.team.comped ? "comped" : p.team.status}`)} ·{" "}
            {t("team.dash.seatsLine", { used: p.used, seats: p.team.seats })}
          </p>
        </div>
        <button type="button" onClick={() => goTab("invite")} className={`${cls.accent} self-start sm:self-auto`} disabled={!p.team.entitled}>
          {t("team.dash.inviteCta")}
        </button>
      </header>

      {p.welcome && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">{t("team.dash.welcome")}</p>}
      {p.team.inGrace && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("team.dash.grace", { date: p.team.graceUntil ? fmtDate(p.team.graceUntil, locale) : "" })}</span>
          {isOwner && p.team.hasBilling && (
            <button type="button" onClick={portal} disabled={busy !== null} className={cls.btn}>{t("team.billing.portal")}</button>
          )}
        </div>
      )}
      {!p.team.entitled && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("team.dash.inactive")}</p>}
      {p.team.cancelAtPeriodEnd && p.team.currentPeriodEnd && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("team.dash.cancelling", { date: fmtDate(p.team.currentPeriodEnd, locale) })}</p>
      )}

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label={t("team.tabs.label")} className="flex min-w-max gap-1 border-b border-[var(--border)]">
          {tabs.map((id, i) => (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              id={`tab-${id}`}
              role="tab"
              type="button"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => goTab(id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold ${
                tab === id ? "border-[var(--orange)] text-[var(--ink)]" : "border-transparent text-[var(--ink3)] hover:text-[var(--ink)]"
              }`}
            >
              {t(`team.tabs.${id}`)}
              {counts[id] != null && (
                <span className={`rounded-full px-1.5 text-[11px] font-bold ${id === "assignments" ? "bg-red-50 text-red-800" : "bg-[var(--s3)] text-[var(--ink2)]"}`}>{counts[id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <p role={msg.kind === "err" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${msg.kind === "err" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-900"}`}>
          {msg.text}
        </p>
      )}

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={-1} className="focus:outline-none">
        {tab === "overview" && <OverviewTab ctx={ctx} aiPool={p.aiPool} />}
        {tab === "people" && <PeopleTab ctx={ctx} />}
        {tab === "invite" && <InviteTab ctx={ctx} link={p.link} />}
        {tab === "assignments" && <AssignmentsTab ctx={ctx} />}
        {tab === "reports" && <ReportsTab ctx={ctx} digestOn={p.digestOn} />}
        {tab === "billing" && isOwner && <BillingTab ctx={ctx} seatPriceCents={p.seatPriceCents} pricing={p.pricing} aiPool={p.aiPool} portal={portal} />}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink3)]">{t("team.privacy.managerNote")}</p>

      {drawer && <MemberDrawer ctx={ctx} memberId={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}
