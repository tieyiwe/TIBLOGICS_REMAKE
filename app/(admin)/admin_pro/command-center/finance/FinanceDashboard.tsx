"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Plus, Repeat, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Card, Notice, Segmented, StatCard } from "@/components/admin/ui";
import { categoryLabel, sourceLabel } from "@/lib/admin/command-center/constants";
import { fmtDay, relativeDay } from "@/lib/admin/command-center/dates";
import { addMonthKey, delta, fmtMoney, fmtUsd, monthLabel } from "@/lib/admin/command-center/money";
import { FinanceShell } from "./_components/FinanceShell";

type Dashboard = Awaited<ReturnType<typeof import("@/lib/admin/command-center/finance").getDashboard>>;

const INCOME = "#2251A3";
const EXPENSE = "#F47C20";
const NET = "#0D1B2A";

export default function FinanceDashboard({ data, currentMonth }: { data: Dashboard; currentMonth: string }) {
  const router = useRouter();
  const [chartView, setChartView] = useState<"chart" | "table">("chart");
  const { cur, prev, series, mrr, budgets, upcoming, overdue, outstanding, topProjects, settings } = data;
  const margin = cur.income ? (cur.net / cur.income) * 100 : null;
  const prevMargin = prev?.income ? (prev.net / prev.income) * 100 : null;
  const alerts = budgets.filter((b) => b.level === "warn" || b.level === "over");
  const go = (m: string) => router.push(`/admin_pro/command-center/finance${m === currentMonth ? "" : `?m=${m}`}`);
  const sources = Object.entries(cur.incomeBySource).sort((a, b) => b[1] - a[1]);
  const cats = Object.entries(cur.expensesByCategory).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sources.map((s) => s[1]));
  const maxCat = Math.max(1, ...cats.map((c) => c[1]), ...budgets.map((b) => b.budget));
  const chart = series.map((s) => ({ m: monthLabel(s.month, true), Income: s.income / 100, Expenses: s.expenses / 100, Net: s.net / 100 }));

  return (
    <FinanceShell
      title="Finance"
      subtitle="Income, expenses and profit across the platform and client work. Amounts in USD."
      actions={
        <>
          <Button size="sm" icon={Plus} href="/admin_pro/command-center/finance/income?new=1">
            Income
          </Button>
          <Button size="sm" icon={Plus} href="/admin_pro/command-center/finance/expenses?new=1">
            Expense
          </Button>
          <Button size="sm" variant="ghost" icon={Download} href="/admin_pro/command-center/finance/reports">
            Export
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" icon={ChevronLeft} aria-label="Previous month" onClick={() => go(addMonthKey(data.month, -1))} />
        <h2 className="min-w-[150px] text-center font-syne text-[18px] font-bold text-[var(--a-ink)]" aria-live="polite">
          {monthLabel(data.month)}
        </h2>
        <Button size="sm" variant="ghost" icon={ChevronRight} aria-label="Next month" disabled={data.month >= currentMonth} onClick={() => go(addMonthKey(data.month, 1))} />
        {data.month !== currentMonth ? (
          <Button size="sm" onClick={() => go(currentMonth)}>
            This month
          </Button>
        ) : (
          <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Month to date, compared with {monthLabel(prev.month)}</span>
        )}
      </div>

      {alerts.length || overdue.length ? (
        <div className="mb-4 space-y-2">
          {alerts.map((b) => (
            <Notice key={b.category} tone={b.level === "over" ? "danger" : "warn"} title={b.level === "over" ? `${b.label} is over budget` : `${b.label} is at ${Math.floor(b.pct!)}% of budget`} action={<Button size="sm" href="/admin_pro/command-center/finance/budgets">Budgets</Button>}>
              {fmtUsd(b.spent)} of {fmtUsd(b.budget)} this month.
            </Notice>
          ))}
          {overdue.length ? (
            <Notice tone="danger" title={`${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}`} action={<Button size="sm" href="/admin_pro/command-center/finance/income?status=overdue">Review</Button>}>
              {fmtUsd(overdue.reduce((n, o) => n + o.amountUsdCents, 0))} past due. Oldest: {overdue[0].client}, {overdue[0].daysOverdue} days.
            </Notice>
          ) : null}
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Income" value={fmtUsd(cur.income, { compact: true })} delta={delta(cur.income, prev.income)} deltaLabel={`vs ${monthLabel(prev.month, true)}`} tone="navy" spark={series.map((s) => s.income)} />
        <StatCard label="Expenses" value={fmtUsd(cur.expenses, { compact: true })} delta={delta(cur.expenses, prev.expenses)} deltaLabel={`vs ${monthLabel(prev.month, true)}`} invertDelta tone="orange" spark={series.map((s) => s.expenses)} />
        <StatCard label="Net profit" value={fmtUsd(cur.net, { compact: true })} delta={delta(cur.net, prev.net)} tone={cur.net >= 0 ? "success" : "danger"} hint={`Last month ${fmtUsd(prev.net, { compact: true })}`} />
        <StatCard label="Margin" value={margin === null ? "None" : `${margin.toFixed(1)}%`} delta={margin !== null && prevMargin !== null ? `${margin - prevMargin >= 0 ? "+" : ""}${(margin - prevMargin).toFixed(1)} pts` : null} hint={margin === null ? "No income yet this month" : undefined} />
        <StatCard label="MRR" value={fmtUsd(mrr.total, { compact: true })} hint="Subscriptions + retainers (estimate)" />
      </div>

      <Card
        title="Cash flow, last 12 months"
        subtitle="Income and expenses per month; the line is net profit."
        className="mb-5"
        action={
          <Segmented
            size="sm"
            ariaLabel="Chart or table"
            value={chartView}
            onChange={(v) => setChartView(v as "chart" | "table")}
            options={[
              { value: "chart", label: "Chart" },
              { value: "table", label: "Table" },
            ]}
          />
        }
      >
        {chartView === "chart" ? (
          <div className="h-[280px] w-full" role="img" aria-label={`Cash flow chart. ${series.map((s) => `${monthLabel(s.month)}: income ${fmtUsd(s.income)}, expenses ${fmtUsd(s.expenses)}`).join("; ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="#E3E9F1" />
                <XAxis dataKey="m" tickLine={false} axisLine={{ stroke: "#CBD5E3" }} tick={{ fill: "#5A6E84", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: "#5A6E84", fontSize: 11 }} tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)} />
                <Tooltip
                  cursor={{ fill: "rgba(34,81,163,.06)" }}
                  formatter={(v: number, name: string) => [fmtUsd(Math.round(v * 100)), name]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E3E9F1", boxShadow: "0 12px 32px rgba(13,27,42,.14)", fontSize: 12.5 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12.5, color: "#3A4A5C" }} />
                <Bar dataKey="Income" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Expenses" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Line dataKey="Net" stroke={NET} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, stroke: "#fff", fill: NET }} type="linear" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] font-dm text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 pr-3 text-right">Income</th>
                  <th className="py-2 pr-3 text-right">Expenses</th>
                  <th className="py-2 pr-3 text-right">Net</th>
                  <th className="py-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {[...series].reverse().map((s) => (
                  <tr key={s.month} className="border-t border-[var(--a-border)]">
                    <td className="py-2 pr-3 text-[var(--a-ink)]">{monthLabel(s.month)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{fmtUsd(s.income)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{fmtUsd(s.expenses)}</td>
                    <td className={cn("py-2 pr-3 text-right font-semibold tabular-nums", s.net < 0 ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]")}>{fmtUsd(s.net)}</td>
                    <td className="py-2 text-right tabular-nums text-[var(--a-ink-3)]">{s.income ? `${((s.net / s.income) * 100).toFixed(1)}%` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Income by source" subtitle={monthLabel(data.month)} action={<Button size="sm" variant="ghost" href="/admin_pro/command-center/finance/income">All income</Button>}>
          {sources.length ? (
            <ul className="space-y-3">
              {sources.map(([k, v]) => (
                <BarRow key={k} label={sourceLabel(k)} value={v} max={maxSource} color={INCOME} hint={cur.platformCounts[k] ? `${cur.platformCounts[k]} ${["learn_subs", "team_seats", "toolkit"].includes(k) ? "active (estimate)" : "payments"}` : undefined} />
              ))}
            </ul>
          ) : (
            <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">No income recorded this month.</p>
          )}
        </Card>
        <Card title="Expenses by category" subtitle={`${monthLabel(data.month)} · bar ticks mark the budget`} action={<Button size="sm" variant="ghost" href="/admin_pro/command-center/finance/expenses">All expenses</Button>}>
          {cats.length ? (
            <ul className="space-y-3">
              {cats.map(([k, v]) => {
                const b = budgets.find((x) => x.category === k);
                return <BarRow key={k} label={categoryLabel(k)} value={v} max={maxCat} color={EXPENSE} budget={b?.budget || undefined} hint={k === "ai_apis" && settings.autoAiCosts ? "includes AI usage" : k === "fees" && settings.autoStripeFees ? "includes Stripe estimate" : undefined} />;
              })}
            </ul>
          ) : (
            <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">No expenses recorded this month.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card title="Top projects by profit" padded={false}>
          {topProjects.length ? (
            <ul className="divide-y divide-[var(--a-border)]">
              {topProjects.map((p) => (
                <li key={p.id} className="flex items-center gap-2 px-5 py-2.5 font-dm text-[13.5px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                  <Link href={`/admin_pro/command-center/projects/${p.id}?tab=finance`} className="min-w-0 flex-1 truncate font-semibold text-[var(--a-ink)] hover:underline">
                    {p.name}
                  </Link>
                  <span className={cn("font-semibold tabular-nums", p.profit < 0 ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]")}>{fmtUsd(p.profit, { compact: true })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 font-dm text-[13px] text-[var(--a-ink-3)]">Link income and expenses to projects to see their profit here.</p>
          )}
        </Card>
        <Card title="Upcoming charges" subtitle="Recurring, next 30 days" icon={Repeat} padded={false}>
          {upcoming.length ? (
            <ul className="divide-y divide-[var(--a-border)]">
              {upcoming.map((u) => (
                <li key={u.id} className="flex items-center gap-2 px-5 py-2.5 font-dm text-[13.5px]">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{u.vendor}</span>
                    <span className="block text-[12px] text-[var(--a-ink-3)]">
                      {categoryLabel(u.category)} · {u.interval === "annual" ? "yearly" : "monthly"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums text-[var(--a-ink)]">{u.currency === "USD" ? fmtUsd(u.amountUsdCents) : fmtMoney(u.amountCents, u.currency)}</span>
                    <span className="block text-[12px] text-[var(--a-ink-3)]">{fmtDay(u.nextKey)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 font-dm text-[13px] text-[var(--a-ink-3)]">No recurring charges due. Add subscriptions under Expenses.</p>
          )}
        </Card>
        <Card title="Receivables" icon={TriangleAlert} padded={false} subtitle={`${outstanding.count} open invoice${outstanding.count === 1 ? "" : "s"}, ${fmtUsd(outstanding.cents)}`}>
          {overdue.length ? (
            <ul className="divide-y divide-[var(--a-border)]">
              {overdue.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-2 px-5 py-2.5 font-dm text-[13.5px]">
                  <AlertTriangle size={14} className="shrink-0 text-[var(--a-danger)]" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{o.client}</span>
                    <span className="block text-[12px] text-[var(--a-danger)]">
                      {o.invoiceNumber ? `#${o.invoiceNumber} · ` : ""}due {o.dueKey ? relativeDay(o.dueKey, new Date().toISOString().slice(0, 10)) : "unknown"} · {o.daysOverdue} days late
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-[var(--a-ink)]">{fmtUsd(o.amountUsdCents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 font-dm text-[13px] text-[var(--a-ink-3)]">No overdue invoices.</p>
          )}
          <div className="border-t border-[var(--a-border)] px-5 py-3 font-dm text-[12px] text-[var(--a-ink-3)]">
            MRR: ARFA {fmtUsd(mrr.learn, { compact: true })} · Teams {fmtUsd(mrr.team, { compact: true })} · Toolkit {fmtUsd(mrr.toolkit, { compact: true })} · Retainers {fmtUsd(mrr.retainers, { compact: true })}
          </div>
        </Card>
      </div>
      <p className="mt-4 font-dm text-[12px] text-[var(--a-ink-3)]">
        Platform income comes from Stripe-backed records (store, events, bookings, blueprints, track purchases). Subscriptions, AI API costs{settings.autoStripeFees ? ` and Stripe fees (${settings.stripePercent}% + ${settings.stripeFixedCents}c)` : ""} are estimates. Months are calendar months in UTC.
      </p>
    </FinanceShell>
  );
}

function BarRow({ label, value, max, color, budget, hint }: { label: string; value: number; max: number; color: string; budget?: number; hint?: string }) {
  const over = budget ? value > budget : false;
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-2 font-dm text-[13px]">
        <span className="min-w-0 truncate text-[var(--a-ink-2)]">
          {label}
          {hint ? <span className="ml-1.5 text-[11.5px] text-[var(--a-ink-3)]">{hint}</span> : null}
        </span>
        <span className="shrink-0 font-semibold tabular-nums text-[var(--a-ink)]">
          {fmtUsd(value)}
          {budget ? <span className={cn("ml-1 font-normal", over ? "text-[var(--a-danger)]" : "text-[var(--a-ink-3)]")}>/ {fmtUsd(budget, { compact: true })}</span> : null}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-[var(--a-surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: over ? "var(--a-danger)" : color }} />
        {budget ? <span className="absolute -top-0.5 h-3 w-0.5 rounded bg-[var(--a-ink)]" style={{ left: `${Math.min(100, (budget / max) * 100)}%` }} title={`Budget ${fmtUsd(budget)}`} /> : null}
      </div>
    </li>
  );
}
