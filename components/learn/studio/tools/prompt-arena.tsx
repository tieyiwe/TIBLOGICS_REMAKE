"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flame, Heart, Swords } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { promptArena } from "@/lib/learn/studio/tools/prompt-arena";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { useStudioLayout, type StudioGuide } from "../StudioFrame";
import { LEAGUES, TAGS, gradeTags, strongSide, type Round, type Tag } from "./prompts/arena-data";
import {
  BTN_PRIMARY,
  CHIP,
  ChallengeBar,
  Illustrative,
  LockedNotice,
  NewBadge,
  ReplyBubble,
  ResultCard,
  TryForReal,
  nextChallenge,
  useChallengeFlow,
  useDebounced,
  useFresh,
} from "./prompts/ui";

const NS = "studio.prompt-arena";
const FIXES = ["fix1", "fix2", "fix3"] as const;

export default function PromptArena({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const flow = useChallengeFlow({ toolId: promptArena.id, challenges: promptArena.challenges, challengeId, progress, freePlay: false, onComplete });
  const [run, setRun] = useState(0);
  const toolbar = <ChallengeBar ns={NS} flow={flow} compact={embedded} />;
  const league = flow.current && LEAGUES[flow.current] ? flow.current : null;
  if (!league || flow.isLocked(league)) {
    return (
      <div className="space-y-3">
        {toolbar}
        {league && <LockedNotice ns={NS} flow={flow} id={league} />}
      </div>
    );
  }
  return (
    <League
      key={`${league}-${run}`}
      leagueId={league}
      toolbar={toolbar}
      onRetry={() => setRun((r) => r + 1)}
      onNext={(id) => flow.pick(id)}
      onComplete={flow.complete}
    />
  );
}

type Stage = "pick" | "tag" | "fix";
type Outcome = "perfect" | "ok" | "miss";

interface Chip {
  id: string;
  text: string;
  decoy: boolean;
}

function useChips(round: Round): Chip[] {
  const t = useT();
  return useMemo(() => {
    const list: Chip[] = [
      { id: "fix1", text: t(`${NS}.r.${round.id}.fix1`), decoy: false },
      { id: "fix2", text: t(`${NS}.r.${round.id}.fix2`), decoy: false },
      { id: "decoy", text: t(`${NS}.decoy.${round.decoy}`), decoy: true },
      { id: "fix3", text: t(`${NS}.r.${round.id}.fix3`), decoy: false },
    ];
    // Put the decoy in a different place each round.
    const at = (round.id.length + round.decoy) % 4;
    const d = list.splice(2, 1)[0];
    list.splice(at, 0, d);
    return list;
  }, [round, t]);
}

function League({
  leagueId,
  toolbar,
  onRetry,
  onNext,
  onComplete,
}: {
  leagueId: string;
  toolbar: ReactNode;
  onRetry: () => void;
  onNext: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const layout = useStudioLayout();
  const rounds = LEAGUES[leagueId];
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [stage, setStage] = useState<Stage>("pick");
  const [picked, setPicked] = useState<"A" | "B" | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagResult, setTagResult] = useState<ReturnType<typeof gradeTags> | null>(null);
  const [finished, setFinished] = useState<"won" | "lost" | null>(null);
  const [pickRight, setPickRight] = useState(false);
  const [history, setHistory] = useState<Outcome[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [text, setText] = useState(() => t(`${NS}.r.${rounds[0].id}.weak`));

  const round = rounds[idx];
  const strong = strongSide(round.id);
  const k = (s: string) => t(`${NS}.r.${round.id}.${s}`);
  const next = nextChallenge(promptArena.challenges, leagueId);
  const chips = useChips(round);
  const liveUsed = useDebounced(used, 300);
  const liveTags = useDebounced(tags, 300);

  function loseLife() {
    const n = lives - 1;
    setLives(n);
    if (n <= 0) setFinished("lost");
  }

  function pick(side: "A" | "B") {
    setPicked(side);
    const ok = side === strong;
    setPickRight(ok);
    if (!ok) {
      setStreak(0);
      loseLife();
    }
    setStage("tag");
  }

  function checkTags() {
    const g = gradeTags(tags, round.tags);
    setTagResult(g);
    setHistory((h) => [...h, g.good && pickRight ? (g.perfect ? "perfect" : "ok") : "miss"]);
    if (!g.good) {
      setStreak(0);
      loseLife();
    } else if (g.perfect && pickRight) {
      const n = streak + 1;
      setStreak(n);
      setBest((b) => Math.max(b, n));
    }
  }

  function toggleChip(c: Chip) {
    if (used.includes(c.id)) {
      setUsed((u) => u.filter((x) => x !== c.id));
      setText((s) => s.replace(`\n${c.text}`, "").replace(c.text, ""));
    } else {
      setUsed((u) => [...u, c.id]);
      setText((s) => `${s.trimEnd()}\n${c.text}`);
    }
  }

  function nextRound() {
    if (idx === rounds.length - 1) {
      setFinished("won");
      const stars = Math.max(1, Math.min(3, lives)) as 1 | 2 | 3;
      onComplete({ challengeId: leagueId, stars });
      return;
    }
    const n = idx + 1;
    setIdx(n);
    setStage("pick");
    setPicked(null);
    setTags([]);
    setTagResult(null);
    setPickRight(false);
    setUsed([]);
    setText(t(`${NS}.r.${rounds[n].id}.weak`));
  }

  const G = `${NS}.guide`;
  const guide: StudioGuide = {
    goal: t(`${G}.goal.${leagueId}`),
    steps: [1, 2, 3, 4, 5, 6].map((i) => t(`${G}.step${i}`)),
    stars: [t(`${G}.star1`), t(`${G}.star2`), t(`${G}.star3`)],
    tips: [t(`${G}.tip.${leagueId}`), t(`${G}.tip.decoy`)],
  };

  const hud = (
    <div className="flex items-center gap-3 text-sm font-bold text-[var(--ink)]" aria-live="polite">
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={t(`${NS}.lives`, { n: lives })}>
        {[0, 1, 2].map((i) => (
          <Heart key={i} aria-hidden="true" className={`h-5 w-5 ${i < lives ? "fill-red-500 text-red-500" : "text-[var(--border)]"}`} />
        ))}
      </span>
      <span className="inline-flex items-center gap-1" aria-label={t(`${NS}.streak`, { n: streak })}>
        <Flame className={`h-5 w-5 ${streak > 0 ? "text-[#F47C20]" : "text-[var(--border)]"}`} aria-hidden="true" />
        {streak}
      </span>
    </div>
  );

  const weakSide = strong === "A" ? "B" : "A";
  const live = (
    <ArenaLive
      round={round}
      stage={finished ? "done" : stage}
      finished={finished}
      weakSide={weakSide}
      tags={liveTags}
      tagResult={tagResult}
      chips={chips}
      used={liveUsed}
      history={history}
      total={rounds.length}
      idx={idx}
      lives={lives}
      hud={hud}
    />
  );
  const liveTitle = t(`${NS}.live.title.${finished ? "done" : stage}`);

  if (finished) {
    return (
      <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={liveTitle}>
        {finished === "lost" ? (
          <div role="status" className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-center">
            <p className="text-3xl" aria-hidden="true">💔</p>
            <p className="mt-1 text-lg font-black text-[var(--ink)]">{t(`${NS}.gameOver`)}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink2)]">{t(`${NS}.gameOverBody`)}</p>
            <button type="button" onClick={onRetry} className={`${BTN_PRIMARY} mt-3`}>
              {t("studio.prompt-builder.ui.retry")}
            </button>
          </div>
        ) : (
          <ResultCard
            stars={Math.max(1, Math.min(3, lives))}
            body={<p>{t(`${NS}.leagueDone`, { n: lives, s: best })}</p>}
            onRetry={onRetry}
            onNext={next ? () => onNext(next) : undefined}
          />
        )}
      </StudioFrame>
    );
  }

  const promptFor = (side: "A" | "B") => (side === strong ? k("strong") : k("weak"));
  const outFor = (side: "A" | "B") => (side === strong ? k("strongOut") : k("weakOut"));
  // Side by side where the build column is wide enough.
  const pair = layout === "page" ? "md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2" : "md:grid-cols-2";

  return (
    <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={liveTitle}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {hud}
          <span className="text-xs font-bold text-[var(--ink3)]">{t(`${NS}.round`, { n: idx + 1, total: rounds.length })}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[#F47C20] transition-all motion-reduce:transition-none"
            style={{ width: `${((idx + (stage === "fix" ? 0.66 : stage === "tag" ? 0.33 : 0)) / rounds.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={round.id}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <div className="rounded-2xl bg-[var(--s2)] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.job`)}</p>
              <p className="font-bold text-[var(--ink)]">{k("job")}</p>
            </div>

            <div className={`grid gap-3 ${pair}`}>
              {(["A", "B"] as const).map((side) => {
                const revealed = stage !== "pick";
                const isStrong = side === strong;
                const border = !revealed ? "border-[var(--border)]" : isStrong ? "border-green-400" : "border-red-300";
                return (
                  <section key={side} aria-label={t(`${NS}.prompt${side}`)} className={`flex flex-col rounded-2xl border-2 bg-white p-3 ${border}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="text-sm font-black text-[var(--ink)]">{t(`${NS}.prompt${side}`)}</h3>
                      {revealed && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isStrong ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                          {isStrong ? t(`${NS}.strongLabel`) : t(`${NS}.weakLabel`)}
                        </span>
                      )}
                    </div>
                    <pre className="mb-2 whitespace-pre-wrap rounded-xl bg-[var(--s2)] p-2.5 font-sans text-sm text-[var(--ink)]">{promptFor(side)}</pre>
                    {stage === "pick" ? (
                      <ReplyBubble label={t(`${NS}.responseLabel`)}>{outFor(side)}</ReplyBubble>
                    ) : (
                      <details className="rounded-xl border border-[var(--border)] p-2 text-sm">
                        <summary className="cursor-pointer text-xs font-bold text-[var(--ink3)]">{t(`${NS}.responseLabel`)}</summary>
                        <p className="mt-1 whitespace-pre-line text-[var(--ink)]">{outFor(side)}</p>
                      </details>
                    )}
                    {stage === "pick" && (
                      <button type="button" onClick={() => pick(side)} className={`${BTN_PRIMARY} mt-3`}>
                        <Swords className="h-4 w-4" aria-hidden="true" /> {t(`${NS}.pick${side}`)}
                      </button>
                    )}
                  </section>
                );
              })}
            </div>
            <Illustrative />

            {stage !== "pick" && picked && (
              <p role="status" className={`rounded-xl p-3 text-sm font-semibold ${pickRight ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
                {pickRight ? t(`${NS}.rightPick`, { side: strong }) : t(`${NS}.wrongPick`, { side: strong })}
              </p>
            )}

            {stage === "tag" && (
              <TagStep round={round} weakSide={weakSide} tags={tags} setTags={setTags} result={tagResult} onCheck={checkTags} onContinue={() => setStage("fix")} />
            )}
            {stage === "fix" && (
              <FixStep
                chips={chips}
                used={used}
                onToggle={toggleChip}
                text={text}
                setText={setText}
                onNext={nextRound}
                last={idx === rounds.length - 1}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </StudioFrame>
  );
}

function TagStep({
  round,
  weakSide,
  tags,
  setTags,
  result,
  onCheck,
  onContinue,
}: {
  round: Round;
  weakSide: "A" | "B";
  tags: Tag[];
  setTags: (f: (t: Tag[]) => Tag[]) => void;
  result: ReturnType<typeof gradeTags> | null;
  onCheck: () => void;
  onContinue: () => void;
}) {
  const t = useT();
  return (
    <div className="rounded-2xl border-2 border-[var(--border)] bg-white p-3">
      <p className="text-sm font-bold text-[var(--ink)]">{t(`${NS}.tagPrompt`, { side: weakSide })}</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t(`${NS}.tagsLegend`)}>
        {TAGS.map((tag) => {
          const on = tags.includes(tag);
          const correct = round.tags.includes(tag);
          const cls = result
            ? correct
              ? "border-green-500 bg-green-50 text-green-800"
              : on
                ? "border-red-300 bg-red-50 text-red-700 line-through"
                : "border-[var(--border)] bg-white text-[var(--ink3)]"
            : on
              ? "border-[#F47C20] bg-[#FFF6EE] text-[var(--ink)]"
              : "border-[var(--border)] bg-white text-[var(--ink2)]";
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              disabled={!!result}
              title={t(`${NS}.tag.${tag}.desc`)}
              onClick={() => setTags((ts) => (ts.includes(tag) ? ts.filter((x) => x !== tag) : [...ts, tag]))}
              className={`${CHIP} ${cls}`}
            >
              {on && !result ? "✓ " : ""}
              {t(`${NS}.tag.${tag}`)}
            </button>
          );
        })}
      </div>
      {!result ? (
        <button type="button" onClick={onCheck} disabled={tags.length === 0} className={`${BTN_PRIMARY} mt-3`}>
          {t(`${NS}.checkTags`)}
        </button>
      ) : (
        <div className="mt-3 space-y-2" role="status">
          <p className={`text-sm font-semibold ${result.good ? "text-green-800" : "text-red-700"}`}>
            {result.perfect ? t(`${NS}.tagsPerfect`) : result.good ? t(`${NS}.tagsGood`) : t(`${NS}.tagsBad`)}
          </p>
          <ul className="space-y-1 text-sm text-[var(--ink2)]">
            {round.tags.map((tag) => (
              <li key={tag}>
                <span className="font-semibold text-[var(--ink)]">{t(`${NS}.tag.${tag}`)}:</span> {t(`${NS}.tag.${tag}.desc`)}
              </li>
            ))}
          </ul>
          <p className="rounded-xl bg-[var(--s2)] p-3 text-sm text-[var(--ink)]">
            <span className="font-bold">{t(`${NS}.whyTitle`)}: </span>
            {t(`${NS}.r.${round.id}.why`)}
          </p>
          <button type="button" onClick={onContinue} className={BTN_PRIMARY}>
            {t(`${NS}.toFix`)} →
          </button>
        </div>
      )}
    </div>
  );
}

function FixStep({
  chips,
  used,
  onToggle,
  text,
  setText,
  onNext,
  last,
}: {
  chips: Chip[];
  used: string[];
  onToggle: (c: Chip) => void;
  text: string;
  setText: (s: string) => void;
  onNext: () => void;
  last: boolean;
}) {
  const t = useT();
  const helpful = chips.filter((c) => !c.decoy);
  const got = helpful.filter((c) => used.includes(c.id)).length;
  const revealed = got === helpful.length;
  const decoyOn = used.includes("decoy");

  return (
    <div className="space-y-3 rounded-2xl border-2 border-[#F47C20]/50 bg-[#FFF6EE] p-3">
      <div>
        <p className="text-sm font-black text-[var(--ink)]">
          <span aria-hidden="true">🔧</span> {t(`${NS}.fixTitle`)}
        </p>
        <p className="text-sm text-[var(--ink2)]">{t(`${NS}.fixPrompt`)}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {chips.map((c) => {
          const on = used.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c)}
              className={`${CHIP} justify-start rounded-2xl text-left ${on ? (c.decoy ? "border-red-300 bg-red-50 text-red-800" : "border-green-500 bg-green-50 text-green-900") : "border-[var(--border)] bg-white text-[var(--ink)]"}`}
            >
              <span aria-hidden="true">{on ? "✓" : "+"}</span> {c.text}
            </button>
          );
        })}
      </div>
      {decoyOn && (
        <p role="status" className="rounded-xl bg-white p-2.5 text-sm text-red-700">
          {t(`${NS}.decoyNote`)}
        </p>
      )}
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.yourFix`)}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white p-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
        />
      </label>
      <p className={`text-sm ${revealed ? "font-semibold text-green-800" : "text-[var(--ink2)]"}`} aria-live="polite">
        {revealed ? t(`${NS}.live.revealed`) : t(`${NS}.fixRevealHint`, { n: got, total: helpful.length })}
      </p>
      {revealed && <TryForReal prompt={text} intro={t(`${NS}.realIntro`)} />}
      <button type="button" onClick={onNext} disabled={!revealed} className={`${BTN_PRIMARY} w-full`}>
        {last ? t(`${NS}.finish`) : t(`${NS}.nextRound`)} →
      </button>
    </div>
  );
}

/** The Live panel: the round scoreboard, your diagnosis, then the response upgrading chip by chip. */
function ArenaLive({
  round,
  stage,
  finished,
  weakSide,
  tags,
  tagResult,
  chips,
  used,
  history,
  total,
  idx,
  lives,
  hud,
}: {
  round: Round;
  stage: Stage | "done";
  finished: "won" | "lost" | null;
  weakSide: "A" | "B";
  tags: Tag[];
  tagResult: ReturnType<typeof gradeTags> | null;
  chips: Chip[];
  used: string[];
  history: Outcome[];
  total: number;
  idx: number;
  lives: number;
  hud: ReactNode;
}) {
  const t = useT();
  const k = (s: string) => t(`${NS}.r.${round.id}.${s}`);
  const fresh = useFresh(used);

  const board = (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {hud}
        <ol className="flex gap-1.5" aria-label={t(`${NS}.live.rounds`)}>
          {Array.from({ length: total }, (_, i) => {
            const o = history[i];
            const cls = o === "perfect" ? "bg-green-500 text-white" : o === "ok" ? "bg-green-100 text-green-800" : o === "miss" ? "bg-red-100 text-red-700" : i === idx && !finished ? "bg-[#1B3A6B] text-white" : "bg-[var(--s2)] text-[var(--ink3)]";
            return (
              <li key={i} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${cls}`} aria-label={t(`${NS}.round`, { n: i + 1, total })}>
                {o === "perfect" ? "★" : o === "ok" ? "✓" : o === "miss" ? "✗" : i + 1}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );

  if (stage === "done") {
    return (
      <div className="space-y-3">
        {board}
        <p className="rounded-2xl bg-[var(--s2)] p-3 text-sm text-[var(--ink)]">{finished === "won" ? t(`${NS}.live.wonBody`, { n: lives }) : t(`${NS}.live.lostBody`)}</p>
      </div>
    );
  }

  if (stage === "pick") {
    return (
      <div className="space-y-3">
        {board}
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-4 text-sm text-[var(--ink2)]">
          <p className="font-bold text-[var(--ink)]">{k("job")}</p>
          <p className="mt-1">{t(`${NS}.live.pickWait`)}</p>
        </div>
      </div>
    );
  }

  if (stage === "tag") {
    return (
      <div className="space-y-3">
        {board}
        <div className="rounded-2xl border-2 border-red-200 bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.live.diagnosis`, { side: weakSide })}</p>
          <pre className="mt-1 whitespace-pre-wrap rounded-xl bg-[var(--s2)] p-2.5 font-sans text-sm text-[var(--ink)]">{k("weak")}</pre>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
            {tags.length === 0 && <li className="text-xs text-[var(--ink3)]">{t(`${NS}.live.noTags`)}</li>}
            {tags.map((tag) => {
              const ok = round.tags.includes(tag);
              const cls = tagResult ? (ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700 line-through") : "bg-[#FEF0E3] text-[#7A3E0E]";
              return (
                <li key={tag} className={`rounded-lg px-2 py-1 text-xs font-bold ${cls}`}>
                  <span aria-hidden="true">📌</span> {t(`${NS}.tag.${tag}`)}
                </li>
              );
            })}
          </ul>
        </div>
        <ReplyBubble label={t(`${NS}.responseLabel`)} tone="bad">
          {k("weakOut")}
        </ReplyBubble>
      </div>
    );
  }

  // Fix: the reply upgrades with each helpful chip.
  const got = FIXES.filter((f) => used.includes(f));
  const full = got.length === FIXES.length;
  const decoyOn = used.includes("decoy");
  const changed = fresh.filter((id) => id !== "decoy");
  const decoyFresh = fresh.includes("decoy");

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--ink2)]">
          <span>{t(`${NS}.live.upgrade`)}</span>
          <span className="tabular-nums">{got.length}/{FIXES.length}</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[var(--s2)]" role="meter" aria-valuemin={0} aria-valuemax={3} aria-valuenow={got.length} aria-label={t(`${NS}.live.upgrade`)}>
          <div className="h-full rounded-full bg-[#22C55E] transition-all duration-500 motion-reduce:transition-none" style={{ width: `${(got.length / FIXES.length) * 100}%` }} />
        </div>
      </div>

      {/* What changed with the last chip */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--s2)] p-3 text-sm" aria-live="polite">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.live.whatChanged`)}</p>
        {changed.length > 0 ? (
          changed.map((id) => (
            <p key={id} className="mt-1 text-[var(--ink)]">
              <span className="rounded bg-green-200 px-1 font-bold text-green-900">+</span> {chips.find((c) => c.id === id)?.text}
            </p>
          ))
        ) : decoyFresh ? (
          <p className="mt-1 font-semibold text-red-700">{t(`${NS}.live.decoyNothing`)}</p>
        ) : (
          <p className="mt-1 text-[var(--ink3)]">{t(`${NS}.live.addChip`)}</p>
        )}
      </div>

      <div className={`rounded-2xl border-2 p-3 ${full ? "border-green-300 bg-green-50" : got.length ? "border-[#F47C20]/50 bg-white" : "border-red-200 bg-red-50"}`}>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
          <span aria-hidden="true">🤖</span> {full ? t(`${NS}.upgraded`) : t(`${NS}.live.replyLive`)}
        </p>
        {full ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink)]">{k("fixedOut")}</p>
        ) : (
          <div className="space-y-2 text-sm leading-relaxed">
            {got.map((f) => (
              <p key={f} className={`rounded-lg px-2 py-1 transition-colors duration-700 motion-reduce:transition-none ${fresh.includes(f) ? "bg-green-200/70" : "bg-green-50"} text-[var(--ink)]`}>
                {k(`up${FIXES.indexOf(f) + 1}`)}
                {fresh.includes(f) && <NewBadge />}
              </p>
            ))}
            <div className={got.length ? "border-t border-dashed border-[var(--border)] pt-2" : ""}>
              {got.length > 0 && <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.live.stillGeneric`, { n: FIXES.length - got.length })}</p>}
              <p className={`whitespace-pre-line ${got.length ? "line-clamp-4 text-[var(--ink3)]" : "text-[var(--ink)]"}`}>{k("weakOut")}</p>
            </div>
          </div>
        )}
        {decoyOn && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{t(`${NS}.live.decoyOn`)}</p>}
      </div>
      <Illustrative />
    </div>
  );
}
