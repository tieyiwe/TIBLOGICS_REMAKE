"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useT } from "@/lib/i18n/client";

const MAX = 5000;

export default function ReplyForm({ threadId }: { threadId: string }) {
  const t = useT();
  const router = useRouter();
  const id = useId();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setMsg({ ok: false, text: t("inbox.empty_reply") });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/learn/inbox/${encodeURIComponent(threadId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("inbox.error"));
      setBody("");
      setMsg({ ok: true, text: t("inbox.sent") });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : t("inbox.error") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
      <label htmlFor={id} className="text-sm font-bold text-[var(--ink)]">
        {t("inbox.reply")}
      </label>
      <textarea
        id={id}
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX))}
        rows={5}
        maxLength={MAX}
        placeholder={t("inbox.replyPlaceholder")}
        className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] px-3 py-2.5 text-[15px] outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--ink3)]">
          {t("inbox.formatHint")} <span className="tabular-nums">{body.length}/{MAX}</span>
        </p>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-full bg-[var(--ink)] px-6 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t("inbox.sending") : t("inbox.send")}
        </button>
      </div>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
