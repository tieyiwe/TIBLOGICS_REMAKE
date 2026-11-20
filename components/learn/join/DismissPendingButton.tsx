"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** "Not now" on the Finish-your-enrolment card: closes the saved choice. */
export default function DismissPendingButton({ label }: { label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/learn/join/choice", { method: "DELETE" }).catch(() => {});
        router.refresh();
      }}
      className="min-h-[44px] text-sm text-[var(--ink3)] underline underline-offset-2 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
