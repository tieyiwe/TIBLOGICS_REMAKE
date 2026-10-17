"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

// "Share": copies a link to the clipboard (the public portfolio page). Only
// a site path is accepted, so the button can never be pointed elsewhere.
export default function ShareLinkButton({ path }: { path: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";

  async function copy() {
    const url = new URL(safe, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      // Clipboard blocked (insecure context, permissions): show the link instead.
      window.prompt(t("learn.radar.copyPrompt"), url);
      setState("failed");
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={copy}
        data-testid="skills-share"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--s2)]"
      >
        <span aria-hidden="true">🔗</span>
        {state === "copied" ? t("learn.radar.copied") : t("learn.radar.share")}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? t("learn.radar.copied") : ""}
      </span>
    </div>
  );
}
