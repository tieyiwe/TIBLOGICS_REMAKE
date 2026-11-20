"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, RotateCcw, Undo2 } from "lucide-react";
import { Button, useConfirm, useToast } from "@/components/admin/ui";

export default function BlueprintActions({ id, status, creditUsed }: { id: string; status: string; creditUsed: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();

  async function act(action: string, ask?: { title: string; body: string; confirmLabel: string }) {
    if (ask && !(await confirm({ ...ask, danger: false }))) return;
    setBusy(action);
    const res = await fetch(`/api/admin/blueprints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(null);
    if (!res?.ok) toast.error("That didn't work", d.error ?? "Please try again.");
    else
      toast.success(
        action === "regenerate" ? "Blueprint rewritten" : action === "credit-used" ? "Credit marked as used" : "Credit marked as unused",
      );
    start(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        icon={creditUsed ? Undo2 : BadgeCheck}
        loading={busy?.startsWith("credit")}
        disabled={!!busy}
        onClick={() => act(creditUsed ? "credit-unused" : "credit-used")}
      >
        {creditUsed ? "Undo credit" : "Mark credit used"}
      </Button>
      {(status === "failed" || status === "ready") && (
        <Button
          size="sm"
          variant="secondary"
          icon={RotateCcw}
          loading={busy === "regenerate"}
          disabled={!!busy}
          onClick={() =>
            act(
              "regenerate",
              status === "ready"
                ? {
                    title: "Rewrite this blueprint?",
                    body: "The customer's current version will be replaced. Writing takes a minute or two.",
                    confirmLabel: "Rewrite",
                  }
                : undefined,
            )
          }
        >
          {busy === "regenerate" ? "Writing" : status === "failed" ? "Write it again" : "Rewrite"}
        </Button>
      )}
    </div>
  );
}
