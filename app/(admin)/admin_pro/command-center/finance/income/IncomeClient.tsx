"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, EmptyState, Menu, SearchInput, Select, StatCard, Toolbar, useConfirm, useToast } from "@/components/admin/ui";
import type { IncomeRow } from "@/lib/admin/command-center/finance";
import { PLATFORM_SOURCES } from "@/lib/admin/command-center/constants";
import { fmtDay, localTodayKey, relativeDay } from "@/lib/admin/command-center/dates";
import { fmtMoney, fmtUsd } from "@/lib/admin/command-center/money";
import { api, errMsg } from "../../_components/api";
import { FinanceShell } from "../_components/FinanceShell";
import { IncomeDrawer, type Fx, type ProjectOpt } from "../_components/forms";
import { RangeBar } from "../_components/RangeBar";

const STATUS_TONE = { paid: "success", invoiced: "info", overdue: "danger" } as const;

export default function IncomeClient({ rows, range, projects, fx }: { rows: IncomeRow[]; range: { from: string; to: string; preset: string }; projects: ProjectOpt[]; fx: Fx }) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState(search?.get("status") ?? "");
  const [drawer, setDrawer] = useState<{ open: boolean; row: IncomeRow | null }>({ open: false, row: null });
  const today = localTodayKey();
  useEffect(() => {
    if (search?.get("new") === "1") setDrawer({ open: true, row: null });
  }, [search]);

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!source || (source === "manual" ? r.kind === "manual" : r.source === source)) &&
        (!status || r.status === status) &&
        (!ql || `${r.client} ${r.description ?? ""} ${r.invoiceNumber ?? ""}`.toLowerCase().includes(ql)),
    );
  }, [rows, q, source, status]);
  const received = rows.filter((r) => r.status === "paid").reduce((n, r) => n + r.amountUsdCents, 0);
  const platform = rows.filter((r) => r.kind === "platform").reduce((n, r) => n + r.amountUsdCents, 0);
  const open = rows.filter((r) => r.status !== "paid");
  const overdue = rows.filter((r) => r.status === "overdue");
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name;

  const refresh = () => router.refresh();
  const markPaid = async (r: IncomeRow) => {
    try {
      await api(`/api/admin/finance/income/${r.id}`, { method: "PATCH", body: { status: "paid", paidKey: today } });
      toast.success("Marked paid", r.client);
      refresh();
    } catch (e) {
      toast.error("Could not update", errMsg(e));
    }
  };

  return (
    <FinanceShell
      title="Income"
      subtitle="Client invoices and payments you record, plus platform revenue read from Stripe-backed records."
      actions={
        <Button size="sm" variant="primary" icon={Plus} onClick={() => setDrawer({ open: true, row: null })}>
          Add income
        </Button>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Received" value={fmtUsd(received, { compact: true })} tone="success" hint="Paid in this period" />
        <StatCard label="Platform" value={fmtUsd(platform, { compact: true })} hint="Included in received" />
        <StatCard label="Open invoices" value={fmtUsd(open.reduce((n, r) => n + r.amountUsdCents + r.taxUsdCents, 0), { compact: true })} hint={`${open.length} invoice${open.length === 1 ? "" : "s"} in this period`} tone="navy" />
        <StatCard label="Overdue" value={overdue.length} tone={overdue.length ? "danger" : "default"} hint={overdue.length ? fmtUsd(overdue.reduce((n, r) => n + r.amountUsdCents, 0)) : "None"} />
      </div>
      <Toolbar end={<RangeBar range={range} exportKind="income" />}>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client, invoice" label="Filter income" />
        <Select label="Source" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="manual">Client invoices</option>
          {PLATFORM_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="paid">Paid</option>
          <option value="invoiced">Invoiced</option>
          <option value="overdue">Overdue</option>
        </Select>
      </Toolbar>

      {visible.length === 0 ? (
        <EmptyState icon={Wallet} title="No income in this view" body="Record a client invoice or payment, or widen the period." action={<Button variant="primary" icon={Plus} onClick={() => setDrawer({ open: true, row: null })}>Add income</Button>} />
      ) : (
        <div className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
          <table className="hidden w-full border-collapse font-dm text-[13.5px] md:table">
            <thead className="bg-[var(--a-surface-2)]">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Client</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="w-12 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-[var(--a-border)] hover:bg-[#f8fafd]" data-income={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--a-ink-2)]">{fmtDay(r.dateKey, { withYear: r.dateKey.slice(0, 4) !== today.slice(0, 4) })}</td>
                  <td className="max-w-[320px] px-4 py-3">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{r.client}</span>
                    <span className="block truncate text-[12px] text-[var(--a-ink-3)]">
                      {[r.description, r.invoiceNumber ? `#${r.invoiceNumber}` : null, projectName(r.projectId)].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={r.kind === "manual" ? "orange" : "neutral"}>{r.sourceLabel}</Badge>
                      {r.estimate ? <Badge tone="warn">Estimate</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? "neutral"} dot>
                      {r.status === "paid" ? "Paid" : r.status === "overdue" ? "Overdue" : "Invoiced"}
                    </Badge>
                    {r.status !== "paid" && r.dueKey ? <span className={cn("ml-1.5 text-[12px]", r.status === "overdue" ? "text-[var(--a-danger)]" : "text-[var(--a-ink-3)]")}>due {relativeDay(r.dueKey, today)}</span> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="block font-semibold tabular-nums text-[var(--a-ink)]">{fmtUsd(r.amountUsdCents)}</span>
                    {r.currency !== "USD" || r.taxCents ? (
                      <span className="block text-[12px] tabular-nums text-[var(--a-ink-3)]">
                        {r.currency !== "USD" ? `${fmtMoney(r.amountCents, r.currency)} @ ${r.fxRate}` : ""}
                        {r.taxCents ? ` + ${r.taxLabel ?? "tax"} ${fmtUsd(r.taxUsdCents)}` : ""}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-3">{r.kind === "manual" ? <RowMenu r={r} onEdit={() => setDrawer({ open: true, row: r })} onPaid={() => void markPaid(r)} onDelete={async () => {
                    if (!(await confirm({ title: `Delete income from ${r.client}?`, body: `${fmtUsd(r.amountUsdCents)} on ${fmtDay(r.dateKey, { withYear: true })}. This is recorded in the audit log.`, danger: true, confirmLabel: "Delete" }))) return;
                    try {
                      await api(`/api/admin/finance/income/${r.id}`, { method: "DELETE" });
                      toast.success("Income deleted");
                      refresh();
                    } catch (e) {
                      toast.error("Could not delete", errMsg(e));
                    }
                  }} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-[var(--a-border)] md:hidden">
            {visible.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-dm text-[14px] font-semibold text-[var(--a-ink)]">{r.client}</p>
                  <p className="truncate font-dm text-[12px] text-[var(--a-ink-3)]">
                    {fmtDay(r.dateKey)} · {r.sourceLabel}
                    {r.estimate ? " (estimate)" : ""}
                  </p>
                  <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? "neutral"} dot className="mt-1">
                    {r.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-dm text-[14px] font-semibold tabular-nums text-[var(--a-ink)]">{fmtUsd(r.amountUsdCents)}</p>
                  {r.kind === "manual" ? (
                    <button type="button" onClick={() => setDrawer({ open: true, row: r })} className="mt-1 font-dm text-[12.5px] font-semibold text-[var(--a-blue)]">
                      Edit
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <IncomeDrawer
        open={drawer.open}
        row={drawer.row}
        projects={projects}
        fx={fx}
        defaultProject={search?.get("project")}
        onClose={() => {
          setDrawer({ open: false, row: null });
          if (search?.get("new")) router.replace("/admin_pro/command-center/finance/income", { scroll: false });
        }}
        onSaved={refresh}
      />
    </FinanceShell>
  );
}

function RowMenu({ r, onEdit, onPaid, onDelete }: { r: IncomeRow; onEdit: () => void; onPaid: () => void; onDelete: () => void }) {
  return (
    <Menu
      label={`Actions for ${r.client}`}
      items={[
        { label: "Edit", icon: Pencil, onSelect: onEdit },
        ...(r.status !== "paid" ? [{ label: "Mark paid today", icon: CheckCircle2, onSelect: onPaid }] : []),
        { separator: true as const },
        { label: "Delete", icon: Trash2, danger: true, onSelect: onDelete },
      ]}
      trigger={(p) => (
        <button {...p} aria-label={`Actions for ${r.client}`} className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]">
          <span aria-hidden className="text-[18px] leading-none">⋯</span>
        </button>
      )}
    />
  );
}
