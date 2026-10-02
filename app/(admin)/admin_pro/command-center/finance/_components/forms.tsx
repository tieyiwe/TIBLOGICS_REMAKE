"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Paperclip, X } from "lucide-react";
import { Button, Drawer, useToast } from "@/components/admin/ui";
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_STATUSES, PAYMENT_METHODS, TAX_LABELS } from "@/lib/admin/command-center/constants";
import { localTodayKey } from "@/lib/admin/command-center/dates";
import { fmtMoney, fmtUsd, parseAmount } from "@/lib/admin/command-center/money";
import type { ExpenseRow, IncomeRow } from "@/lib/admin/command-center/finance";
import { api, errMsg } from "../../_components/api";
import { Field, SelectInput, SmartDateInput, TextArea, TextInput } from "../../_components/fields";

export type ProjectOpt = { id: string; name: string };
export type Fx = { CAD: number; EUR: number; XOF: number };

const centsStr = (c: number | null | undefined) => (c ? (c / 100).toFixed(2).replace(/\.00$/, "") : "");

// ── Shared money block: amount, currency, rate, tax ──────────────────────────

interface MoneyState {
  amount: string;
  currency: string;
  fx: string;
  tax: string;
  taxLabel: string;
}

function MoneyBlock({ m, set, fxDefaults, idp }: { m: MoneyState; set: (p: Partial<MoneyState>) => void; fxDefaults: Fx; idp: string }) {
  const amt = parseAmount(m.amount) ?? 0;
  const tax = parseAmount(m.tax) ?? 0;
  const rate = m.currency === "USD" ? 1 : Number(m.fx) || 0;
  return (
    <div className="space-y-3 rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface-2)]/60 p-3">
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <Field label="Amount (before tax)" htmlFor={`${idp}-amt`}>
          <TextInput id={`${idp}-amt`} inputMode="decimal" value={m.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0.00" className="tabular-nums" required />
        </Field>
        <Field label="Currency" htmlFor={`${idp}-cur`}>
          <SelectInput
            id={`${idp}-cur`}
            value={m.currency}
            onChange={(e) => {
              const c = e.target.value;
              set({ currency: c, fx: c === "USD" ? "1" : String((fxDefaults as Record<string, number>)[c] ?? 1) });
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      {m.currency !== "USD" ? (
        <Field label={`Exchange rate (USD per 1 ${m.currency})`} htmlFor={`${idp}-fx`} hint="The rate on the day, from your bank statement if you have it.">
          <TextInput id={`${idp}-fx`} inputMode="decimal" value={m.fx} onChange={(e) => set({ fx: e.target.value })} className="tabular-nums" />
        </Field>
      ) : null}
      <div className="grid grid-cols-[1fr_1fr] gap-3">
        <Field label="Tax (optional)" htmlFor={`${idp}-tax`}>
          <TextInput id={`${idp}-tax`} inputMode="decimal" value={m.tax} onChange={(e) => set({ tax: e.target.value })} placeholder="0.00" className="tabular-nums" />
        </Field>
        <Field label="Tax type" htmlFor={`${idp}-taxl`}>
          <TextInput id={`${idp}-taxl`} list={`${idp}-taxlabels`} value={m.taxLabel} onChange={(e) => set({ taxLabel: e.target.value })} placeholder="HST, GST, TVA" />
          <datalist id={`${idp}-taxlabels`}>
            {TAX_LABELS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
      </div>
      <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]" aria-live="polite">
        {m.currency === "USD" ? "" : `${fmtMoney(amt, m.currency)} = `}
        <span className="font-semibold text-[var(--a-ink)]">{fmtUsd(Math.round(amt * rate))}</span>
        {tax ? ` + ${fmtUsd(Math.round(tax * rate))} ${m.taxLabel || "tax"}` : ""}
      </p>
    </div>
  );
}

function moneyBody(m: MoneyState): { ok: true; body: Record<string, unknown> } | { ok: false; error: string } {
  const amountCents = parseAmount(m.amount);
  if (!amountCents || amountCents <= 0) return { ok: false, error: "Enter an amount above 0" };
  const taxCents = m.tax.trim() ? parseAmount(m.tax) : 0;
  if (taxCents === null || taxCents < 0) return { ok: false, error: "Tax must be a number" };
  const fxRate = m.currency === "USD" ? 1 : Number(m.fx);
  if (!(fxRate > 0)) return { ok: false, error: "Enter an exchange rate above 0" };
  return { ok: true, body: { amountCents, currency: m.currency, fxRate, taxCents, taxLabel: m.taxLabel.trim() || null } };
}

// ── Income ───────────────────────────────────────────────────────────────────

export function IncomeDrawer({
  open,
  onClose,
  row,
  projects,
  fx,
  defaultProject,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  row: IncomeRow | null;
  projects: ProjectOpt[];
  fx: Fx;
  defaultProject?: string | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState<string | null>(null);
  const [client, setClient] = useState("");
  const [desc, setDesc] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("invoiced");
  const [inv, setInv] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [paid, setPaid] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [m, setM] = useState<MoneyState>({ amount: "", currency: "USD", fx: "1", tax: "", taxLabel: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setDate(row?.dateKey ?? localTodayKey());
    setClient(row?.client ?? "");
    setDesc(row?.description ?? "");
    setProject(row?.projectId ?? defaultProject ?? "");
    setStatus(row ? (row.status === "overdue" ? "invoiced" : row.status) : "invoiced");
    setInv(row?.invoiceNumber ?? "");
    setDue(row?.dueKey ?? null);
    setPaid(row?.paidKey ?? null);
    setNotes(row?.notes ?? "");
    setM({ amount: centsStr(row?.amountCents), currency: row?.currency ?? "USD", fx: String(row?.fxRate ?? 1), tax: centsStr(row?.taxCents), taxLabel: row?.taxLabel ?? "" });
  }, [open, row, defaultProject]);

  const submit = async () => {
    const money = moneyBody(m);
    if (!money.ok) return toast.error(money.error);
    if (!date || !client.trim()) return toast.error("Add a date and a client");
    setBusy(true);
    try {
      const body = {
        dateKey: date,
        client: client.trim(),
        description: desc.trim() || null,
        projectId: project || null,
        status,
        invoiceNumber: inv.trim() || null,
        dueKey: due,
        paidKey: status === "paid" ? paid ?? date : null,
        notes: notes.trim() || null,
        ...money.body,
      };
      if (row) await api(`/api/admin/finance/income/${row.id}`, { method: "PATCH", body });
      else await api("/api/admin/finance/income", { body });
      toast.success(row ? "Income updated" : "Income added", `${client.trim()}: ${fmtUsd(Math.round((parseAmount(m.amount) ?? 0) * (m.currency === "USD" ? 1 : Number(m.fx))))}`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error("Could not save", errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={row ? "Edit income" : "Add income"}
      width={520}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={() => void submit()}>
            {row ? "Save changes" : "Add income"}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="in-date">
            <SmartDateInput id="in-date" ariaLabel="Date" value={date} onChange={setDate} />
          </Field>
          <Field label="Status" htmlFor="in-status">
            <SelectInput id="in-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {INCOME_STATUSES.filter((s) => s.value !== "overdue").map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Client" htmlFor="in-client">
          <TextInput id="in-client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Maple Bakery" required />
        </Field>
        <Field label="Description" htmlFor="in-desc">
          <TextInput id="in-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="AI assistant, phase 1 deposit" />
        </Field>
        <MoneyBlock m={m} set={(p) => setM((x) => ({ ...x, ...p }))} fxDefaults={fx} idp="in" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invoice number" htmlFor="in-inv">
            <TextInput id="in-inv" value={inv} onChange={(e) => setInv(e.target.value)} placeholder="INV-1042" />
          </Field>
          <Field label="Due date" htmlFor="in-due" hint="Unpaid after this shows as overdue.">
            <SmartDateInput id="in-due" ariaLabel="Due date" value={due} onChange={setDue} placeholder="e.g. in 30 days" />
          </Field>
          {status === "paid" ? (
            <Field label="Paid on" htmlFor="in-paid">
              <SmartDateInput id="in-paid" ariaLabel="Paid on" value={paid ?? date} onChange={setPaid} />
            </Field>
          ) : null}
          <Field label="Project" htmlFor="in-project" className={status === "paid" ? "" : "col-span-2"}>
            <SelectInput id="in-project" value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Notes" htmlFor="in-notes">
          <TextArea id="in-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>
        <button type="submit" hidden />
      </form>
    </Drawer>
  );
}

// ── Expense ──────────────────────────────────────────────────────────────────

const MAX_RECEIPT = 5 * 1024 * 1024;
const RECEIPT_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export function ExpenseDrawer({
  open,
  onClose,
  row,
  projects,
  fx,
  defaultProject,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  row: ExpenseRow | null;
  projects: ProjectOpt[];
  fx: Fx;
  defaultProject?: string | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState<string | null>(null);
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("software");
  const [desc, setDesc] = useState("");
  const [project, setProject] = useState("");
  const [method, setMethod] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; filename: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [m, setM] = useState<MoneyState>({ amount: "", currency: "USD", fx: "1", tax: "", taxLabel: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setDate(row?.dateKey ?? localTodayKey());
    setVendor(row?.vendor ?? "");
    setCategory(row?.category ?? "software");
    setDesc(row?.description ?? "");
    setProject(row?.projectId ?? defaultProject ?? "");
    setMethod(row?.paymentMethod ?? "");
    setReceiptUrl(row?.receiptUrl ?? "");
    setReceipt(row?.receiptId ? { id: row.receiptId, filename: "Uploaded receipt" } : null);
    setNotes(row?.notes ?? "");
    setM({ amount: centsStr(row?.amountCents), currency: row?.currency ?? "USD", fx: String(row?.fxRate ?? 1), tax: centsStr(row?.taxCents), taxLabel: row?.taxLabel ?? "" });
  }, [open, row, defaultProject]);

  const upload = async (file: File) => {
    if (file.size > MAX_RECEIPT) return toast.error("Receipts can be up to 5 MB");
    if (file.type && !RECEIPT_TYPES.includes(file.type)) return toast.error("Upload a PDF, PNG, JPEG or WebP file");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/finance/receipts", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
      setReceipt({ id: data.receipt.id, filename: data.receipt.filename });
      toast.success("Receipt uploaded", data.receipt.filename);
    } catch (e) {
      toast.error("Could not upload", errMsg(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    const money = moneyBody(m);
    if (!money.ok) return toast.error(money.error);
    if (!date || !vendor.trim()) return toast.error("Add a date and a vendor");
    setBusy(true);
    try {
      const body = {
        dateKey: date,
        vendor: vendor.trim(),
        category,
        description: desc.trim() || null,
        projectId: project || null,
        paymentMethod: method || null,
        receiptId: receipt?.id ?? null,
        receiptUrl: receiptUrl.trim() || null,
        notes: notes.trim() || null,
        ...money.body,
      };
      if (row) await api(`/api/admin/finance/expenses/${row.id}`, { method: "PATCH", body });
      else await api("/api/admin/finance/expenses", { body });
      toast.success(row ? "Expense updated" : "Expense added", vendor.trim());
      onSaved();
      onClose();
    } catch (e) {
      toast.error("Could not save", errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={row ? "Edit expense" : "Add expense"}
      width={520}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} disabled={uploading} onClick={() => void submit()}>
            {row ? "Save changes" : "Add expense"}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="ex-date">
            <SmartDateInput id="ex-date" ariaLabel="Date" value={date} onChange={setDate} />
          </Field>
          <Field label="Category" htmlFor="ex-cat">
            <SelectInput id="ex-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Vendor" htmlFor="ex-vendor">
          <TextInput id="ex-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Replit, Anthropic, Google Workspace" required />
        </Field>
        <Field label="Description" htmlFor="ex-desc">
          <TextInput id="ex-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What it was for" />
        </Field>
        <MoneyBlock m={m} set={(p) => setM((x) => ({ ...x, ...p }))} fxDefaults={fx} idp="ex" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment method" htmlFor="ex-method">
            <SelectInput id="ex-method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">Not set</option>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Project" htmlFor="ex-project">
            <SelectInput id="ex-project" value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div className="space-y-2 rounded-[12px] border border-dashed border-[var(--a-border-strong)] p-3">
          <p className="font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Receipt</p>
          {receipt ? (
            <div className="flex items-center gap-2 font-dm text-[13px]">
              <Paperclip size={14} className="text-[var(--a-ink-3)]" aria-hidden />
              <a href={`/api/admin/finance/receipts/${receipt.id}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-semibold text-[var(--a-blue)] hover:underline">
                {receipt.filename}
              </a>
              <button type="button" onClick={() => setReceipt(null)} aria-label="Remove receipt" className="rounded p-1 text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]">
                <X size={14} aria-hidden />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 font-dm text-[13px] text-[var(--a-ink-2)]">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-semibold hover:bg-[var(--a-surface-2)]">
                <FileUp size={14} aria-hidden /> {uploading ? "Uploading" : "Upload file"}
              </span>
              <span className="text-[12px] text-[var(--a-ink-3)]">PDF, PNG, JPEG or WebP, up to 5 MB. Stored privately.</span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Upload receipt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                }}
              />
            </label>
          )}
          <TextInput value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="Or paste a link (Drive, email)" aria-label="Receipt link" />
        </div>
        <Field label="Notes" htmlFor="ex-notes">
          <TextArea id="ex-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>
        <button type="submit" hidden />
      </form>
    </Drawer>
  );
}

// ── Recurring ────────────────────────────────────────────────────────────────

export interface RecurringRow {
  id: string;
  vendor: string;
  category: string;
  description: string | null;
  projectId: string | null;
  amountCents: number;
  currency: string;
  fxRate: number;
  amountUsdCents: number;
  taxCents: number;
  taxLabel: string | null;
  paymentMethod: string | null;
  interval: string;
  startKey: string;
  nextKey: string;
  active: boolean;
}

export function RecurringDrawer({
  open,
  onClose,
  row,
  projects,
  fx,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  row: RecurringRow | null;
  projects: ProjectOpt[];
  fx: Fx;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("software");
  const [desc, setDesc] = useState("");
  const [project, setProject] = useState("");
  const [method, setMethod] = useState("");
  const [interval, setInterval] = useState("monthly");
  const [start, setStart] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [m, setM] = useState<MoneyState>({ amount: "", currency: "USD", fx: "1", tax: "", taxLabel: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setVendor(row?.vendor ?? "");
    setCategory(row?.category ?? "software");
    setDesc(row?.description ?? "");
    setProject(row?.projectId ?? "");
    setMethod(row?.paymentMethod ?? "");
    setInterval(row?.interval ?? "monthly");
    setStart(row?.startKey ?? localTodayKey());
    setActive(row?.active ?? true);
    setM({ amount: centsStr(row?.amountCents), currency: row?.currency ?? "USD", fx: String(row?.fxRate ?? 1), tax: centsStr(row?.taxCents), taxLabel: row?.taxLabel ?? "" });
  }, [open, row]);

  const submit = async () => {
    const money = moneyBody(m);
    if (!money.ok) return toast.error(money.error);
    if (!vendor.trim() || !start) return toast.error("Add a vendor and a start date");
    setBusy(true);
    try {
      const body = { vendor: vendor.trim(), category, description: desc.trim() || null, projectId: project || null, paymentMethod: method || null, interval, startKey: start, active, ...money.body };
      const r = row
        ? await api<{ generated: number }>(`/api/admin/finance/recurring/${row.id}`, { method: "PATCH", body })
        : await api<{ generated: number }>("/api/admin/finance/recurring", { body });
      toast.success(row ? "Recurring charge updated" : "Recurring charge added", r.generated ? `${r.generated} expense${r.generated === 1 ? "" : "s"} recorded so far` : undefined);
      onSaved();
      onClose();
    } catch (e) {
      toast.error("Could not save", errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={row ? "Edit recurring charge" : "Add recurring charge"}
      width={520}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={() => void submit()}>
            {row ? "Save changes" : "Add charge"}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <p className="rounded-[10px] bg-[var(--a-info-bg)] px-3 py-2 font-dm text-[12.5px] text-[#1b3a6b]">
          An expense is recorded automatically on each billing date, starting from the start date (past periods are filled in now).
        </p>
        <Field label="Vendor" htmlFor="rc-vendor">
          <TextInput id="rc-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Replit, Anthropic, Google Workspace, Titan, domain" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="rc-cat">
            <SelectInput id="rc-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Billed" htmlFor="rc-int">
            <SelectInput id="rc-int" value={interval} onChange={(e) => setInterval(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="annual">Yearly</option>
            </SelectInput>
          </Field>
          <Field label="First billing date" htmlFor="rc-start">
            <SmartDateInput id="rc-start" ariaLabel="First billing date" value={start} onChange={setStart} />
          </Field>
          <Field label="Payment method" htmlFor="rc-method">
            <SelectInput id="rc-method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">Not set</option>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <MoneyBlock m={m} set={(p) => setM((x) => ({ ...x, ...p }))} fxDefaults={fx} idp="rc" />
        <Field label="Description" htmlFor="rc-desc">
          <TextInput id="rc-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Core plan" />
        </Field>
        <Field label="Project" htmlFor="rc-project">
          <SelectInput id="rc-project" value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <label className="flex items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--a-blue)]" />
          Active (record new periods)
        </label>
        <button type="submit" hidden />
      </form>
    </Drawer>
  );
}
