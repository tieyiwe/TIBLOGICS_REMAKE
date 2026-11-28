"use client";

import { useState } from "react";
import { Eye, RotateCcw, ThumbsUp } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Quick recall before a module quiz: one question at a time, the answer on
// request, then "I knew it" or "Review again". Nothing is saved: it is a
// warm-up, not a test.
export default function RecallCards({ cards, accentColor = "#F47C20" }: { cards: Array<{ q: string; a: string }>; accentColor?: string }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [knew, setKnew] = useState(0);
  const [again, setAgain] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  if (!cards.length) return null;

  const next = (gotIt: boolean) => {
    if (gotIt) setKnew((n) => n + 1);
    else setAgain((a) => [...a, i]);
    setShown(false);
    if (i + 1 < cards.length) setI(i + 1);
    else setDone(true);
  };
  const restart = () => {
    setI(0);
    setShown(false);
    setKnew(0);
    setAgain([]);
    setDone(false);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center" data-testid="recall-done">
        <p className="text-base font-bold text-[var(--ink)]">{t("learn.recap.score", { n: knew, total: cards.length })}</p>
        {again.length > 0 && (
          <ul className="mx-auto mt-3 max-w-lg space-y-2 text-left text-sm text-[var(--ink2)]">
            {again.map((k) => (
              <li key={k} className="rounded-xl bg-[var(--s2)] px-3 py-2">
                <b className="text-[var(--ink)]">{cards[k].q}</b>
                <br />
                {cards[k].a}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={restart} className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--s2)]">
          <RotateCcw size={14} aria-hidden /> {t("learn.recap.restart")}
        </button>
      </div>
    );
  }

  const c = cards[i];
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5" data-testid="recall-card">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink3)]">
        <span>{t("learn.recap.card", { i: i + 1, n: cards.length })}</span>
        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden>
          <span className="block h-full rounded-full" style={{ width: `${(i / cards.length) * 100}%`, background: accentColor }} />
        </span>
      </div>
      <p className="mt-3 text-base font-bold leading-snug text-[var(--ink)]">{c.q}</p>
      {shown ? (
        <>
          <p className="mt-3 rounded-xl bg-[var(--s2)] px-4 py-3 text-sm leading-relaxed text-[var(--ink2)]" data-testid="recall-answer">{c.a}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => next(true)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-bold text-white" style={{ background: accentColor }}>
              <ThumbsUp size={14} aria-hidden /> {t("learn.recap.knew")}
            </button>
            <button type="button" onClick={() => next(false)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--s2)]">
              <RotateCcw size={14} aria-hidden /> {t("learn.recap.again")}
            </button>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setShown(true)} className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--s2)]" data-testid="recall-show">
          <Eye size={14} aria-hidden /> {t("learn.recap.show")}
        </button>
      )}
    </div>
  );
}
