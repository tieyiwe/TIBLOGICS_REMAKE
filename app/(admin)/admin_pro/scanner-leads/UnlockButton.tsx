"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Staff: unlock a scan's full report for the visitor. */
export default function UnlockButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go() {
    if (!confirm("Unlock the full report for this scan? The visitor sees it at their link (no fix plan is shown to them).")) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/scanner-leads/${encodeURIComponent(id)}/unlock`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Could not unlock");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not unlock");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" onClick={go} disabled={busy} className="block text-xs font-dm font-semibold text-[var(--a-blue)] hover:underline whitespace-nowrap disabled:opacity-50">
        {busy ? "Unlocking…" : "Unlock report"}
      </button>
      {err && <p className="text-[11px] text-red-600">{err}</p>}
    </>
  );
}
