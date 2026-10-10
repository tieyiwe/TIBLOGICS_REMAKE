"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

export default function UnsubscribeButton({ token }: { token: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "busy" | "out" | "in" | "error">("idle");

  async function send(optOut: boolean) {
    setState("busy");
    const res = await fetch("/api/learn/comms/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: token, optOut }),
    }).catch(() => null);
    setState(res?.ok ? (optOut ? "out" : "in") : "error");
  }

  if (state === "out") {
    return (
      <div className="mt-5">
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{t("unsubscribe.done")}</p>
        <button type="button" onClick={() => send(false)} className="mt-3 text-sm font-semibold text-[var(--blue2)] underline underline-offset-2">
          {t("unsubscribe.resubscribe")}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-5">
      {state === "in" && <p role="status" className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{t("unsubscribe.resubscribed")}</p>}
      {state === "error" && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t("unsubscribe.invalid")}</p>}
      <button
        type="button"
        disabled={state === "busy"}
        onClick={() => send(true)}
        className="min-h-11 rounded-full bg-[var(--ink)] px-6 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {t("unsubscribe.confirm")}
      </button>
    </div>
  );
}
