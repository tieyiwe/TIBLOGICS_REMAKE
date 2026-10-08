"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

// Parent dashboard settings (/parent/[token]): confirm or restore access,
// boards, resend the email, revoke, ask for deletion. The server checks the
// link and every rule again (app/api/parent/[token]).
export default function ParentControls({
  token,
  stage,
  firstName,
  boards,
  deleteRequested,
}: {
  token: string;
  stage: "consent" | "revoked" | "active";
  firstName: string;
  boards: boolean;
  deleteRequested: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [allowBoards, setAllowBoards] = useState(boards);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function act(body: Record<string, unknown>, refresh = true): Promise<boolean> {
    setBusy(String(body.action));
    setMsg(null);
    const res = await fetch(`/api/parent/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(null);
    if (!res?.ok) {
      setMsg({ ok: false, text: data.error ?? t("learn.parent.err.failed") });
      return false;
    }
    setMsg({ ok: true, text: data.message ?? "" });
    if (refresh) router.refresh();
    return true;
  }

  const btn = "inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50";
  const btn2 = "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--s2)] disabled:opacity-50";
  const danger = "inline-flex min-h-[44px] items-center justify-center rounded-full border border-red-300 bg-white px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50";

  const status = msg && (
    <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
      {msg.text}
    </p>
  );

  if (deleteRequested) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        {status}
        <button type="button" className={btn2} disabled={busy !== null} onClick={() => act({ action: "resend" }, false)}>
          {t("learn.parent.resend")}
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {stage !== "active" && (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" data-testid="parent-agree" />
            <span className="text-sm leading-relaxed text-[var(--ink)]">{t("learn.parent.consent.agree", { name: firstName })}</span>
          </label>
          <div className="mt-4 space-y-3">
            {status}
            <button
              type="button"
              className={`${btn} w-full sm:w-auto`}
              disabled={!agree || busy !== null}
              onClick={() => act({ action: "consent", agree: true })}
              data-testid="parent-confirm"
            >
              {busy === "consent" ? t("learn.youth.saving") : t(stage === "revoked" ? "learn.parent.consent.restore" : "learn.parent.consent.confirm", { name: firstName })}
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="parent-settings" className="space-y-5 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <h2 id="parent-settings" className="text-base font-bold text-[var(--ink)]">{t("learn.parent.settings")}</h2>
        {stage === "active" && status}

        {stage === "active" && (
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={allowBoards}
              disabled={busy !== null}
              onChange={async (e) => {
                const next = e.target.checked;
                setAllowBoards(next);
                if (!(await act({ action: "boards", allow: next }, false))) setAllowBoards(!next);
              }}
              className="mt-1 h-5 w-5 shrink-0"
              data-testid="parent-boards"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--ink)]">{t("learn.parent.boards", { name: firstName })}</span>
              <span className="block text-xs leading-relaxed text-[var(--ink3)]">{t("learn.parent.boardsHint")}</span>
            </span>
          </label>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className={btn2} disabled={busy !== null} onClick={() => act({ action: "resend" }, false)} data-testid="parent-resend">
            {t("learn.parent.resend")}
          </button>
          {stage !== "revoked" &&
            (confirmRevoke ? (
              <button type="button" className={danger} disabled={busy !== null} onClick={() => act({ action: "revoke" })} data-testid="parent-revoke-confirm">
                {t("learn.parent.revokeConfirm", { name: firstName })}
              </button>
            ) : (
              <button type="button" className={danger} onClick={() => setConfirmRevoke(true)} data-testid="parent-revoke">
                {t("learn.parent.revoke")}
              </button>
            ))}
        </div>
        <p className="text-xs leading-relaxed text-[var(--ink3)]">{t("learn.parent.revokeHint", { name: firstName })}</p>

        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-bold text-[var(--ink)]">{t("learn.parent.delete")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink3)]">{t("learn.parent.deleteHint", { name: firstName })}</p>
          {confirmDelete ? (
            <button type="button" className={`${danger} mt-3`} disabled={busy !== null} onClick={() => act({ action: "delete", confirm: true })} data-testid="parent-delete-confirm">
              {t("learn.parent.deleteConfirm", { name: firstName })}
            </button>
          ) : (
            <button type="button" className={`${danger} mt-3`} onClick={() => setConfirmDelete(true)} data-testid="parent-delete">
              {t("learn.parent.delete")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
