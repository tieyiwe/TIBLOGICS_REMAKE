"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import { KIND_ICON, RISK_DECKS, RISK_DECK_BY_ID, RISK_ICON, RISK_TYPES, type RiskCard, type RiskType } from "./risk/decks";
import { Btn, ChallengePicker, Stars, shuffle, starsFor, tx } from "./sorter/kit";

const NS = "studio.spot-the-risk";
const ENDLESS = "endless";
const LIVES = 3;

type Phase = "pick" | "intro" | "play" | "end";
type Choice = "safe" | "risky" | "timeout";
interface Answer {
  choice: Choice;
  type?: RiskType;
  correct: boolean;
  typeOk: boolean;
}

export default function SpotTheRisk({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const locale = useLocale();
  const reduce = useReducedMotion();
  const k = (s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v);

  const [deckId, setDeckId] = useState<string | null>(challengeId && RISK_DECK_BY_ID.has(challengeId) ? challengeId : null);
  const [phase, setPhase] = useState<Phase>(deckId ? "intro" : "pick");
  const [cards, setCards] = useState<RiskCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [limit, setLimit] = useState(12000);
  const [left, setLeft] = useState(12000);
  const [picking, setPicking] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; timeout: boolean; pts: number; bonus: boolean; key: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const locked = useRef(false);
  const reported = useRef(false);
  const lastTick = useRef(0);

  const mult = Math.min(4, 1 + Math.floor(streak / 3));
  const card = cards[idx];
  const isCodeDeck = deckId === "code";

  const begin = useCallback((id: string) => {
    const deck = RISK_DECK_BY_ID.get(id);
    const pool = deck ? deck.cards : RISK_DECKS.flatMap((d) => d.cards);
    const base = id === "code" ? 16000 : 12000;
    setDeckId(id);
    setCards(shuffle(pool));
    setIdx(0);
    setAnswers({});
    setLives(LIVES);
    setStreak(0);
    setBest(0);
    setScore(0);
    setLimit(base);
    setLeft(base);
    setPicking(false);
    setFlash(null);
    setShowAll(false);
    locked.current = false;
    reported.current = false;
    setPhase("play");
  }, []);

  const resolve = useCallback(
    (choice: Choice, type?: RiskType) => {
      if (phase !== "play" || !card || locked.current) return;
      locked.current = true;
      setPicking(false);
      const correct = choice !== "timeout" && (choice === "safe") === card.safe;
      const typeOk = correct && !card.safe && !!type && card.types.includes(type);
      const nextStreak = correct ? streak + 1 : 0;
      const m = Math.min(4, 1 + Math.floor(nextStreak / 3));
      const pts = correct ? 100 * m + (typeOk ? 50 * m : 0) : 0;
      const nextLives = correct ? lives : lives - 1;
      setAnswers((a) => ({ ...a, [card.id]: { choice, type, correct, typeOk } }));
      setStreak(nextStreak);
      setBest((b) => Math.max(b, nextStreak));
      setScore((s) => s + pts);
      setLives(nextLives);
      setFlash({ ok: correct, timeout: choice === "timeout", pts, bonus: typeOk, key: Date.now() });
      const last = idx + 1 >= cards.length;
      window.setTimeout(
        () => {
          setFlash(null);
          setDragX(0);
          if (nextLives <= 0 || last) {
            setPhase("end");
            return;
          }
          // Speed up: each card gets a little less time, down to half.
          const floor = (isCodeDeck ? 16000 : 12000) * 0.5;
          const nextLimit = Math.max(floor, Math.round(limit * 0.95));
          setLimit(nextLimit);
          setLeft(nextLimit);
          setIdx((i) => i + 1);
          locked.current = false;
        },
        reduce ? 600 : 900,
      );
    },
    [phase, card, streak, lives, idx, cards.length, limit, isCodeDeck, reduce],
  );

  // Card timer; paused while choosing a risk type or showing feedback.
  useEffect(() => {
    if (phase !== "play" || picking || flash) return;
    lastTick.current = Date.now();
    const h = window.setInterval(() => {
      const n = Date.now();
      const dt = n - lastTick.current;
      lastTick.current = n;
      setLeft((l) => Math.max(0, l - dt));
    }, 100);
    return () => window.clearInterval(h);
  }, [phase, picking, flash, idx]);

  useEffect(() => {
    if (phase === "play" && left <= 0 && !locked.current) resolve("timeout");
  }, [left, phase, resolve]);

  // Keyboard.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (picking) {
        const i = ["1", "2", "3", "4", "5", "6"].indexOf(e.key);
        if (i >= 0) {
          e.preventDefault();
          resolve("risky", RISK_TYPES[i]);
        } else if (e.key === "Enter" || e.key === "0") {
          e.preventDefault();
          resolve("risky");
        } else if (e.key === "Escape") {
          setPicking(false);
        }
        return;
      }
      if (flash) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        resolve("safe");
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        setPicking(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, picking, flash, resolve]);

  const summary = useMemo(() => {
    if (phase !== "end") return null;
    const right = cards.filter((c) => answers[c.id]?.correct).length;
    const ratio = cards.length ? right / cards.length : 0;
    return { right, ratio, stars: starsFor(ratio, [0.6, 0.8, 0.9]), outOfLives: lives <= 0 };
  }, [phase, cards, answers, lives]);

  useEffect(() => {
    if (!summary || reported.current || !deckId || deckId === ENDLESS) return;
    reported.current = true;
    if (summary.stars > 0) onComplete({ challengeId: deckId, stars: summary.stars as 1 | 2 | 3 });
  }, [summary, deckId, onComplete]);

  const deckName = (id: string) => k(`deck.${id}.name`);

  // ── Picker ────────────────────────────────────────────────────────────────
  if (phase === "pick") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink2)]">{k("pick")}</p>
        <ChallengePicker
          t={t}
          progress={progress}
          onPick={(id) => {
            setDeckId(id);
            setPhase("intro");
          }}
          items={[
            ...RISK_DECKS.map((d) => ({ id: d.id, icon: d.icon, name: deckName(d.id), sub: k(`deck.${d.id}.sub`), difficulty: d.difficulty })),
            { id: ENDLESS, icon: "♾️", name: k("deck.endless.name"), sub: k("deck.endless.sub") },
          ]}
        />
      </div>
    );
  }

  const deck = deckId ? RISK_DECK_BY_ID.get(deckId) : null;
  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="font-bold text-[var(--ink)]">
        <span aria-hidden="true">{deck?.icon ?? "♾️"}</span> {deckId ? deckName(deckId) : ""}
      </p>
      <button type="button" onClick={() => setPhase("pick")} className="text-xs font-semibold text-[var(--blue2)] underline">
        {k("change")}
      </button>
    </div>
  );

  const cardBody = (c: RiskCard, compact = false) => (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
        <span aria-hidden="true">{KIND_ICON[c.kind]}</span> {k(`kind.${c.kind}`)}
      </p>
      <p className={`mt-1.5 font-semibold leading-snug text-[var(--ink)] ${compact ? "text-sm" : "text-base sm:text-lg"}`}>{tx(c.text, locale)}</p>
      {c.code && (
        <pre className={`mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-[#0D1B2A] p-3 text-left font-mono leading-relaxed text-[#E6EDF6] ${compact ? "text-[11px]" : "text-xs sm:text-sm"}`}>
          <code>{c.code}</code>
        </pre>
      )}
    </>
  );

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === "intro" && deckId) {
    return (
      <div className="rounded-2xl bg-[var(--s2)] p-4 sm:p-6">
        {header}
        <p className="text-[var(--ink2)]">{k(`deck.${deckId}.sub`)}</p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--ink2)]">
          <li>
            <span aria-hidden="true">👈</span> <b className="text-emerald-700">{k("safe")}</b>: {k("safeHint")} · <span aria-hidden="true">👉</span>{" "}
            <b className="text-rose-700">{k("risky")}</b>: {k("riskyHint")}
          </li>
          <li>
            <span aria-hidden="true">🎯</span> {k("howtoType")}
          </li>
          <li>
            <span aria-hidden="true">❤️</span> {k("howtoLives", { n: LIVES })}
          </li>
          <li>
            <span aria-hidden="true">⚡</span> {k("howtoSpeed")}
          </li>
          <li className="text-xs text-[var(--ink3)]">{k("keys")}</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {RISK_TYPES.map((r) => (
            <span key={r} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink2)]">
              <span aria-hidden="true">{RISK_ICON[r]}</span> {k(`type.${r}`)}
            </span>
          ))}
        </div>
        {deckId === ENDLESS && <p className="mt-3 text-xs text-[var(--ink3)]">{k("endlessNote")}</p>}
        <Btn className="mt-4 w-full sm:w-auto" onClick={() => begin(deckId)}>
          ▶ {k("start")}
        </Btn>
      </div>
    );
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  if (phase === "play" && card) {
    const pct = limit ? left / limit : 0;
    const tilt = Math.max(-1, Math.min(1, dragX / 120));
    return (
      <div className={`rounded-2xl bg-[var(--s2)] p-3 sm:p-5 ${embedded ? "" : "min-h-[480px]"}`}>
        {header}
        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
          <span aria-label={k("livesLabel", { n: lives })} className="text-lg tracking-wider">
            {Array.from({ length: LIVES }, (_, i) => (
              <span key={i} aria-hidden="true" className={i < lives ? "" : "opacity-25 grayscale"}>
                ❤️
              </span>
            ))}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold" style={{ color: mult > 1 ? "#F47C20" : "var(--ink2)" }}>
            {mult > 1 ? "🔥 " : ""}
            {k("mult", { n: mult })}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--ink)]">
            {k("score")}: {score}
          </span>
        </div>
        <p className="mb-1 text-center text-xs text-[var(--ink3)]">{k("cardOf", { n: idx + 1, total: cards.length })}</p>
        <div
          className="mb-3 h-2 overflow-hidden rounded-full bg-white"
          role="timer"
          aria-label={k("timeLeft", { n: Math.ceil(left / 1000) })}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct * 100}%`, background: pct > 0.5 ? "#1F8A55" : pct > 0.25 ? "#F47C20" : "#E11D48", transition: reduce ? "none" : "width 100ms linear" }}
          />
        </div>

        <div className="relative">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={card.id}
              drag={picking || flash ? false : "x"}
              dragSnapToOrigin
              dragElastic={0.7}
              onDrag={(_, info) => setDragX(info.offset.x)}
              onDragEnd={(_, info) => {
                if (info.offset.x < -90) resolve("safe");
                else if (info.offset.x > 90) setPicking(true);
                setDragX(0);
              }}
              initial={reduce ? false : { y: 24, opacity: 0, scale: 0.96 }}
              animate={
                flash && !reduce
                  ? flash.ok
                    ? { scale: [1, 1.03, 1], opacity: 1, y: 0 }
                    : { x: [0, -10, 10, -6, 6, 0], opacity: 1, y: 0 }
                  : { y: 0, opacity: 1, scale: 1, rotate: reduce ? 0 : tilt * 4 }
              }
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
              className="relative touch-pan-y select-none rounded-2xl border-2 bg-white p-4 shadow-md sm:p-5"
              style={{
                borderColor: flash ? (flash.ok ? "#1F8A55" : "#E11D48") : tilt < -0.3 ? "#1F8A55" : tilt > 0.3 ? "#E11D48" : "#D2DCE8",
              }}
              aria-live="polite"
              data-card={card.id}
            >
              {cardBody(card)}
              <p className="mt-3 text-center text-[11px] text-[var(--ink3)]">↔ {k("swipeHint")}</p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {flash && (
              <motion.div
                key={flash.key}
                role="status"
                initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.15 }}
                className={`pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-black text-white shadow ${flash.ok ? "bg-emerald-600" : "bg-rose-600"}`}
              >
                {flash.timeout ? k("fb.timeout") : flash.ok ? k("fb.correct") : k("fb.wrong")}
                {flash.pts > 0 && ` +${flash.pts}`}
                {flash.bonus && ` 🎯`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {picking ? (
          <div className="mt-4 rounded-2xl border-2 border-rose-200 bg-white p-3" role="group" aria-label={k("pickType")}>
            <p className="mb-2 text-sm font-bold text-[var(--ink)]">{k("pickType")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RISK_TYPES.map((r, i) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => resolve("risky", r)}
                  className="min-h-[44px] rounded-xl border-2 border-[#D2DCE8] bg-[var(--s2)] px-2 py-2 text-sm font-semibold text-[var(--ink)] hover:border-[#F47C20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F47C20]"
                  aria-keyshortcuts={String(i + 1)}
                >
                  <span aria-hidden="true">{RISK_ICON[r]}</span> {k(`type.${r}`)}
                  <kbd className="ml-1 hidden text-[10px] text-[var(--ink3)] sm:inline">{i + 1}</kbd>
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Btn kind="soft" className="flex-1" onClick={() => resolve("risky")}>
                {k("skipType")}
              </Btn>
              <Btn kind="ghost" onClick={() => setPicking(false)}>
                {k("back")}
              </Btn>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!!flash}
              onClick={() => resolve("safe")}
              aria-keyshortcuts="ArrowLeft S"
              className="min-h-[64px] rounded-2xl border-2 border-emerald-600 bg-emerald-50 text-lg font-black text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 motion-reduce:transition-none"
            >
              👈 ✅ {k("safe")}
            </button>
            <button
              type="button"
              disabled={!!flash}
              onClick={() => setPicking(true)}
              aria-keyshortcuts="ArrowRight R"
              className="min-h-[64px] rounded-2xl border-2 border-rose-600 bg-rose-50 text-lg font-black text-rose-800 transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 motion-reduce:transition-none"
            >
              🚨 {k("risky")} 👉
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── End ───────────────────────────────────────────────────────────────────
  if (phase === "end" && summary && deckId) {
    const reached = cards.filter((c) => answers[c.id]);
    const misses = cards.filter((c) => !answers[c.id]?.correct);
    const answerLabel = (a?: Answer) => (!a ? k("answer.none") : a.choice === "timeout" ? k("answer.timeout") : k(`answer.${a.choice}`));
    const truth = (c: RiskCard) => (c.safe ? k("answer.safe") : `${k("answer.risky")}: ${c.types.map((r) => k(`type.${r}`)).join(" / ")}`);
    const nextDeck = RISK_DECKS.find((d) => d.id !== deckId && !progress[d.id]?.done);
    const listed = showAll ? cards : misses;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--s2)] p-4 text-center sm:p-6">
          {header}
          {deckId === ENDLESS ? (
            <p className="text-4xl" aria-hidden="true">
              🏁
            </p>
          ) : (
            <motion.div initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
              <Stars n={summary.stars} size="text-4xl" label={k("starsLabel", { n: summary.stars })} />
            </motion.div>
          )}
          <p className="mt-2 text-xl font-black text-[var(--ink)]">
            {deckId === ENDLESS ? k("end.endless", { n: reached.filter((c) => answers[c.id]?.correct).length }) : summary.stars > 0 ? (summary.outOfLives ? k("end.overPass") : k("end.title")) : k("end.fail")}
          </p>
          <dl className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 text-sm">
            {[
              [k("accuracy"), deckId === ENDLESS ? `${reached.length ? Math.round((reached.filter((c) => answers[c.id]?.correct).length / reached.length) * 100) : 0}%` : `${Math.round(summary.ratio * 100)}%`],
              [k("score"), String(score)],
              [k("best"), `x${best}`],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl bg-white p-2">
                <dt className="text-xs text-[var(--ink3)]">{a}</dt>
                <dd className="font-bold text-[var(--ink)]">{b}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section aria-labelledby="sr-misses">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 id="sr-misses" className="font-black text-[var(--ink)]">
              {showAll ? k("allCards") : k("misses.title", { n: misses.length })}
            </h3>
            <button type="button" onClick={() => setShowAll((s) => !s)} className="text-xs font-semibold text-[var(--blue2)] underline" aria-pressed={showAll}>
              {showAll ? k("showMisses") : k("showAll")}
            </button>
          </div>
          {listed.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">🎉 {k("misses.none")}</p>
          ) : (
            <ul className="space-y-2">
              {listed.map((c) => {
                const a = answers[c.id];
                const ok = !!a?.correct;
                return (
                  <li key={c.id} className={`rounded-2xl border-2 bg-white p-3 ${ok ? "border-emerald-200" : "border-rose-300"}`}>
                    {cardBody(c, true)}
                    <p className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${c.safe ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                        {k("rightAnswer")}: {truth(c)}
                      </span>
                      <span className="rounded-full bg-[var(--s2)] px-2 py-0.5 text-[var(--ink2)]">
                        {ok ? "✅" : "❌"} {k("you")}: {answerLabel(a)}
                        {a?.type ? ` (${k(`type.${a.type}`)}${a.typeOk ? " 🎯" : ""})` : ""}
                      </span>
                    </p>
                    <p className="mt-1.5 text-sm text-[var(--ink2)]">{tx(c.why, locale)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => begin(deckId)}>↻ {k("again")}</Btn>
          {nextDeck && deckId !== ENDLESS && (
            <Btn kind="ghost" onClick={() => { setDeckId(nextDeck.id); setPhase("intro"); }}>
              {k("next", { deck: deckName(nextDeck.id) })} →
            </Btn>
          )}
          <Btn kind="soft" onClick={() => setPhase("pick")}>
            {k("change")}
          </Btn>
        </div>
      </div>
    );
  }

  return null;
}
