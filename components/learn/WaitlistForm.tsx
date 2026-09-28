"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

export default function WaitlistForm({ trackSlug }: { trackSlug: string }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "saving") return;
    setState("saving");
    try {
      const res = await fetch("/api/learn/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, trackSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("learn.waitlist.failed"));
      setState("done");
      setMessage(data.message ?? t("learn.waitlist.joined"));
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : t("learn.error.generic"));
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-lg bg-[var(--blue-light)] px-3 py-2 text-xs font-medium text-[var(--blue)]">
        ✓ {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={`wl-${trackSlug}`} className="sr-only">
        {t("learn.waitlist.label")}
      </label>
      <div className="flex gap-2">
        <input
          id={`wl-${trackSlug}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("learn.waitlist.placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
        />
        <button
          type="submit"
          disabled={state === "saving"}
          className="shrink-0 rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "saving" ? "…" : t("learn.waitlist.notifyMe")}
        </button>
      </div>
      {state === "error" && <p className="text-xs text-red-600">{message}</p>}
    </form>
  );
}
