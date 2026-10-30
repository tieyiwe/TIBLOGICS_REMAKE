"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Paperclip, Pencil, Plus, Receipt, Repeat, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Menu, SearchInput, Select, StatCard, Toolbar, useConfirm, useToast } from "@/components/admin/ui";
import type { ExpenseRow } from "@/lib/admin/command-center/finance";
import { EXPENSE_CATEGORIES, categoryLabel } from "@/lib/admin/command-center/constants";
import { fmtDay, localTodayKey } from "@/lib/admin/command-center/dates";
import { fmtMoney, fmtUsd } from "@/lib/admin/command-center/money";
import { api, errMsg } from "../../_components/api";
import { FinanceShell } from "../_components/FinanceShell";
import { ExpenseDrawer, RecurringDrawer, type Fx, type ProjectOpt, type RecurringRow } from "../_components/forms";
import { RangeBar } from "../_components/RangeBar";

export default function ExpensesClient({
  rows,
  range,
  projects,
  fx,
  recurring,
}: {
  rows: ExpenseRow[];
  range: { from: string; to: string; preset: string };
  projects: ProjectOpt[];
  fx: Fx;
  recurring: RecurringRow[];
}) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [kind, setKind] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; row: ExpenseRow | null }>({ open: false, row: null });
  const [rec, setRec] = useState<{ open: boolean; row: RecurringRow | null }>({ open: false, row: null });
  const today = localTodayKey();
  useEffect(() => {
    if (search?.get("new") === "1") setDrawer({ open: true, row: null });
    if (search?.get("new") === "recurring") setRec({ open: true, row: null });
  }, [search]);

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => (!cat || r.category === cat) && (!kind || r.kind === kind) && (!ql || `${r.vendor} ${r.description ?? ""}`.toLowerCase().includes(ql)));
  }, [rows, q, cat, kind]);
  const total = rows.reduce((n, r) => n + r.amountUsdCents, 0);
  const auto = rows.filter((r) => r.kind === "auto").reduce((n, r) => n + r.amountUsdCents, 0);
  const fromRecurring = rows.filter((r) => r.kind === "recurring").reduce((n, r) => n + r.amountUsdCents, 0);
  const monthlyRun = recurring.filter((r) => r.active).reduce((n, r) => n + (r.interval === "annual" ? Math.round(r.amountUsdCents / 12) : r.amountUsdCents), 0);
  const refresh = () => router.refresh();

  return (
    <FinanceShell
      title="Expenses"
      subtitle="What the business spends: entries you record, recurring subscriptions, and estimated AI and Stripe costs."
      actions={
        <>
          <Button size="sm" icon={Repeat} onClick={() => setRec({ open: true, row: null })}>
            Recurring charge
          </Button>
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setDrawer({ open: true, row: null })}>
            Add expense
          </Button>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={fmtUsd(total, { compact: true })} tone="orange" hint={`${rows.length} entries in this period`} />
        <StatCard label="From recurring" value={fmtUsd(fromRecurring, { compact: true })} hint="Generated each billing date" />
        <StatCard label="Automatic estimates" value={fmtUsd(auto, { compact: true })} hint="AI usage and Stripe fees" />
        <StatCard label="Subscriptions per month" value={fmtUsd(monthlyRun, { compact: true })} hint={`${recurring.filter((r) => r.active).length} active charges`} tone="navy" />
      </div>

      <Toolbar end={<RangeBar range={range} exportKind="expenses" />}>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Vendor, description" label="Filter expenses" />
        <Select label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All types</option>
          <option value="manual">Recorded</option>
          <option value="recurring">Recurring</option>
          <option value="auto">Automatic estimate</option>
        </Select>
      </Toolbar>

      {visible.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses in this view" body="Record an expense, or add your subscriptions as recurring charges so they record themselves." action={<Button variant="primary" icon={Plus} onClick={() => setDrawer({ open: true, row: null })}>Add expense</Button>} />
      ) : (
        <div className="mb-6 overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
          <ul className="divide-y divide-[var(--a-border)]">
            {visible.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3" data-expense={r.id}>
                <span className="hidden w-20 shrink-0 font-dm text-[13px] text-[var(--a-ink-2)] sm:block">{fmtDay(r.dateKey, { withYear: r.dateKey.slice(0, 4) !== today.slice(0, 4) })}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-dm text-[14px] font-semibold text-[var(--a-ink)]">
                    {r.vendor}
                    {r.receiptId || r.receiptUrl ? (
                      <a href={r.receiptId ? `/api/admin/finance/receipts/${r.receiptId}` : r.receiptUrl!} target="_blank" rel="noopener noreferrer" aria-label="Open receipt" className="text-[var(--a-ink-3)] hover:text-[var(--a-blue)]">
                        <Paperclip size={13} aria-hidden />
                      </a>
                    ) : null}
                  </p>
                  <p className="truncate font-dm text-[12px] text-[var(--a-ink-3)]">
                    <span className="sm:hidden">{fmtDay(r.dateKey)} · </span>
                    {[r.description, projects.find((p) => p.id === r.projectId)?.name, r.paymentMethod].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="hidden flex-wrap justify-end gap-1 md:flex">
                  <Badge tone="neutral">{categoryLabel(r.category)}</Badge>
                  {r.kind === "recurring" ? <Badge tone="info">Recurring</Badge> : r.kind === "auto" ? <Badge tone="warn">Estimate</Badge> : null}
                </div>
                <div className="w-28 text-right">
                  <p className="font-dm text-[14px] font-semibold tabular-nums text-[var(--a-ink)]">{fmtUsd(r.amountUsdCents)}</p>
                  {r.currency !== "USD" || r.taxCents ? (
                    <p className="font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">
                      {r.currency !== "USD" ? fmtMoney(r.amountCents, r.currency) : ""}
                      {r.taxCents ? ` +${r.taxLabel ?? "tax"}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="w-8">
                  {r.kind !== "auto" ? (
                    <Menu
                      label={`Actions for ${r.vendor}`}
                      items={[
                        { label: "Edit", icon: Pencil, onSelect: () => setDrawer({ open: true, row: r }) },
                        { separator: true },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onSelect: async () => {
                            if (!(await confirm({ title: `Delete the ${r.vendor} expense?`, body: `${fmtUsd(r.amountUsdCents)} on ${fmtDay(r.dateKey, { withYear: true })}.${r.recurringId ? " The recurring charge keeps going; this period will not be recorded again." : ""}`, danger: true, confirmLabel: "Delete" }))) return;
                            try {
                              await api(`/api/admin/finance/expenses/${r.id}`, { method: "DELETE" });
                              toast.success("Expense deleted");
                              refresh();
                            } catch (e) {
                              toast.error("Could not delete", errMsg(e));
                            }
                          },
                        },
                      ]}
                      trigger={(p) => (
                        <button {...p} aria-label={`Actions for ${r.vendor}`} className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]">
                          <span aria-hidden className="text-[18px] leading-none">⋯</span>
                        </button>
                      )}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card
        title="Recurring charges"
        subtitle="Subscriptions recorded automatically each billing date."
        icon={Repeat}
        padded={false}
        action={
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              onClick={async () => {
                try {
                  const r = await api<{ generated: number }>("/api/admin/finance/recurring/generate", { body: {} });
                  toast.success(r.generated ? `Recorded ${r.generated} due charge${r.generated === 1 ? "" : "s"}` : "Everything due is already recorded");
                  refresh();
                } catch (e) {
                  toast.error("Could not run", errMsg(e));
                }
              }}
            >
              Record due now
            </Button>
            <Button size="sm" icon={Plus} onClick={() => setRec({ open: true, row: null })}>
              Add
            </Button>
          </div>
        }
      >
        {recurring.length ? (
          <ul className="divide-y divide-[var(--a-border)]">
            {recurring.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3" data-recurring={r.id}>
                <div className="min-w-0 flex-1">
                  <p className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">
                    {r.vendor} {!r.active ? <Badge tone="neutral">Paused</Badge> : null}
                  </p>
                  <p className="font-dm text-[12px] text-[var(--a-ink-3)]">
                    {categoryLabel(r.category)} · {r.interval === "annual" ? "yearly" : "monthly"} since {fmtDay(r.startKey, { withYear: true })}
                    {r.active ? ` · next ${fmtDay(r.nextKey, { withYear: true })}` : ""}
                  </p>
                </div>
                <span className="font-dm text-[14px] font-semibold tabular-nums text-[var(--a-ink)]">{r.currency === "USD" ? fmtUsd(r.amountCents) : `${fmtMoney(r.amountCents, r.currency)} (${fmtUsd(r.amountUsdCents)})`}</span>
                <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Edit ${r.vendor}`} onClick={() => setRec({ open: true, row: r })} />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  aria-label={`Stop ${r.vendor}`}
                  onClick={async () => {
                    if (!(await confirm({ title: `Stop the ${r.vendor} charge?`, body: "Expenses it already recorded stay in the books.", danger: true, confirmLabel: "Stop and delete" }))) return;
                    try {
                      await api(`/api/admin/finance/recurring/${r.id}`, { method: "DELETE" });
                      toast.success("Recurring charge removed");
                      refresh();
                    } catch (e) {
                      toast.error("Could not remove", errMsg(e));
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-5 font-dm text-[13.5px] text-[var(--a-ink-3)]">Add Replit, Anthropic, Google Workspace, Titan email or your domain once, and each period records itself.</p>
        )}
      </Card>

      <ExpenseDrawer
        open={drawer.open}
        row={drawer.row}
        projects={projects}
        fx={fx}
        defaultProject={search?.get("project")}
        onClose={() => {
          setDrawer({ open: false, row: null });
          if (search?.get("new")) router.replace("/admin_pro/command-center/finance/expenses", { scroll: false });
        }}
        onSaved={refresh}
      />
      <RecurringDrawer open={rec.open} row={rec.row} projects={projects} fx={fx} onClose={() => setRec({ open: false, row: null })} onSaved={refresh} />
    </FinanceShell>
  );
}
