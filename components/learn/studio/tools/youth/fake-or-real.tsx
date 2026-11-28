"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, RotateCcw, Timer, Trophy } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { type StudioGuide } from "../../StudioFrame";
import { Stars } from "../automation/ui";
import { DECKS, DECK_SECONDS, FAKE_ITEMS, KIND_ICON, VERDICT_ICON, type DeckId, type FakeItem, type Verdict } from "./fake-data";
import { SANDBOX, Y, YouthBar, YouthLocked, WhyBox, keys, loadLS, saveLS, shuffled, useChallengeFlow, type T } from "./kit";

// Fake or Real? A timed card game: read a headline, quote, chatbot answer or
// a described photo, video or voice clip, and pick Real, Fake or Need to
// check. Each answer reveals the verdict, the tell-tale clue and why. Picking
// "Need to check" is never reckless: it earns half credit on a card that had
// a clear answer. Stars come from accuracy at the end of the round.

const TOOL = "fake-or-real";
const NS = `studio.${TOOL}`;
const SCORES_KEY = "tib.studio.fake-or-real.scores";
const ICONS: Record<string, string> = { "warm-up": "🔥", "deepfake-tells": "🎭", "fact-check": "🔎" };
const PICKS: Verdict[] = ["real", "fake", "check"];
const SANDBOX_CARDS = 12;

type Phase = "intro" | "play" | "reveal" | "end";
type Pick = Verdict | "timeout";
interface Answer {
  pick: Pick;
  credit: 0 | 0.5 | 1;
  pts: number;
}

/** 1 right; 0.5 for "Need to check" on a card that had a clear answer; 0 otherwise. */
export function credit(pick: Pick, answer: Verdict): 0 | 0.5 | 1 {
  if (pick === answer) return 1;
  if (pick === "check") return 0.5;
  return 0;
}

export function accuracyStars(ratio: number): 0 | 1 | 2 | 3 {
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= 0.6) return 1;
  return 0;
}

const VERDICT_STYLE: Record<Verdict, string> = {
  real: "border-[#0F7B45] bg-[#E8F7EF] text-[#0B5A33]",
  fake: "border-[#D9480F] bg-[#FFF1EA] text-[#8A2E07]",
  check: "border-[#2251A3] bg-[#EBF0FA] text-[#1B3A6B]",
};

export default function FakeOrReal({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const reduce = !!useReducedMotion();
  const flow = useChallengeFlow({ tool: TOOL, ids: DECKS, challengeId, progress, onComplete });
  const deck = flow.mode as DeckId | typeof SANDBOX;

  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<FakeItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const limit = DECK_SECONDS[deck] * 1000;
  const [left, setLeft] = useState(limit);
  const [bests, setBests] = useState<Record<string, number>>(() => loadLS(SCORES_KEY, {}));
  const [claimed, setClaimed] = useState<{ stars: number; improved: boolean } | null>(null);
  const [newBest, setNewBest] = useState(false);
  const lastTick = useRef(0);
  const done = useRef(false);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const card = cards[idx];

  const pick = (id: string) => {
    flow.setMode(id);
    setPhase("intro");
    setClaimed(null);
    setNewBest(false);
  };

  const start = useCallback(() => {
    const pool = deck === SANDBOX ? shuffled(FAKE_ITEMS).slice(0, SANDBOX_CARDS) : shuffled(FAKE_ITEMS.filter((x) => x.deck === deck));
    setCards(pool);
    setIdx(0);
    setAnswers({});
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLeft(DECK_SECONDS[deck] * 1000);
    setClaimed(null);
    setNewBest(false);
    done.current = false;
    setPhase("play");
  }, [deck]);

  const resolve = useCallback(
    (p: Pick) => {
      if (phase !== "play" || !card) return;
      const c = credit(p, card.answer);
      const nextStreak = c === 1 ? streak + 1 : c === 0 ? 0 : streak;
      const pts = c === 1 ? 100 + Math.round((50 * left) / limit) + 10 * Math.min(nextStreak, 5) : c === 0.5 ? 40 : 0;
      setAnswers((a) => ({ ...a, [card.id]: { pick: p, credit: c, pts } }));
      setScore((s) => s + pts);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setPhase("reveal");
    },
    [phase, card, streak, left, limit],
  );

  const next = useCallback(() => {
    if (phase !== "reveal") return;
    if (idx + 1 >= cards.length) {
      setPhase("end");
      return;
    }
    setIdx((i) => i + 1);
    setLeft(limit);
    setPhase("play");
  }, [phase, idx, cards.length, limit]);

  // Focus follows the game: the Next button after an answer, the card after Next.
  useEffect(() => {
    if (phase === "reveal") nextBtn.current?.focus({ preventScroll: true });
    if (phase === "play") cardRef.current?.focus({ preventScroll: true });
  }, [phase, idx]);

  // Card timer (paused while the answer is shown).
  useEffect(() => {
    if (phase !== "play") return;
    lastTick.current = Date.now();
    const h = window.setInterval(() => {
      const n = Date.now();
      const dt = n - lastTick.current;
      lastTick.current = n;
      setLeft((l) => Math.max(0, l - dt));
    }, 100);
    return () => window.clearInterval(h);
  }, [phase, idx]);
  useEffect(() => {
    if (phase === "play" && left <= 0) resolve("timeout");
  }, [left, phase, resolve]);

  // Keyboard: 1/R real, 2/F fake, 3/C check; N (or Enter outside a button) next.
  useEffect(() => {
    if (phase !== "play" && phase !== "reveal") return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (phase === "play") {
        const i = ["1", "2", "3"].indexOf(key) >= 0 ? ["1", "2", "3"].indexOf(key) : ["r", "f", "c"].indexOf(key);
        if (i >= 0) {
          e.preventDefault();
          resolve(PICKS[i]);
        }
      } else if (key === "n" || (key === "enter" && tag !== "BUTTON" && tag !== "A")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, resolve, next]);

  const answered = cards.filter((c) => answers[c.id]);
  const creditSum = answered.reduce((s, c) => s + answers[c.id].credit, 0);
  const ratio = cards.length ? creditSum / cards.length : 0;
  const stars = accuracyStars(ratio);

  // End of round: save the best score and report stars once.
  useEffect(() => {
    if (phase !== "end" || done.current) return;
    done.current = true;
    if (score > (bests[deck] ?? 0)) {
      const nb = { ...bests, [deck]: score };
      setBests(nb);
      saveLS(SCORES_KEY, nb);
      setNewBest(true);
    }
    if (deck !== SANDBOX && stars > 0) {
      const improved = flow.claim(deck, stars);
      setClaimed({ stars, improved });
    } else {
      setClaimed({ stars, improved: false });
    }
  }, [phase, score, bests, deck, stars, flow]);

  // ── Toolbar, guide, live panel ───────────────────────────────────────────
  const toolbar = <YouthBar t={t} ns={NS} ids={DECKS} icons={ICONS} flow={flow} onPick={pick} />;

  const isChallenge = deck !== SANDBOX;
  const guide: StudioGuide = {
    goal: k(isChallenge ? `ch.${deck}.goal` : "sandboxGoal"),
    steps: keys(t, `${NS}.guide.s`),
    stars: [k("guide.star1"), k("guide.star2"), k("guide.star3")],
    tips: isChallenge ? keys(t, `${NS}.ch.${deck}.tip`) : keys(t, `${NS}.guide.tip`),
  };

  const live = (
    <div className="space-y-4 text-sm" data-testid="fr-live">
      <div className="grid grid-cols-2 gap-2">
        <Stat icon={<Trophy size={16} aria-hidden="true" />} label={k("score")} value={String(score)} testId="fr-score" />
        <Stat icon={<Flame size={16} aria-hidden="true" />} label={k("streak")} value={String(streak)} testId="fr-streak" />
        <Stat label={k("bestStreak")} value={String(bestStreak)} />
        <Stat label={k("bestScore")} value={String(bests[deck] ?? 0)} testId="fr-best" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("notebook")}</p>
        {answered.length === 0 ? (
          <p className="mt-1 text-[var(--ink3)]">{k("notebookEmpty")}</p>
        ) : (
          <ul className="mt-1 space-y-1.5">
            {answered.map((c) => (
              <li key={c.id} className="rounded-lg bg-[var(--s2)] px-2.5 py-1.5 text-xs text-[var(--ink2)]">
                <span aria-hidden="true">{VERDICT_ICON[c.answer]} </span>
                <strong className="text-[var(--ink)]">{k(`verdict.${c.answer}`)}:</strong> {k(`item.${c.id}.clue`)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-xl bg-[#EBF0FA] p-3 text-xs text-[#1B3A6B]">
        <p className="font-bold">{k("lateral.title")}</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          <li>{k("lateral.who")}</li>
          <li>{k("lateral.evidence")}</li>
          <li>{k("lateral.others")}</li>
        </ol>
      </div>
    </div>
  );

  const framed = (body: ReactNode) => (
    <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={k("liveTitle")}>
      {body}
    </StudioFrame>
  );

  if (flow.lockedBy) return framed(<YouthLocked t={t} ns={NS} flow={flow} onGo={pick} />);

  const deckTitle = isChallenge ? k(`ch.${deck}.title`) : t("studio.sandbox");
  const pct = Math.max(0, left / limit);
  const secs = Math.ceil(left / 1000);
  const a = card ? answers[card.id] : undefined;

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return framed(
      <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-4 text-center sm:p-6" data-testid="fr-intro">
        <p className="text-4xl" aria-hidden="true">{isChallenge ? ICONS[deck] : "🧪"}</p>
        <h2 className="mt-2 text-xl font-black text-[var(--ink)]">{deckTitle}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--ink2)]">{k(isChallenge ? `ch.${deck}.intro` : "sandboxIntro")}</p>
        <ul className="mx-auto mt-4 grid max-w-lg gap-2 text-left text-sm sm:grid-cols-3">
          {PICKS.map((p) => (
            <li key={p} className={`rounded-xl border-2 p-2.5 ${VERDICT_STYLE[p]}`}>
              <span className="font-black">
                <span aria-hidden="true">{VERDICT_ICON[p]}</span> {k(`pick.${p}`)}
              </span>
              <span className="mt-0.5 block text-xs">{k(`pickHelp.${p}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--ink3)]">{k("howScore", { s: DECK_SECONDS[deck] })}</p>
        {!embedded && <p className="mt-1 text-xs text-[var(--ink3)]">{k("keysHint")}</p>}
        <button
          type="button"
          onClick={start}
          className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#F47C20] px-6 py-2.5 text-base font-black text-white shadow hover:bg-[#E05F00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
          data-testid="fr-start"
        >
          ▶ {k("start")}
        </button>
      </section>,
    );
  }

  // ── End ──────────────────────────────────────────────────────────────────
  if (phase === "end") {
    const nextId = isChallenge ? flow.nextOf(deck) : null;
    const nextOpen = nextId && !flow.unlocks.lockedBy(nextId) ? nextId : null;
    return framed(
      <section className="space-y-3" data-testid="fr-end">
        <div className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-4 text-center sm:p-6" role="status" aria-live="polite">
          <Stars n={stars} size={30} label={t(`${Y}.starsN`, { n: stars })} />
          <p className="mt-2 text-lg font-black text-[var(--ink)]">{k(`end.${stars}`)}</p>
          <p className="mt-1 text-sm text-[var(--ink2)]" data-testid="fr-final">
            {k("end.summary", { score, pct: Math.round(ratio * 100), streak: bestStreak })}
          </p>
          {newBest && <p className="mt-1 text-sm font-bold text-[#C45A0A]">🏆 {k("end.newBest")}</p>}
          {claimed?.improved && <p className="mt-1 text-xs font-semibold text-[#C45A0A]">{t(`${Y}.newBest`)}</p>}
          {!isChallenge && <p className="mt-2 text-xs text-[var(--ink3)]">{k("end.practice")}</p>}
          {isChallenge && stars === 0 && <p className="mt-2 text-xs text-[var(--ink3)]">{k("end.again")}</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={start}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[#D2DCE8] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
              data-testid="fr-replay"
            >
              <RotateCcw size={15} aria-hidden="true" /> {k("again")}
            </button>
            {nextOpen && (
              <button
                type="button"
                onClick={() => pick(nextOpen)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0D1B2A] px-4 py-2 text-sm font-bold text-white hover:bg-[#1B3A6B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
                data-testid="youth-next"
              >
                {t(`${Y}.goTo`, { name: k(`ch.${nextOpen}.title`) })} →
              </button>
            )}
          </div>
        </div>
        <WhyBox t={t}>{k(isChallenge ? `ch.${deck}.insight` : "sandboxInsight")}</WhyBox>
        <ol className="space-y-1.5">
          {cards.map((c, i) => {
            const an = answers[c.id];
            return (
              <li key={c.id} className="rounded-xl border border-[#D2DCE8] bg-white p-2.5 text-xs text-[var(--ink2)]">
                <p className="font-bold text-[var(--ink)]">
                  {i + 1}. <span aria-hidden="true">{KIND_ICON[c.kind]}</span> {k(`item.${c.id}.text`)}
                </p>
                <p className="mt-0.5">
                  {k("end.row", {
                    you: an ? (an.pick === "timeout" ? k("timeout") : k(`pick.${an.pick}`)) : "–",
                    right: k(`pick.${c.answer}`),
                  })}{" "}
                  <span aria-hidden="true">{an?.credit === 1 ? "✅" : an?.credit === 0.5 ? "🟡" : "❌"}</span>
                  <span className="sr-only">{an?.credit === 1 ? k("result.right") : an?.credit === 0.5 ? k("result.careful") : k("result.wrong")}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </section>,
    );
  }

  // ── Play / reveal ────────────────────────────────────────────────────────
  if (!card) return framed(null);
  return framed(
    <div className="space-y-3" data-testid="fr-game">
      {/* Progress and timer */}
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--ink2)]">
        <span data-testid="fr-progress">{k("cardN", { n: idx + 1, total: cards.length })}</span>
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1" aria-label={k("streak")}>
            <Flame size={14} className="text-[#E05F00]" aria-hidden="true" /> {streak}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy size={14} className="text-[#D99A00]" aria-hidden="true" /> {score}
          </span>
        </span>
      </div>
      <ol className="flex gap-1" aria-hidden="true">
        {cards.map((c, i) => {
          const an = answers[c.id];
          return (
            <li
              key={c.id}
              className={`flex h-5 flex-1 items-center justify-center rounded text-[10px] font-black ${
                an ? (an.credit === 1 ? "bg-[#0F7B45] text-white" : an.credit === 0.5 ? "bg-[#F5B400] text-[#4A3500]" : "bg-[#D9480F] text-white") : i === idx ? "bg-[#F47C20]/30" : "bg-[#E8EFF8]"
              }`}
            >
              {an ? (an.credit === 1 ? "✓" : an.credit === 0.5 ? "~" : "✗") : ""}
            </li>
          );
        })}
      </ol>
      {phase === "play" && (
        <div data-testid="fr-timer">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--ink2)]">
            <span className="inline-flex items-center gap-1">
              <Timer size={14} aria-hidden="true" /> {k("timeLeft")}
            </span>
            <span className={`tabular-nums ${secs <= 5 ? "text-[#B91C1C]" : ""}`}>{k("secs", { n: secs })}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E8EFF8]" aria-hidden="true">
            <div
              className={`h-full rounded-full ${pct < 0.25 ? "bg-[#D9480F]" : "bg-[#F47C20]"} ${reduce ? "" : "transition-[width] duration-100 ease-linear"}`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* The card */}
      <motion.div
        key={card.id}
        ref={cardRef}
        tabIndex={-1}
        initial={reduce ? false : { opacity: 0, y: 12, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-4 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
        data-testid="fr-card"
        data-item={card.id}
        aria-label={k("cardLabel", { kind: k(`kind.${card.kind}`) })}
      >
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
          <span className="rounded-full bg-[var(--s2)] px-2 py-0.5 text-[var(--ink2)]">
            <span aria-hidden="true">{KIND_ICON[card.kind]}</span> {k(`kind.${card.kind}`)}
          </span>
          <span className="normal-case tracking-normal">{k("from", { src: card.src })}</span>
        </p>
        {card.scene && (
          <div className="mt-3 rounded-xl bg-gradient-to-br from-[#0D1B2A] to-[#1B3A6B] p-4 text-center" role="img" aria-label={k("sceneLabel")}>
            <span className="text-4xl tracking-widest sm:text-5xl" aria-hidden="true">
              {card.scene}
            </span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-white/70">{k(`sceneNote.${card.kind}`)}</span>
          </div>
        )}
        <p className={`mt-3 font-bold leading-snug text-[var(--ink)] ${card.kind === "headline" ? "text-lg" : "text-base"}`}>
          {card.kind === "quote" || card.kind === "chatbot" ? `“${k(`item.${card.id}.text`)}”` : k(`item.${card.id}.text`)}
        </p>
      </motion.div>

      {phase === "play" ? (
        <div className="grid grid-cols-3 gap-2" role="group" aria-label={k("pickLabel")}>
          {PICKS.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => resolve(p)}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-2xl border-2 px-1 py-2 text-sm font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2 ${VERDICT_STYLE[p]} hover:brightness-95`}
              data-testid={`fr-answer-${p}`}
            >
              <span className="text-xl" aria-hidden="true">{VERDICT_ICON[p]}</span>
              <span>{k(`pick.${p}`)}</span>
              {!embedded && <span className="hidden text-[10px] font-semibold opacity-70 sm:block">{k("key", { n: i + 1 })}</span>}
            </button>
          ))}
        </div>
      ) : (
        a && (
          <motion.section
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border-2 p-3 ${VERDICT_STYLE[card.answer]}`}
            data-testid="fr-reveal"
            data-verdict={card.answer}
            data-credit={a.credit}
            aria-live="polite"
          >
            <p className="text-base font-black">
              {a.pick === "timeout" ? `⏰ ${k("result.timeout")}` : a.credit === 1 ? `🎉 ${k("result.right")}` : a.credit === 0.5 ? `🟡 ${k("result.careful")}` : `🙈 ${k("result.wrong")}`}{" "}
              {a.pts > 0 && <span className="text-sm font-bold">+{a.pts}</span>}
            </p>
            <p className="mt-1 text-sm font-bold">
              {k("itWas")} <span aria-hidden="true">{VERDICT_ICON[card.answer]}</span> {k(`verdict.${card.answer}`)}
            </p>
            {a.credit === 0.5 && <p className="mt-1 text-xs">{k("carefulNote")}</p>}
            <div className="mt-2 rounded-xl bg-white/80 p-3 text-sm text-[var(--ink)]">
              <p>
                <strong>🔎 {k("clue")}</strong> {k(`item.${card.id}.clue`)}
              </p>
              <p className="mt-1.5 text-[var(--ink2)]">
                <strong className="text-[var(--ink)]">💡 {t(`${Y}.why`)}:</strong> {k(`item.${card.id}.why`)}
              </p>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                ref={nextBtn}
                type="button"
                onClick={next}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0D1B2A] px-5 py-2 text-sm font-bold text-white hover:bg-[#1B3A6B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
                data-testid="fr-next"
              >
                {idx + 1 >= cards.length ? k("finish") : k("nextCard")} →
              </button>
            </div>
          </motion.section>
        )
      )}
    </div>,
  );
}

function Stat({ icon, label, value, testId }: { icon?: ReactNode; label: string; value: string; testId?: string }) {
  return (
    <div className="rounded-xl bg-[var(--s2)] p-2.5">
      <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
        {icon} {label}
      </p>
      <p className="text-xl font-black tabular-nums text-[var(--ink)]" data-testid={testId}>
        {value}
      </p>
    </div>
  );
}
