"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { useLocale, useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import { BUCKETS, DECKS, DECK_BY_ID, SAVE_FACTOR, type Bucket, type SortCard } from "./sorter/decks";
import { Btn, ChallengePicker, Stars, shuffle, starsFor, tx } from "./sorter/kit";

const NS = "studio.task-sorter";
const MIX = "mix";
const BUCKET_ICON: Record<Bucket, string> = { automate: "⚙️", augment: "🤝", human: "💛" };
const BUCKET_TINT: Record<Bucket, string> = { automate: "#E8F0FC", augment: "#FDEBDC", human: "#E7F6EE" };
const BUCKET_EDGE: Record<Bucket, string> = { automate: "#2251A3", augment: "#F47C20", human: "#1F8A55" };

type Phase = "pick" | "intro" | "play" | "result";
type Verdict = "yes" | "half" | "no";

const verdict = (c: SortCard, b: Bucket): Verdict => (b === c.bucket ? "yes" : b === c.alt ? "half" : "no");

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function TaskSorter({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const locale = useLocale();
  const reduce = useReducedMotion();
  const k = (s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v);

  const [deckId, setDeckId] = useState<string | null>(challengeId && DECK_BY_ID.has(challengeId) ? challengeId : null);
  const [phase, setPhase] = useState<Phase>(deckId ? "intro" : "pick");
  const [cards, setCards] = useState<SortCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Bucket>>({});
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [cardStart, setCardStart] = useState(0);
  const [flash, setFlash] = useState<{ v: Verdict; pts: number; key: number } | null>(null);
  const [hover, setHover] = useState<Bucket | null>(null);
  const reported = useRef(false);
  const bucketRefs = useRef<Record<Bucket, HTMLButtonElement | null>>({ automate: null, augment: null, human: null });

  const begin = useCallback((id: string) => {
    const deck = DECK_BY_ID.get(id);
    const pool = deck ? deck.cards : shuffle(DECKS.flatMap((d) => d.cards)).slice(0, 10);
    setDeckId(id);
    setCards(shuffle(pool));
    setIdx(0);
    setAnswers({});
    setStreak(0);
    setBest(0);
    setScore(0);
    setFlash(null);
    const n = Date.now();
    setStart(n);
    setNow(n);
    setCardStart(n);
    reported.current = false;
    setPhase("play");
  }, []);

  // Clock.
  useEffect(() => {
    if (phase !== "play") return;
    const h = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(h);
  }, [phase]);

  const place = useCallback(
    (b: Bucket) => {
      if (phase !== "play") return;
      const card = cards[idx];
      if (!card || answers[card.id]) return;
      const v = verdict(card, b);
      const secs = (Date.now() - cardStart) / 1000;
      const nextStreak = v === "yes" ? streak + 1 : v === "half" ? streak : 0;
      const speed = v === "no" ? 0 : Math.max(0, Math.round(50 - secs * 5));
      const pts = v === "yes" ? 100 + speed + Math.min(nextStreak, 10) * 20 : v === "half" ? 50 + speed : 0;
      setAnswers((a) => ({ ...a, [card.id]: b }));
      setStreak(nextStreak);
      setBest((x) => Math.max(x, nextStreak));
      setScore((s) => s + pts);
      setFlash({ v, pts, key: Date.now() });
      setHover(null);
      const n = Date.now();
      setCardStart(n);
      if (idx + 1 >= cards.length) {
        setNow(n);
        window.setTimeout(() => setPhase("result"), reduce ? 50 : 450);
      } else {
        setIdx(idx + 1);
      }
    },
    [phase, cards, idx, answers, cardStart, streak, reduce],
  );

  // Hide the feedback bubble after a moment.
  useEffect(() => {
    if (!flash) return;
    const h = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(h);
  }, [flash]);

  // Keyboard: 1 / 2 / 3.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const i = ["1", "2", "3"].indexOf(e.key);
      if (i >= 0) {
        e.preventDefault();
        place(BUCKETS[i]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, place]);

  const bucketAt = (info: PanInfo): Bucket | null => {
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    for (const b of BUCKETS) {
      const r = bucketRefs.current[b]?.getBoundingClientRect();
      if (r && x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 16 && y <= r.bottom + 8) return b;
    }
    return null;
  };

  // Results.
  const result = useMemo(() => {
    if (phase !== "result") return null;
    let pts = 0;
    let total = 0;
    let recSaved = 0;
    let yourSaved = 0;
    for (const c of cards) {
      const a = answers[c.id];
      const v = a ? verdict(c, a) : "no";
      pts += v === "yes" ? 1 : v === "half" ? 0.5 : 0;
      total += c.hrs;
      recSaved += c.hrs * SAVE_FACTOR[c.bucket];
      if (a) yourSaved += c.hrs * SAVE_FACTOR[a];
    }
    const ratio = cards.length ? pts / cards.length : 0;
    const byBucket = BUCKETS.map((b) => cards.filter((c) => c.bucket === b).reduce((s, c) => s + c.hrs, 0));
    return { ratio, stars: starsFor(ratio, [0.5, 0.7, 0.9]), total, recSaved, yourSaved, byBucket };
  }, [phase, cards, answers]);

  useEffect(() => {
    if (!result || reported.current || !deckId || deckId === MIX) return;
    reported.current = true;
    if (result.stars > 0) onComplete({ challengeId: deckId, stars: result.stars as 1 | 2 | 3 });
  }, [result, deckId, onComplete]);

  const hrs = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });
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
            ...DECKS.map((d) => ({ id: d.id, icon: d.icon, name: deckName(d.id), sub: k(`deck.${d.id}.sub`), difficulty: d.difficulty })),
            { id: MIX, icon: "🎲", name: k("deck.mix.name"), sub: k("deck.mix.sub") },
          ]}
        />
      </div>
    );
  }

  const deck = deckId ? DECK_BY_ID.get(deckId) : null;
  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="font-bold text-[var(--ink)]">
        <span aria-hidden="true">{deck?.icon ?? "🎲"}</span> {deckId ? deckName(deckId) : ""}
      </p>
      <button type="button" onClick={() => setPhase("pick")} className="text-xs font-semibold text-[var(--blue2)] underline">
        {k("change")}
      </button>
    </div>
  );

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === "intro" && deckId) {
    const n = deck ? deck.cards.length : 10;
    return (
      <div className="rounded-2xl bg-[var(--s2)] p-4 sm:p-6">
        {header}
        <p className="text-[var(--ink2)]">{deckId === MIX ? k("deck.mix.sub") : k(`deck.${deckId}.sub`)}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {BUCKETS.map((b, i) => (
            <li key={b} className="rounded-2xl border-2 bg-white p-3" style={{ borderColor: BUCKET_EDGE[b] }}>
              <p className="font-bold text-[var(--ink)]">
                <span aria-hidden="true">{BUCKET_ICON[b]}</span> {i + 1}. {k(`bucket.${b}`)}
              </p>
              <p className="mt-1 text-xs text-[var(--ink2)]">{k(`bucket.${b}.hint`)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--ink2)]">{k("howto", { n })}</p>
        {progress[deckId]?.done && (
          <p className="mt-2 text-sm">
            {progress[deckId]?.perfect ? <Stars n={3} size="text-sm" label={t("studio.perfect")} /> : <span className="font-semibold text-emerald-700">✓ {t("studio.done")}</span>}
          </p>
        )}
        <Btn className="mt-4 w-full sm:w-auto" onClick={() => begin(deckId)}>
          ▶ {k("start")}
        </Btn>
      </div>
    );
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  if (phase === "play") {
    const card = cards[idx];
    const done = Object.keys(answers).length;
    return (
      <div className={`rounded-2xl bg-[var(--s2)] p-3 sm:p-5 ${embedded ? "" : "min-h-[480px]"}`}>
        {header}
        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs" aria-live="off">
          <div className="rounded-xl bg-white px-2 py-1.5">
            <span className="block text-[var(--ink3)]">{k("time")}</span>
            <span className="font-mono text-base font-bold text-[var(--ink)]">⏱ {fmtTime(now - start)}</span>
          </div>
          <div className="rounded-xl bg-white px-2 py-1.5">
            <span className="block text-[var(--ink3)]">{k("combo")}</span>
            <motion.span
              key={streak}
              initial={reduce ? false : { scale: 1.5 }}
              animate={{ scale: 1 }}
              className="inline-block text-base font-black"
              style={{ color: streak >= 3 ? "#F47C20" : "var(--ink)" }}
            >
              {streak >= 3 ? "🔥 " : ""}x{streak}
            </motion.span>
          </div>
          <div className="rounded-xl bg-white px-2 py-1.5">
            <span className="block text-[var(--ink3)]">{k("score")}</span>
            <span className="text-base font-bold text-[var(--ink)]">{score}</span>
          </div>
        </div>
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={done} aria-label={k("cardOf", { n: Math.min(idx + 1, cards.length), total: cards.length })}>
          <div className="h-full rounded-full bg-[#F47C20] transition-all motion-reduce:transition-none" style={{ width: `${(done / cards.length) * 100}%` }} />
        </div>
        <p className="mb-2 text-center text-xs text-[var(--ink3)]">{k("cardOf", { n: Math.min(idx + 1, cards.length), total: cards.length })}</p>

        <div className="relative flex min-h-[150px] items-center justify-center">
          <AnimatePresence mode="popLayout">
            {card && !answers[card.id] && (
              <motion.div
                key={card.id}
                drag
                dragSnapToOrigin
                dragElastic={0.6}
                whileDrag={{ scale: 1.04, rotate: reduce ? 0 : 3, zIndex: 20 }}
                onDrag={(_, info) => setHover(bucketAt(info))}
                onDragEnd={(_, info) => {
                  const b = bucketAt(info);
                  setHover(null);
                  if (b) place(b);
                }}
                initial={reduce ? false : { y: -30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
                className="w-full max-w-md cursor-grab touch-none select-none rounded-2xl border-2 border-[var(--border)] bg-white p-5 text-center shadow-md active:cursor-grabbing"
                role="group"
                aria-label={tx(card.task, locale)}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{k("taskLabel")}</p>
                <p className="mt-2 text-lg font-bold leading-snug text-[var(--ink)]">{tx(card.task, locale)}</p>
                <p className="mt-3 text-[11px] text-[var(--ink3)]">✋ {k("dragHint")}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {flash && (
              <motion.div
                key={flash.key}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
                className={`pointer-events-none absolute -top-2 right-0 rounded-full px-3 py-1 text-xs font-bold text-white ${flash.v === "yes" ? "bg-emerald-600" : flash.v === "half" ? "bg-amber-500" : "bg-rose-600"}`}
              >
                {k(`fb.${flash.v}`)} {flash.pts > 0 ? `+${flash.pts}` : ""}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {flash ? k(`fb.${flash.v}`) : ""}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {BUCKETS.map((b, i) => (
            <button
              key={b}
              ref={(el) => {
                bucketRefs.current[b] = el;
              }}
              type="button"
              onClick={() => place(b)}
              aria-label={`${i + 1}. ${k(`bucket.${b}`)}: ${k(`bucket.${b}.hint`)}`}
              aria-keyshortcuts={String(i + 1)}
              className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C20] motion-reduce:transition-none"
              style={{
                background: BUCKET_TINT[b],
                borderColor: BUCKET_EDGE[b],
                borderStyle: hover === b ? "solid" : "dashed",
                transform: hover === b && !reduce ? "scale(1.05)" : undefined,
              }}
            >
              <span aria-hidden="true" className="text-2xl">
                {BUCKET_ICON[b]}
              </span>
              <span className="mt-1 text-sm font-bold leading-tight text-[var(--ink)]">{k(`bucket.${b}`)}</span>
              <span className="mt-0.5 hidden text-[11px] leading-tight text-[var(--ink2)] sm:block">{k(`bucket.${b}.hint`)}</span>
              <kbd className="mt-1 hidden rounded border border-[var(--border)] bg-white px-1 text-[10px] text-[var(--ink3)] sm:inline">{i + 1}</kbd>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (phase === "result" && result && deckId) {
    const ordered = [...cards].sort((a, b) => {
      const va = verdict(a, answers[a.id]);
      const vb = verdict(b, answers[b.id]);
      const rank = { no: 0, half: 1, yes: 2 };
      return rank[va] - rank[vb];
    });
    const nextDeck = DECKS.find((d) => d.id !== deckId && !progress[d.id]?.done);
    const maxH = Math.max(result.total, 0.1);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--s2)] p-4 text-center sm:p-6">
          {header}
          <motion.div initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
            <Stars n={result.stars} size="text-4xl" label={k("starsLabel", { n: result.stars })} />
          </motion.div>
          <p className="mt-2 text-xl font-black text-[var(--ink)]">{result.stars > 0 ? k("result.title") : k("result.fail")}</p>
          <dl className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {[
              [k("result.accuracy"), `${Math.round(result.ratio * 100)}%`],
              [k("score"), String(score)],
              [k("time"), fmtTime(now - start)],
              [k("result.best"), `x${best}`],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl bg-white p-2">
                <dt className="text-xs text-[var(--ink3)]">{a}</dt>
                <dd className="font-bold text-[var(--ink)]">{b}</dd>
              </div>
            ))}
          </dl>
          {deckId === MIX && <p className="mt-3 text-xs text-[var(--ink3)]">{k("mixNote")}</p>}
        </div>

        <section className="rounded-2xl border-2 border-[#F47C20]/40 bg-white p-4 sm:p-5" aria-labelledby="ts-week">
          <h3 id="ts-week" className="font-black text-[var(--ink)]">
            <span aria-hidden="true">📅</span> {k("week.title")}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {k("week.body", { n: cards.length, total: hrs(result.total), saved: hrs(result.recSaved) })}
          </p>
          <div className="mt-3 flex h-6 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden="true">
            {BUCKETS.map((b, i) => (
              <div key={b} style={{ width: `${(result.byBucket[i] / maxH) * 100}%`, background: BUCKET_EDGE[b] }} />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink2)]">
            {BUCKETS.map((b, i) => (
              <li key={b}>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: BUCKET_EDGE[b] }} />
                {k(`bucket.${b}`)}: {hrs(result.byBucket[i])} h
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{k("week.yours", { n: hrs(result.yourSaved) })}</p>
          <p className="mt-2 text-xs italic text-[var(--ink3)]">{k("week.note")}</p>
        </section>

        <section aria-labelledby="ts-review">
          <h3 id="ts-review" className="mb-2 font-black text-[var(--ink)]">
            {k("review.title")}
          </h3>
          <ul className="space-y-2">
            {ordered.map((c) => {
              const a = answers[c.id];
              const v = verdict(c, a);
              return (
                <li key={c.id} className={`rounded-2xl border-2 bg-white p-3 ${v === "yes" ? "border-emerald-200" : v === "half" ? "border-amber-300" : "border-rose-300"}`}>
                  <p className="font-bold text-[var(--ink)]">
                    <span aria-hidden="true">{v === "yes" ? "✅" : v === "half" ? "🟡" : "❌"}</span> {tx(c.task, locale)}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: BUCKET_TINT[c.bucket], color: "var(--ink)" }}>
                      {k("review.rec")}: {BUCKET_ICON[c.bucket]} {k(`bucket.${c.bucket}`)}
                    </span>
                    {a && a !== c.bucket && (
                      <span className="rounded-full bg-[var(--s2)] px-2 py-0.5 text-[var(--ink2)]">
                        {k("review.you")}: {k(`bucket.${a}`)}
                      </span>
                    )}
                    {c.alt && <span className="rounded-full bg-[var(--s2)] px-2 py-0.5 text-[var(--ink2)]">{k("review.alt", { b: k(`bucket.${c.alt}`) })}</span>}
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--ink2)]">{tx(c.why, locale)}</p>
                  <p className="mt-1 text-sm text-[var(--ink2)]">
                    <span className="font-semibold text-rose-700">{k("review.risk")}</span> {tx(c.risk, locale)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => begin(deckId)}>↻ {k("again")}</Btn>
          {nextDeck && deckId !== MIX && (
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
