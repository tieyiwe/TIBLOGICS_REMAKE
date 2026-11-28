"use client";

import { useState } from "react";
import { Button, useToast } from "@/components/admin/ui";
import { postJson } from "../learners/_components/fields";

/** Resends the child's welcome (or the parent's consent email while consent is pending). */
export function ResendSponsorship({ id }: { id: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await postJson<{ message: string }>(`/api/admin/learn/youth-sponsorships/${id}`, { action: "resend" });
          toast.success(r.message);
        } catch (err) {
          toast.error("Could not resend", err instanceof Error ? err.message : undefined);
        } finally {
          setBusy(false);
        }
      }}
    >
      Resend email
    </Button>
  );
}
