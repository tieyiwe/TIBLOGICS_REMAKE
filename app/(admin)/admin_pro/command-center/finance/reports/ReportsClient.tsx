"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, FileSpreadsheet, Landmark, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonClasses, Card, Select, useToast } from "@/components/admin/ui";
import type { FinanceSettings, MonthTotals } from "@/lib/admin/command-center/finance";
import { categoryLabel, sourceLabel } from "@/lib/admin/command-center/constants";
import { fmtUsd, monthLabel } from "@/lib/admin/command-center/money";
import { api, errMsg } from "../../_components/api";
import { Field, TextInput } from "../../_components/fields";
import { FinanceShell } from "../_components/FinanceShell";

type Pnl = { year: number; months: MonthTotals[]; sources: string[]; categories: string[] };
type Taxes = { year: number; quarters: Array<{ quarter: number; collected: Array<{ label: string; tax: number; base: number }>; paid: Array<{ label: string; tax: number; base: number }>; collectedCents: number; paidCents: number; netCents: number }> };

export default function ReportsClient({ year, thisYear, pnl, taxes, settings }: { year: number; thisYear: number; pnl: Pnl; taxes: Taxes; settings: FinanceSettings }) {
  const router = useRouter();
  const years = Array.from({ length: 6 }, (_, i) => thisYear - i);
  const sum = (f: (m: MonthTotals) => number) => pnl.months.reduce((n, m) => n + f(m), 0);
  const row = (label: string, f: (m: MonthTotals) => number, opts: { bold?: boolean; indent?: boolean; tone?: "net" } = {}) => {
    const total = sum(f);
    return (
      <tr className={cn("border-t border-[var(--a-border)]", opts.bold && "bg-[var(--a-surface-2)]/60")}>
        <th scope="row" className={cn("sticky left-0 z-[1] whitespace-nowrap bg-inherit px-4 py-2 text-left font-dm text-[13px]", opts.bold ? "font-semibold text-[var(--a-ink)]" : "font-normal text-[var(--a-ink-2)]", opts.indent && "pl-8")} style={{ background: "inherit" }}>
          {label}
        </th>
        {pnl.months.map((m) => {
          const v = f(m);
          return (
            <td key={m.month} className={cn("whitespace-nowrap px-3 py-2 text-right tabular-nums", opts.bold ? "font-semibold" : "", opts.tone === "net" && v < 0 ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]")}>
              {v ? fmtUsd(v, { compact: true }) : <span className="text-[var(--a-ink-3)]">0</span>}
            </td>
          );
        })}
        <td className={cn("whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums", opts.tone === "net" && total < 0 ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]")}>{fmtUsd(total)}</td>
      </tr>
    );
  };
  return (
    <FinanceShell
      title="Reports & taxes"
      subtitle="Monthly profit and loss, quarterly tax summary and CSV exports for your accountant."
      actions={
        <Select label="Year" value={String(year)} onChange={(e) => router.push(`/admin_pro/command-center/finance/reports?year=${e.target.value}`)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      }
    >
      <Card
        title={`Profit and loss, ${year}`}
        subtitle="Cash basis, USD. Subscription income and automatic expenses are estimates."
        padded={false}
        className="mb-5"
        action={
          <a href={`/api/admin/finance/export?kind=pnl&year=${year}`} download className={buttonClasses("secondary", "sm")}>
          <Download size={14} aria-hidden /> P&L CSV
        </a>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse font-dm text-[13px]">
            <thead className="bg-[var(--a-surface-2)]">
              <tr>
                <th className="sticky left-0 bg-[var(--a-surface-2)] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Line</th>
                {pnl.months.map((m) => (
                  <th key={m.month} className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                    {monthLabel(m.month, true)}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Total</th>
              </tr>
            </thead>
            <tbody>
              {pnl.sources.map((s) => (
                <Frag key={`s-${s}`}>{row(sourceLabel(s), (m) => m.incomeBySource[s] ?? 0, { indent: true })}</Frag>
              ))}
              {row("Total income", (m) => m.income, { bold: true })}
              {pnl.categories.map((c) => (
                <Frag key={`c-${c}`}>{row(categoryLabel(c), (m) => m.expensesByCategory[c] ?? 0, { indent: true })}</Frag>
              ))}
              {row("Total expenses", (m) => m.expenses, { bold: true })}
              {row("Net profit", (m) => m.net, { bold: true, tone: "net" })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title={`Tax summary, ${year}`} subtitle="Tax on paid income (collected) and on expenses (paid), by quarter." icon={Landmark} padded={false}>
          <table className="w-full font-dm text-[13px]">
            <thead className="bg-[var(--a-surface-2)]">
              <tr className="text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                <th className="px-4 py-2 text-left">Quarter</th>
                <th className="px-4 py-2 text-right">Collected</th>
                <th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2 text-right">Net owed</th>
              </tr>
            </thead>
            <tbody>
              {taxes.quarters.map((q) => (
                <tr key={q.quarter} className="border-t border-[var(--a-border)] align-top">
                  <th scope="row" className="px-4 py-2.5 text-left font-semibold text-[var(--a-ink)]">
                    Q{q.quarter}
                    {[...q.collected, ...q.paid].length ? (
                      <span className="mt-0.5 block text-[11.5px] font-normal text-[var(--a-ink-3)]">{[...new Set([...q.collected, ...q.paid].map((x) => x.label))].join(", ")}</span>
                    ) : null}
                  </th>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(q.collectedCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtUsd(q.paidCents)}</td>
                  <td className={cn("px-4 py-2.5 text-right font-semibold tabular-nums", q.netCents < 0 ? "text-[var(--a-success)]" : "text-[var(--a-ink)]")}>{fmtUsd(q.netCents)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--a-border-strong)]">
                <th scope="row" className="px-4 py-2.5 text-left font-semibold">Year</th>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmtUsd(taxes.quarters.reduce((n, q) => n + q.collectedCents, 0))}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmtUsd(taxes.quarters.reduce((n, q) => n + q.paidCents, 0))}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmtUsd(taxes.quarters.reduce((n, q) => n + q.netCents, 0))}</td>
              </tr>
            </tbody>
          </table>
          <p className="border-t border-[var(--a-border)] px-4 py-2.5 font-dm text-[12px] text-[var(--a-ink-3)]">A negative net means more tax paid than collected (a possible refund or input credit). Confirm with your accountant.</p>
        </Card>

        <div className="space-y-5">
          <Card title="Exports" icon={FileSpreadsheet}>
            <ExportRow year={year} />
          </Card>
          <SettingsCard initial={settings} />
        </div>
      </div>
    </FinanceShell>
  );
}

function Frag({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function ExportRow({ year }: { year: number }) {
  const quarters = [1, 2, 3, 4].map((q) => ({ q, from: `${year}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`, to: new Date(Date.UTC(year, q * 3, 0)).toISOString().slice(0, 10) }));
  return (
    <div className="space-y-3 font-dm text-[13px]">
      <div className="flex flex-wrap gap-2">
        <a href={`/api/admin/finance/export?kind=income&from=${year}-01-01&to=${year}-12-31`} download className={buttonClasses("secondary", "sm")}>
          <Download size={14} aria-hidden /> Income {year}
        </a>
        <a href={`/api/admin/finance/export?kind=expenses&from=${year}-01-01&to=${year}-12-31`} download className={buttonClasses("secondary", "sm")}>
          <Download size={14} aria-hidden /> Expenses {year}
        </a>
        <a href={`/api/admin/finance/export?kind=pnl&year=${year}`} download className={buttonClasses("secondary", "sm")}>
          <Download size={14} aria-hidden /> P&L {year}
        </a>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--a-ink-3)]">
        By quarter:
        {quarters.map((x) => (
          <span key={x.q} className="inline-flex gap-1.5">
            Q{x.q}
            <a className="font-semibold text-[var(--a-blue)] hover:underline" href={`/api/admin/finance/export?kind=income&from=${x.from}&to=${x.to}`}>
              income
            </a>
            <a className="font-semibold text-[var(--a-blue)] hover:underline" href={`/api/admin/finance/export?kind=expenses&from=${x.from}&to=${x.to}`}>
              expenses
            </a>
          </span>
        ))}
      </div>
      <p className="text-[12px] text-[var(--a-ink-3)]">CSV files open in Excel, Numbers and Google Sheets. Each row keeps the original currency, the rate and the USD amount.</p>
    </div>
  );
}

function SettingsCard({ initial }: { initial: FinanceSettings }) {
  const toast = useToast();
  const router = useRouter();
  const [s, setS] = useState({ pct: String(initial.stripePercent), fixed: String(initial.stripeFixedCents), ai: initial.autoAiCosts, stripe: initial.autoStripeFees, CAD: String(initial.fx.CAD), EUR: String(initial.fx.EUR), XOF: String(initial.fx.XOF) });
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Settings" icon={Settings2}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/admin/finance/settings", {
              method: "PATCH",
              body: { stripePercent: Number(s.pct), stripeFixedCents: Math.round(Number(s.fixed)), autoAiCosts: s.ai, autoStripeFees: s.stripe, fx: { CAD: Number(s.CAD), EUR: Number(s.EUR), XOF: Number(s.XOF) } },
            });
            toast.success("Finance settings saved");
            router.refresh();
          } catch (err) {
            toast.error("Could not save", errMsg(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="flex items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
          <input type="checkbox" checked={s.ai} onChange={(e) => setS({ ...s, ai: e.target.checked })} className="h-4 w-4 accent-[var(--a-blue)]" />
          Count AI API usage (from AiUsage) as an expense each month
        </label>
        <label className="flex items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
          <input type="checkbox" checked={s.stripe} onChange={(e) => setS({ ...s, stripe: e.target.checked })} className="h-4 w-4 accent-[var(--a-blue)]" />
          Estimate Stripe fees on platform income
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stripe fee (%)" htmlFor="st-pct">
            <TextInput id="st-pct" inputMode="decimal" value={s.pct} onChange={(e) => setS({ ...s, pct: e.target.value })} />
          </Field>
          <Field label="Plus per payment (cents)" htmlFor="st-fixed">
            <TextInput id="st-fixed" inputMode="numeric" value={s.fixed} onChange={(e) => setS({ ...s, fixed: e.target.value })} />
          </Field>
        </div>
        <p className="font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Default exchange rates (USD per 1 unit)</p>
        <div className="grid grid-cols-3 gap-3">
          {(["CAD", "EUR", "XOF"] as const).map((c) => (
            <Field key={c} label={c} htmlFor={`fx-${c}`}>
              <TextInput id={`fx-${c}`} inputMode="decimal" value={s[c]} onChange={(e) => setS({ ...s, [c]: e.target.value })} />
            </Field>
          ))}
        </div>
        <p className="font-dm text-[12px] text-[var(--a-ink-3)]">New entries start with these rates; each entry keeps its own rate.</p>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={busy}>
            Save settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
