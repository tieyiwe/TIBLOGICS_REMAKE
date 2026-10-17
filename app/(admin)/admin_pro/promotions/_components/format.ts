// Display helpers shared by the promotions admin pages (client-safe).
import type { BadgeTone } from "@/components/admin/ui";
import { SCOPE_LABELS, fmtZoned, promoStatus, type PromoStatus, type ScopeEntry } from "@/lib/promotions/shared";
import type { SerialPromotion } from "@/lib/promotions/admin";

export const STATUS_LABEL: Record<PromoStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
  paused: "Paused",
};

export const STATUS_TONE: Record<PromoStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "info",
  live: "success",
  ended: "neutral",
  paused: "warn",
};

export function statusOf(p: SerialPromotion, now = new Date()): PromoStatus {
  return promoStatus(
    { ...p, startsAt: p.startsAt ? new Date(p.startsAt) : null, endsAt: p.endsAt ? new Date(p.endsAt) : null },
    now,
  );
}

export function scopeSummary(scope: ScopeEntry[], names?: Record<string, string>): string {
  if (scope.length === 0) return "Nothing yet";
  return scope
    .map((s) => {
      const base = SCOPE_LABELS[s.key];
      if (!s.ids || s.ids.length === 0) return base;
      if (s.ids.length === 1 && names?.[s.ids[0]]) return `${base}: ${names[s.ids[0]]}`;
      return `${base} (${s.ids.length} selected)`;
    })
    .join(", ");
}

export function windowLabel(p: Pick<SerialPromotion, "startsAt" | "endsAt">): string {
  if (!p.startsAt && !p.endsAt) return "No end date";
  if (p.startsAt && p.endsAt) return `${fmtZoned(p.startsAt)} to ${fmtZoned(p.endsAt)}`;
  if (p.startsAt) return `From ${fmtZoned(p.startsAt)}`;
  return `Until ${fmtZoned(p.endsAt)}`;
}

export function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 });
}

export async function api<T = Record<string, unknown>>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; needsConfirm?: boolean };
  if (!res.ok) {
    const e = new Error(data.error || `Request failed (${res.status})`) as Error & { needsConfirm?: boolean };
    e.needsConfirm = !!data.needsConfirm;
    throw e;
  }
  return data;
}
