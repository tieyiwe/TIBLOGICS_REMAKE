"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Sends one editor operation to /api/admin/learn/content and refreshes the
 * page from the server. A delete that would erase learner records comes back
 * as 409 with the counts; the admin is asked, and it is re-sent confirmed.
 */
export function useOp() {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(body: Record<string, unknown>, opts: { key?: string; confirmText?: string; refresh?: boolean } = {}): Promise<Record<string, unknown> | null> {
    if (opts.confirmText && !confirm(opts.confirmText)) return null;
    setBusy(opts.key ?? String(body.op));
    setError(null);
    try {
      let res = await fetch("/api/admin/learn/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      let data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.needsConfirm) {
        if (!confirm(data.error)) return null;
        res = await fetch("/api/admin/learn/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, confirm: true }) });
        data = await res.json().catch(() => ({}));
      }
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return null;
      }
      if (opts.refresh !== false) start(() => router.refresh());
      return data;
    } catch {
      setError("Could not reach the server.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  return { run, busy, error, setError };
}

export const inputCls =
  "w-full px-3 py-2 border border-[#D2DCE8] rounded-lg text-sm font-dm text-[#0D1B2A] bg-white placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]";
export const labelCls = "block font-dm text-xs font-semibold text-[#3A4A5C] mb-1";
export const btn = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-dm font-semibold disabled:opacity-50";
export const btnPrimary = `${btn} bg-[#1B3A6B] text-white hover:bg-[#2251A3]`;
export const btnGhost = `${btn} text-[#2251A3] hover:bg-[#EBF0FA]`;
export const btnDanger = `${btn} text-red-600 hover:bg-red-50`;
