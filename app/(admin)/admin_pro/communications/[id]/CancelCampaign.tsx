"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarX } from "lucide-react";
import { Button, useToast } from "@/components/admin/ui";
import { Dialog } from "../../learn/learners/_components/Dialog";
import { postJson } from "../../learn/learners/_components/fields";

export function CancelCampaign({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function cancel() {
    setBusy(true);
    try {
      await postJson(`/api/admin/communications/campaigns/${id}`, { action: "cancel" });
      toast.success("Scheduled message cancelled");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Not cancelled", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="secondary" icon={CalendarX} onClick={() => setOpen(true)}>Cancel schedule</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Cancel this scheduled message?"
        icon={CalendarX}
        tone="warn"
        description="Nobody receives it. You can write a new one any time."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Keep it</Button>
            <Button variant="danger" loading={busy} onClick={cancel}>Cancel message</Button>
          </>
        }
      />
    </>
  );
}
