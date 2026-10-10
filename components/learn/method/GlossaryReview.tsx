"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";

// Glossary cards on the Daily Review page (lib/learn/glossary/review.ts):
// terms the learner opened in lessons. Front: the term; the learner recalls
// the meaning, reveals it, and says whether they knew it. Kept apart from
// the question cards, which are graded on the server and earn the day's XP.

interface Card {
  id: string;
  term: string;
  def: string;
  box: number;
}

type Phase = "intro" | "loading" | "card" | "done" | "error";

export default function GlossaryReview({ initialDue, total, nextDueAt }: { initialDue: number; total: number; nextDueAt: string | null }) {
  const t = useT();
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>("intro");
  const [due, setDue] = useState(initialDue);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [knew, setKnew] = useState(0);
  const termRef = useRef<HTMLHeadingElement>(null);
  const defRef = useRef<HTMLParagraphElement>(null);
  const card = cards[idx];

  useEffect(() => {
    if (phase === "card" && !revealed) termRef.current?.focus();
  }, [phase, idx, revealed]);
  useEffect(() => {
    if (revealed) defRef.current?.focus();
  }, [revealed]);

  async function load() {
    setPhase("loading");
    setError(null);
    const res = await fetch("/api/learn/review/glossary", { cache: "no-store" }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setError(typeof d.error === "string" ? d.error : t("method.glossary.error"));
      setPhase("error");
      return;
    }
    const list = (Array.isArray(d.cards) ? d.cards : []) as Card[];
    setCards(list);
    setDue(Number(d.due ?? list.length));
    setIdx(0);
    setKnew(0);
    setRevealed(false);
    setPhase(list.length ? "card" : "done");
  }

  async function grade(k: boolean) {
    if (!card || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/learn/review/glossary/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termId: card.id, knew: k }),
    }).catch(() => null);
    setBusy(false);
    // 404: already moved (another tab); carry on rather than block the learner.
    if (!res || (!res.ok && res.status !== 404)) {
      const d = res ? await res.json().catch(() => ({})) : {};
      setError(typeof d.error === "string" ? d.error : t("method.glossary.error"));
      return;
    }
    if (k) setKnew((n) => n + 1);
    setDue((n) => Math.max(0, n - 1));
    setRevealed(false);
    if (idx + 1 < cards.length) setIdx(idx + 1);
    else setPhase("done");
  }

  const shell = "rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7";
  const primary =
    "inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-2.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90 disabled:opacity-50";
  const secondary =
    "inline-flex min-h-[44px] items-center rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50";
  const fmtDue = (iso: string) => new Date(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  const dueLine =
    due > 0 ? t(due === 1 ? "method.glossary.due.one" : "method.glossary.due.other", { n: due }) : t("method.glossary.none");

  return (
    <section className={shell} aria-labelledby="glossary-review-title" data-testid="glossary-review">
      <h2 id="glossary-review-title" className="text-lg font-bold text-[var(--ink)]">
        <span aria-hidden="true">📖 </span>
        {t("method.glossary.title")}
      </h2>

      {phase !== "card" && (
        <>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{t(total > 0 ? "method.glossary.intro" : "method.glossary.empty")}</p>
          {total > 0 && (
            <p className="mt-3 text-sm font-bold text-[var(--ink)]" data-testid="glossary-due">
              {phase === "done" && cards.length > 0 && (
                <span className="mr-2 text-green-700">✓ {t("method.glossary.doneBody", { right: knew, total: cards.length })}</span>
              )}
              {dueLine}
            </p>
          )}
          {total > 0 && due === 0 && nextDueAt && phase === "intro" && (
            <p className="mt-1 text-xs text-[var(--ink3)]">{t("method.glossary.nextDue", { date: fmtDue(nextDueAt) })}</p>
          )}
          {due > 0 && (
            <button type="button" onClick={load} disabled={phase === "loading"} className={`${primary} mt-4`} data-testid="glossary-start">
              {phase === "loading" ? t("method.review.loading") : phase === "error" ? t("method.review.tryAgain") : t("method.glossary.start")}
            </button>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </>
      )}

      {phase === "card" && card && (
        <div className="mt-4" data-testid="glossary-card">
          <p className="text-xs font-semibold text-[var(--ink3)]">
            {t("method.glossary.progress", { n: idx + 1, total: cards.length })} · {t("method.review.box", { n: card.box })}
          </p>
          <div className="mt-3 rounded-xl bg-[var(--s2)] p-5 text-center">
            <h3 ref={termRef} tabIndex={-1} className="text-xl font-black text-[var(--ink)] outline-none">
              {card.term}
            </h3>
            {!revealed ? (
              <p className="mt-2 text-sm text-[var(--ink2)]">{t("method.glossary.prompt")}</p>
            ) : (
              <p ref={defRef} tabIndex={-1} className="mt-3 text-left text-[0.9375rem] leading-relaxed text-[var(--ink)] outline-none" data-testid="glossary-def">
                {card.def}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {!revealed ? (
              <button type="button" onClick={() => setRevealed(true)} className={primary} data-testid="glossary-reveal">
                {t("method.glossary.reveal")}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => grade(true)} disabled={busy} className={primary} data-testid="glossary-knew">
                  {t("method.glossary.knew")}
                </button>
                <button type="button" onClick={() => grade(false)} disabled={busy} className={secondary} data-testid="glossary-notyet">
                  {t("method.glossary.notYet")}
                </button>
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
