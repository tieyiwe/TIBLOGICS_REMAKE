"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { STAGES } from "@/lib/growth/outreach/shared";

export interface Lead {
  id: string;
  source: string;
  sourceId: string | null;
  companyName: string;
  contactName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  domain: string | null;
  industry: string | null;
  area: string | null;
  linkedinUrl: string | null;
  stage: string;
  score: number | null;
  bestOffer: string | null;
  opener: string | null;
  emailStatus: string;
  enrichStatus: string;
  enrichError: string | null;
  consentBasis: string;
  doNotContact: boolean;
  handedOverAt: string | null;
  lastContactedAt: string | null;
  updatedAt: string;
  createdAt: string;
  [k: string]: unknown;
}

/** Score chip colours: hot (70+), warm (45+), cold, unscored. */
export function scoreClass(score: number | null): string {
  if (score === null) return "bg-[var(--a-surface-2)] text-[var(--a-ink-3)] ring-[var(--a-border)]";
  if (score >= 70) return "bg-[var(--a-success-bg)] text-[var(--a-success)] ring-[#c8ead6]";
  if (score >= 45) return "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)] ring-[#f9d6b8]";
  return "bg-[var(--a-surface-2)] text-[var(--a-ink-2)] ring-[var(--a-border)]";
}

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export function StagePill({ stage }: { stage: string }) {
  const s = STAGES.find((x) => x.key === stage);
  const c = s?.color ?? "#5A6E84";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-dm text-[12px] font-semibold leading-5 ring-1 ring-inset" style={{ background: `${c}14`, color: c, ["--tw-ring-color" as string]: `${c}33` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} aria-hidden />
      {s?.label ?? stage}
    </span>
  );
}

export function ScorePill({ lead }: { lead: Lead }) {
  const base = "inline-flex h-6 min-w-[34px] items-center justify-center gap-1 rounded-full px-2 font-dm text-[12px] font-bold tabular-nums ring-1 ring-inset";
  if (lead.enrichStatus === "queued" || lead.enrichStatus === "running") {
    return <span className={`${base} bg-[var(--a-info-bg)] text-[var(--a-info)] ring-[#d3def3] font-semibold`}><Loader2 size={11} className="animate-spin" aria-hidden />{lead.enrichStatus}</span>;
  }
  if (lead.enrichStatus === "failed") return <span className={`${base} bg-[var(--a-danger-bg)] text-[var(--a-danger)] ring-[#f6cccc] font-semibold`} title={lead.enrichError ?? ""}>failed</span>;
  return <span className={`${base} ${scoreClass(lead.score)}`} title={lead.score === null ? "Not scored yet" : `Fit score ${lead.score} of 100`}>{lead.score ?? "-"}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(13,27,42,.35)] p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className={`a-anim-pop max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-[var(--a-surface)] shadow-[var(--a-shadow-pop)] sm:rounded-[20px] ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-[var(--a-border)] bg-[var(--a-surface)] px-5 py-4">
          <h2 className="font-syne text-[18px] font-semibold text-[var(--a-ink)]">{title}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
