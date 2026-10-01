"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { PeerState } from "@/lib/learn/community/peer";
import { LIMITS } from "@/lib/learn/community/shared";
import PostBody from "./PostBody";
import { api, ghostBtn, inputCls, primaryBtn } from "./client-utils";

// Capstone peer review, on the capstone page. Advisory: the official grade
// still comes from the staff review.

interface Criterion {
  criterion: string;
  description?: string | null;
}

function ReviewForm({ reviewId, rubric, onDone }: { reviewId: string; rubric: Criterion[]; onDone: () => void }) {
  const t = useT();
  const rows = rubric.length > 0 ? rubric : [{ criterion: t("community.peer.overall") }];
  const [items, setItems] = useState(rows.map(() => ({ rating: 0, text: "" })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = items.every((i) => i.text.trim().length >= LIMITS.peerFeedbackMin);

  async function send() {
    setBusy(true);
    setError(null);
    const r = await api("/api/learn/community/peer", "POST", {
      action: "submit",
      reviewId,
      feedback: items.map((i) => ({ rating: i.rating || null, text: i.text })),
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onDone();
  }

  return (
    <div className="mt-3 space-y-3">
      {rows.map((c, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-3">
          <p className="text-sm font-semibold text-[var(--ink)]">{c.criterion}</p>
          {c.description && <p className="mt-0.5 text-xs text-[var(--ink3)]">{c.description}</p>}
          <label className="mt-2 block text-xs font-semibold text-[var(--ink2)]">
            {t("community.peer.rating")}
            <select
              value={items[i].rating}
              onChange={(e) => setItems((v) => v.map((x, j) => (j === i ? { ...x, rating: Number(e.target.value) } : x)))}
              className={`${inputCls} mt-1 sm:w-48`}
            >
              <option value={0}>{t("community.peer.noRating")}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {t(`community.peer.stars.${n}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-2 block text-xs font-semibold text-[var(--ink2)]">
            {t("community.peer.feedback")}
            <textarea
              value={items[i].text}
              maxLength={LIMITS.peerFeedbackMax}
              rows={3}
              onChange={(e) => setItems((v) => v.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              placeholder={t("community.peer.feedbackPlaceholder")}
              className={`${inputCls} mt-1`}
            />
          </label>
          <p className="mt-1 text-[11px] text-[var(--ink3)]">
            {t("community.peer.chars", { n: items[i].text.trim().length, min: LIMITS.peerFeedbackMin })}
          </p>
        </div>
      ))}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <button type="button" onClick={send} disabled={busy || !ready} className={primaryBtn}>
        {t("community.peer.send")}
      </button>
    </div>
  );
}

export default function PeerReviewPanel({
  capstoneId,
  state,
  rubric,
}: {
  capstoneId: string;
  state: PeerState;
  rubric: Criterion[];
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<Set<string>>(new Set(state.received.filter((r) => r.helpful).map((r) => r.id)));
  const label = (i: number, fallback: string) => rubric[i]?.criterion ?? fallback;

  async function optIn() {
    setBusy(true);
    setError(null);
    const r = await api("/api/learn/community/peer", "POST", { action: "optin", capstoneId });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  }

  async function markHelpful(id: string) {
    const r = await api("/api/learn/community/peer", "POST", { action: "helpful", reviewId: id });
    if (r.ok) setHelpful((s) => new Set(s).add(id));
  }

  const pending = state.assigned.filter((a) => a.status === "assigned");

  return (
    <section aria-labelledby="peer-heading" className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
      <h2 id="peer-heading" className="text-base font-bold text-[var(--ink)]">
        <span aria-hidden="true">🤝 </span>
        {t("community.peer.title")}
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("community.peer.intro", { n: state.required })}</p>
      <p className="mt-2 rounded-lg bg-[var(--s2)] px-3 py-2 text-xs text-[var(--ink2)]">{t("community.peer.advisory")}</p>

      {!state.optedIn ? (
        <div className="mt-4">
          <button type="button" onClick={optIn} disabled={busy} className={primaryBtn}>
            {t("community.peer.optIn")}
          </button>
          {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      ) : (
        <>
          {/* Reviews to give */}
          <h3 className="mt-5 text-sm font-bold text-[var(--ink)]">
            {t("community.peer.toGive", { done: state.completed, n: state.required })}
          </h3>
          {state.assigned.length === 0 && <p className="mt-2 text-sm text-[var(--ink3)]">{t("community.peer.waitingForPeers")}</p>}
          <ol className="mt-2 space-y-4">
            {state.assigned.map((a, i) => (
              <li key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--s2)]/60 p-4">
                <p className="text-sm font-bold text-[var(--ink)]">
                  {t("community.peer.submissionN", { n: i + 1 })}
                  {a.status === "submitted" && <span className="ml-2 text-xs font-semibold text-green-700">✓ {t("community.peer.sent")}</span>}
                </p>
                {a.submissionUrl && (
                  <p className="mt-1 text-sm">
                    <a href={a.submissionUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-[var(--blue2)] underline [overflow-wrap:anywhere]">
                      {t("community.peer.openWork")} ↗
                    </a>
                  </p>
                )}
                {a.submissionMd && (
                  <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-3">
                    <PostBody source={a.submissionMd} />
                  </div>
                )}
                {a.status === "assigned" ? (
                  <ReviewForm reviewId={a.id} rubric={rubric} onDone={() => router.refresh()} />
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-[var(--ink2)]">
                    {a.feedback.map((f, j) => (
                      <li key={j}>
                        <strong>{label(j, f.criterion)}</strong>
                        {f.rating ? ` (${f.rating}/5)` : ""}: {f.text}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          {/* Feedback received */}
          <h3 className="mt-6 text-sm font-bold text-[var(--ink)]">{t("community.peer.received")}</h3>
          {!state.unlocked ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {pending.length > 0 || state.completed < state.required
                ? t("community.peer.locked", { n: state.waitingCount })
                : t("community.peer.waitingForPeers")}
            </p>
          ) : state.received.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ink3)]">{t("community.peer.noneYet")}</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {state.received.map((r) => (
                <li key={r.id} className="rounded-xl border border-[var(--border)] p-4">
                  <p className="text-sm font-bold text-[var(--ink)]">{t("community.peer.peerN", { n: r.label })}</p>
                  <ul className="mt-2 space-y-2">
                    {r.feedback.map((f, j) => (
                      <li key={j} className="text-sm text-[var(--ink2)]">
                        <span className="font-semibold text-[var(--ink)]">{label(j, f.criterion)}</span>
                        {f.rating ? <span className="ml-1 text-xs text-[var(--ink3)]">({f.rating}/5)</span> : null}
                        <span className="mt-0.5 block whitespace-pre-wrap">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    {helpful.has(r.id) ? (
                      <span className="text-xs font-semibold text-green-700">✓ {t("community.peer.markedHelpful")}</span>
                    ) : (
                      <button type="button" onClick={() => markHelpful(r.id)} className={ghostBtn}>
                        👍 {t("community.peer.helpful")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
