"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useT } from "@/lib/i18n/client";

/**
 * "Continue with Google" for Learn, with an "or" divider below it. Renders
 * nothing until the server reports the Google provider is configured, so the
 * button never appears without GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
 */
export default function GoogleSignIn({ next, error }: { next: string; error?: boolean }) {
  const t = useT();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    getProviders()
      .then((p) => live && setEnabled(!!p?.google))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="mb-5">
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {t("learn.auth.googleFailed")}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signIn("google", { callbackUrl: next });
        }}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-[var(--border)] bg-white py-3 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--s2)] disabled:opacity-60"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {busy ? t("learn.auth.signingIn") : t("learn.auth.google")}
      </button>
      <div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        {t("learn.auth.or")}
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
    </div>
  );
}
