"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function BlueprintActions({ id, status, creditUsed }: { id: string; status: string; creditUsed: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(action);
    const res = await fetch(`/api/admin/blueprints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(null);
    if (!res?.ok) alert(d.error ?? "That didn't work.");
    start(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-start gap-1.5 text-xs font-dm">
      <button onClick={() => act(creditUsed ? "credit-unused" : "credit-used")} disabled={!!busy} className="text-[#2251A3] hover:underline disabled:opacity-50">
        {busy?.startsWith("credit") ? <Loader2 size={12} className="animate-spin inline" /> : creditUsed ? "Undo credit used" : "Mark credit used"}
      </button>
      {(status === "failed" || status === "ready") && (
        <button
          onClick={() => act("regenerate", status === "ready" ? "Rewrite this blueprint? The customer's current version will be replaced." : undefined)}
          disabled={!!busy}
          className="text-[#B8500A] hover:underline disabled:opacity-50"
        >
          {busy === "regenerate" ? "Writing… (a minute or two)" : status === "failed" ? "Write it again" : "Rewrite"}
        </button>
      )}
    </div>
  );
}
