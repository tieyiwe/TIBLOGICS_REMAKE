"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { btn } from "./ui";

/** Runs the repurpose automation now (normally every 15 minutes by cron). */
export default function RunNow() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/growth/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: "repurpose" }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(j.error ?? "Failed");
    const r = j.repurpose;
    setMsg(`${r.drafts} new draft${r.drafts === 1 ? "" : "s"} from ${r.processed} new item${r.processed === 1 ? "" : "s"}${r.remaining ? `, ${r.remaining} left for the next run` : ""}.`);
    router.refresh();
  }
  return (
    <span className="inline-flex flex-col">
      <button className={btn.ghost} onClick={run} disabled={busy}><Wand2 size={15} /> {busy ? "Drafting…" : "Draft posts from new content"}</button>
      {msg && <span role="status" className="font-dm text-xs text-[#0F6E56] mt-1">{msg}</span>}
    </span>
  );
}
