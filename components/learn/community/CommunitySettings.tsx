"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { api } from "./client-utils";

/** Account settings: the reply digest email (on by default). */
export default function CommunitySettings({ replyDigest }: { replyDigest: boolean }) {
  const t = useT();
  const [on, setOn] = useState(replyDigest);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(v: boolean) {
    setBusy(true);
    setMsg(null);
    const r = await api<{ replyDigest: boolean }>("/api/learn/community/settings", "PATCH", { replyDigest: v });
    setBusy(false);
    if (r.ok) {
      setOn(r.data.replyDigest);
      setMsg(t("community.settings.saved"));
    } else setMsg(r.error);
  }

  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
      <h2 className="text-sm font-bold text-[var(--ink)]">{t("community.settings.title")}</h2>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={on}
          disabled={busy}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--orange)]"
        />
        <span>
          <span className="block text-sm font-semibold text-[var(--ink)]">{t("community.settings.digest")}</span>
          <span className="mt-0.5 block text-xs text-[var(--ink3)]">{t("community.settings.digestHelp")}</span>
        </span>
      </label>
      <p className="mt-3 text-xs text-[var(--ink3)]">{t("community.settings.privacy")}</p>
      {msg && <p role="status" className="mt-2 text-xs text-[var(--ink3)]">{msg}</p>}
    </section>
  );
}
