"use client";

import type { TeamReport, MemberSummary } from "@/lib/learn/team/report";
import type { SeatTier } from "@/lib/learn/team/config";

// Shared pieces of the manager dashboard tabs.

export async function call<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Error");
  return data as T;
}

export type Run = (key: string, fn: () => Promise<string | void>, opts?: { refresh?: boolean }) => Promise<void>;

export interface TeamInfo {
  id: string;
  name: string;
  status: string;
  seats: number;
  comped: boolean;
  inGrace: boolean;
  graceUntil: string | null;
  entitled: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  hasBilling: boolean;
}

export interface LinkView {
  url: string;
  domain: string;
  trackIds: string[];
  dueAt: string | null;
  createdAt: string;
}

export interface DashCtx {
  team: TeamInfo;
  role: string;
  isOwner: boolean;
  used: number;
  free: number;
  report: TeamReport;
  /** Localized track titles by id. */
  titles: Record<string, string>;
  locale: string;
  busy: string | null;
  run: Run;
  goTab: (tab: TabId) => void;
  openMember: (memberId: string) => void;
}

export type TabId = "overview" | "people" | "invite" | "assignments" | "reports" | "billing";

export interface PriceInfo {
  seatPriceCents: number;
  minSeats: number;
  tiers: SeatTier[];
}

export const cls = {
  card: "min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6",
  btn: "inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50",
  primary: "inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50",
  accent: "inline-flex items-center justify-center rounded-full bg-[var(--orange)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50",
  label: "block text-sm font-semibold text-[var(--ink)]",
  input: "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm",
  h2: "text-base font-bold text-[var(--ink)]",
  hint: "mt-1 text-sm text-[var(--ink2)]",
  kicker: "text-xs font-bold uppercase tracking-wide text-[var(--ink3)]",
};

export function Bar({ value, tone = "blue", label }: { value: number; tone?: "blue" | "red" | "green" | "orange"; label?: string }) {
  const color = tone === "red" ? "bg-red-600" : tone === "green" ? "bg-green-600" : tone === "orange" ? "bg-[var(--orange)]" : "bg-[var(--blue2)]";
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--s3)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Pill({ tone, children }: { tone: "green" | "amber" | "red" | "grey" | "blue"; children: React.ReactNode }) {
  const c =
    tone === "green" ? "bg-green-50 text-green-800" : tone === "amber" ? "bg-amber-50 text-amber-900" : tone === "red" ? "bg-red-50 text-red-800" : tone === "blue" ? "bg-blue-50 text-blue-900" : "bg-[var(--s3)] text-[var(--ink2)]";
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${c}`}>{children}</span>;
}

export function Kpi({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: "red" | "green" }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="break-words text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${tone === "red" ? "text-red-700" : tone === "green" ? "text-green-800" : "text-[var(--ink)]"}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-[var(--ink2)]">{detail}</p>}
    </div>
  );
}

const DAY = 86_400_000;
export const INACTIVE_DAYS = 7;

export function isInactive(m: MemberSummary, now = Date.now()): boolean {
  return m.status === "active" && (!m.lastActiveAt || now - new Date(m.lastActiveAt).getTime() > INACTIVE_DAYS * DAY);
}

export function activeThisWeek(m: MemberSummary, now = Date.now()): boolean {
  return m.status === "active" && !!m.lastActiveAt && now - new Date(m.lastActiveAt).getTime() <= 7 * DAY;
}

export type AssignmentRow = TeamReport["assignments"][number];

export function assignmentStatus(a: AssignmentRow): "done" | "overdue" | "behind" | "onTrack" | "notStarted" {
  if (a.percent >= 100) return "done";
  if (a.overdue) return "overdue";
  if (a.dueAt) {
    const start = new Date(a.createdAt).getTime();
    const end = new Date(a.dueAt).getTime();
    const expected = end > start ? Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100)) : 100;
    if (a.percent + 10 < expected) return "behind";
  }
  return a.percent > 0 ? "onTrack" : "notStarted";
}

export const statusTone = (s: ReturnType<typeof assignmentStatus>) =>
  s === "done" ? "green" : s === "overdue" ? "red" : s === "behind" ? "amber" : s === "onTrack" ? "blue" : "grey";

export const barTone = (s: ReturnType<typeof assignmentStatus>) => (s === "done" ? "green" : s === "overdue" ? "red" : s === "behind" ? "orange" : "blue");

/** Checkbox list of tracks (multi-select). */
export function TrackPicker({
  id,
  tracks,
  titles,
  value,
  onChange,
  legend,
}: {
  id: string;
  tracks: Array<{ id: string }>;
  titles: Record<string, string>;
  value: string[];
  onChange: (v: string[]) => void;
  legend: string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={cls.label}>{legend}</legend>
      <div id={id} className="mt-1.5 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
        {tracks.map((tr) => {
          const on = value.includes(tr.id);
          return (
            <label key={tr.id} className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm ${on ? "bg-[var(--s3)] font-semibold" : ""}`}>
              <input type="checkbox" className="mt-0.5" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== tr.id) : [...value, tr.id])} />
              <span className="min-w-0 break-words">{titles[tr.id] ?? tr.id}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export const displayName = (m: Pick<MemberSummary, "name" | "email"> & { invite?: MemberSummary["invite"] }) => m.name ?? m.invite?.name ?? m.email;
