"use client";

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

export function scoreClass(score: number | null): string {
  if (score === null) return "bg-[#EEF2F7] text-[#7A8FA6]";
  if (score >= 70) return "bg-[#E8F7EE] text-[#0F6E56]";
  if (score >= 45) return "bg-[#FEF0E3] text-[#B8500A]";
  return "bg-[#F4F4F5] text-[#6B7280]";
}

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export function StagePill({ stage }: { stage: string }) {
  const s = STAGES.find((x) => x.key === stage);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${s?.color ?? "#7A8FA6"}1A`, color: s?.color ?? "#7A8FA6" }}>
      {s?.label ?? stage}
    </span>
  );
}

export function ScorePill({ lead }: { lead: Lead }) {
  if (lead.enrichStatus === "queued" || lead.enrichStatus === "running") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF0FA] text-[#2251A3] px-2 py-0.5 text-xs font-semibold"><Loader2 size={11} className="animate-spin" />{lead.enrichStatus}</span>;
  }
  if (lead.enrichStatus === "failed") return <span className="rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-xs font-semibold" title={lead.enrichError ?? ""}>failed</span>;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${scoreClass(lead.score)}`}>{lead.score ?? "-"}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className={`w-full ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#E5EAF2]">
          <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F7FB]" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

