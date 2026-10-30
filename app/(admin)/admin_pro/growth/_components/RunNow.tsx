"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button, useToast } from "@/components/admin/ui";

/** Runs the repurpose automation now (normally every 15 minutes by cron). */
export default function RunNow() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/growth/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: "repurpose" }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed");
      const r = j.repurpose;
      toast.success(
        `${r.drafts} new draft${r.drafts === 1 ? "" : "s"}`,
        `From ${r.processed} new item${r.processed === 1 ? "" : "s"}${r.remaining ? `, ${r.remaining} left for the next run` : ""}.`,
      );
      router.refresh();
    } catch (e) {
      toast.error("Drafting failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button icon={Wand2} loading={busy} onClick={run} title="Draft posts for new articles, tracks, products and events">
      <span className="hidden sm:inline">Draft from new content</span>
      <span className="sm:hidden">Draft new</span>
    </Button>
  );
}
