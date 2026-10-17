"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

/** "Thanks!" on the encouragement banner: marks the notice read. */
export default function EncouragementDismiss({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <button
      type="button"
      className="shrink-0 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
      data-testid="encouragement-thanks"
      onClick={async () => {
        await fetch("/api/learn/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read", id }) }).catch(() => null);
        router.refresh();
      }}
    >
      {t("learn.youth.enc.thanks")}
    </button>
  );
}
