"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";

export default function JoinTeamButton({ token }: { token: string }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function join() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("team.error.generic"));
      router.push("/learn/team/welcome");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("team.error.generic"));
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={join} disabled={busy} className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
        {busy ? t("team.busy") : t("team.join.cta")}
      </button>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
