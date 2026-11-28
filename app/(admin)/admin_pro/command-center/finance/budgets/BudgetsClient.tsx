"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Notice, useToast } from "@/components/admin/ui";
import type { BudgetLine } from "@/lib/admin/command-center/finance";
import { fmtUsd, monthLabel, parseAmount } from "@/lib/admin/command-center/money";
import { api, errMsg } from "../../_components/api";
import { inputCls } from "../../_components/fields";
import { FinanceShell } from "../_components/FinanceShell";

export default function BudgetsClient({
  month,
  lines,
  history,
  dayOfMonth,
  daysInMonth,
}: {
  month: string;
  lines: BudgetLine[];
  history: Array<{ month: string; byCat: Record<string, number> }>;
  dayOfMonth: number;
  daysInMonth: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(lines.map((l) => [l.category, l.budget ? String(l.budget / 100) : ""])));
  const [busy, setBusy] = useState(false);
  const alerts = lines.filter((l) => l.level === "warn" || l.level === "over");
  const dirty = lines.some((l) => (parseAmount(values[l.category] || "0") ?? 0) !== l.budget);
  const elapsed = dayOfMonth / daysInMonth;

  const save = async () => {
    const budgets = [];
    for (const l of lines) {
      const c = values[l.category]?.trim() ? parseAmount(values[l.category]) : 0;
      if (c === null || c < 0) return toast.error(`${l.label}: enter an amount`);
      if (c !== l.budget) budgets.push({ category: l.category, monthlyUsdCents: c });
    }
    setBusy(true);
    try {
      await api("/api/admin/finance/budgets", { method: "PUT", body: { budgets } });
      toast.success("Budgets saved");
      router.refresh();
    } catch (e) {
      toast.error("Could not save", errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FinanceShell
      title="Budgets"
      subtitle={`Monthly limits per category. You are alerted in the admin at 80% and 100%. ${monthLabel(month)}: day ${dayOfMonth} of ${daysInMonth}.`}
      actions={
        <Button variant="primary" size="sm" loading={busy} disabled={!dirty} onClick={() => void save()}>
          Save budgets
        </Button>
      }
    >
      {alerts.length ? (
        <div className="mb-4 space-y-2">
          {alerts.map((a) => (
            <Notice key={a.category} tone={a.level === "over" ? "danger" : "warn"} title={a.level === "over" ? `${a.label} is over budget` : `${a.label} has used ${Math.floor(a.pct!)}%`}>
              {fmtUsd(a.spent)} of {fmtUsd(a.budget)} with {daysInMonth - dayOfMonth} days left this month.
            </Notice>
          ))}
        </div>
      ) : null}
      <Card padded={false}>
        <ul className="divide-y divide-[var(--a-border)]">
          {lines.map((l) => {
            const pct = l.pct ?? 0;
            return (
              <li key={l.category} className="grid grid-cols-1 items-center gap-3 px-5 py-4 md:grid-cols-[180px_160px_minmax(0,1fr)_200px]" data-budget={l.category}>
                <div className="flex items-center gap-2">
                  <span className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{l.label}</span>
                  {l.level === "over" ? <Badge tone="danger">Over</Badge> : l.level === "warn" ? <Badge tone="warn">80%+</Badge> : null}
                </div>
                <label className="flex items-center gap-1.5">
                  <span className="font-dm text-[13px] text-[var(--a-ink-3)]">$</span>
                  <input
                    inputMode="decimal"
                    value={values[l.category] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [l.category]: e.target.value }))}
                    placeholder="No budget"
                    aria-label={`${l.label} monthly budget in USD`}
                    className={cn(inputCls, "tabular-nums")}
                  />
                </label>
                <div>
                  <div className="relative h-2.5 rounded-full bg-[var(--a-surface-2)]">
                    <div
                      className={cn("h-full rounded-full", l.level === "over" ? "bg-[var(--a-danger)]" : l.level === "warn" ? "bg-[var(--a-warn)]" : "bg-[var(--a-success)]")}
                      style={{ width: l.budget ? `${Math.min(100, pct)}%` : "0%" }}
                    />
                    {l.budget ? <span className="absolute -top-1 h-[18px] w-0.5 bg-[var(--a-ink-3)]" style={{ left: `${elapsed * 100}%` }} title="Today" /> : null}
                  </div>
                  <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">
                    {fmtUsd(l.spent)} spent{l.budget ? ` · ${Math.round(pct)}% used, ${Math.round(elapsed * 100)}% of the month gone` : ""}
                  </p>
                </div>
                <div className="flex gap-3 font-dm text-[12px] tabular-nums text-[var(--a-ink-3)] md:justify-end">
                  {history.slice(0, -1).map((h) => (
                    <span key={h.month}>
                      {monthLabel(h.month, true)} <b className="text-[var(--a-ink-2)]">{fmtUsd(h.byCat[l.category] ?? 0, { compact: true })}</b>
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="mt-3 flex items-center gap-1.5 font-dm text-[12px] text-[var(--a-ink-3)]">
        <PiggyBank size={13} aria-hidden /> Spending includes recurring charges and the automatic AI and Stripe estimates for the month.
      </p>
    </FinanceShell>
  );
}
