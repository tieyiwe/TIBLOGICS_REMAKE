"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flame, Heart, Swords } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { promptArena } from "@/lib/learn/studio/tools/prompt-arena";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import { LEAGUES, TAGS, gradeTags, strongSide, type Round, type Tag } from "./prompts/arena-data";
import {
  BTN_PRIMARY,
  CHIP,
  ChallengeHeader,
  ChallengePicker,
  Illustrative,
  ReplyBubble,
  ResultCard,
  TryForReal,
  nextChallenge,
} from "./prompts/ui";

const NS = "studio.prompt-arena";

export default function PromptArena({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const valid = challengeId && LEAGUES[challengeId] ? challengeId : null;
  const [league, setLeague] = useState<string | null>(valid);
  const [run, setRun] = useState(0);

  if (!league) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--s2)] p-4 text-sm text-[var(--ink2)]">
          <p>{t(`${NS}.intro`)}</p>
        </div>
        <ChallengePicker ns={NS} challenges={promptArena.challenges} progress={progress} onPick={(id) => id && setLeague(id)} compact={embedded} />
      </div>
    );
  }
  return (
    <League
      key={`${league}-${run}`}
      leagueId={league}
      onBack={() => setLeague(null)}
      onRetry={() => setRun((r) => r + 1)}
      onNext={(id) => setLeague(id)}
      onComplete={onComplete}
    />
  );
}

type Stage = "pick" | "tag" | "fix";

function League({
  leagueId,
  onBack,
  onRetry,
  onNext,
  onComplete,
}: {
  leagueId: string;
  onBack: () => void;
  onRetry: () => void;
  onNext: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const rounds = LEAGUES[leagueId];
  const meta = promptArena.challenges.find((c) => c.id === leagueId) ?? null;
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

  const round = rounds[idx];
  const strong = strongSide(round.id);
  const k = (s: string) => t(`${NS}.r.${round.id}.${s}`);
  const next = nextChallenge(promptArena.challenges, leagueId);

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
    if (!g.good) {
      setStreak(0);
      loseLife();
    } else if (g.perfect && pickRight) {
      const n = streak + 1;
      setStreak(n);
      setBest((b) => Math.max(b, n));
    }
  }

  function nextRound() {
    if (idx === rounds.length - 1) {
      setFinished("won");
      const stars = Math.max(1, Math.min(3, lives)) as 1 | 2 | 3;
      onComplete({ challengeId: leagueId, stars });
      return;
    }
    setIdx((i) => i + 1);
    setStage("pick");
    setPicked(null);
    setTags([]);
    setTagResult(null);
    setPickRight(false);
  }

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

  if (finished === "lost") {
    return (
      <div>
        <ChallengeHeader ns={NS} challenge={meta} onBack={onBack} right={hud} />
        <div role="status" className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-center">
          <p className="text-3xl" aria-hidden="true">💔</p>
          <p className="mt-1 text-lg font-black text-[var(--ink)]">{t(`${NS}.gameOver`)}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--ink2)]">{t(`${NS}.gameOverBody`)}</p>
          <button type="button" onClick={onRetry} className={`${BTN_PRIMARY} mt-3`}>
            {t("studio.prompt-builder.ui.retry")}
          </button>
        </div>
      </div>
    );
  }
  if (finished === "won") {
    return (
      <div>
        <ChallengeHeader ns={NS} challenge={meta} onBack={onBack} right={hud} />
        <ResultCard
          stars={Math.max(1, Math.min(3, lives))}
          body={<p>{t(`${NS}.leagueDone`, { n: lives, s: best })}</p>}
          onRetry={onRetry}
          onNext={next ? () => onNext(next) : undefined}
        />
      </div>
    );
  }

  const weakSide = strong === "A" ? "B" : "A";
  const promptFor = (side: "A" | "B") => (side === strong ? k("strong") : k("weak"));
  const outFor = (side: "A" | "B") => (side === strong ? k("strongOut") : k("weakOut"));

  return (
    <div>
      <ChallengeHeader ns={NS} challenge={meta} onBack={onBack} right={hud} />
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden="true">
          <div className="h-full rounded-full bg-[#F47C20] transition-all motion-reduce:transition-none" style={{ width: `${((idx + (stage === "fix" ? 0.66 : stage === "tag" ? 0.33 : 0)) / rounds.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-[var(--ink3)]">{t(`${NS}.round`, { n: idx + 1, total: rounds.length })}</span>
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

          <div className="grid gap-3 md:grid-cols-2">
            {(["A", "B"] as const).map((side) => {
              const revealed = stage !== "pick";
              const isStrong = side === strong;
              const border = !revealed
                ? "border-[var(--border)]"
                : isStrong
                  ? "border-green-400"
                  : "border-red-300";
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
                  <ReplyBubble label={t(`${NS}.responseLabel`)} tone={revealed ? (isStrong ? "good" : "bad") : "neutral"}>
                    {outFor(side)}
                  </ReplyBubble>
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
            <TagStep
              round={round}
              weakSide={weakSide}
              tags={tags}
              setTags={setTags}
              result={tagResult}
              onCheck={checkTags}
              onContinue={() => setStage("fix")}
            />
          )}
          {stage === "fix" && <FixStep round={round} onNext={nextRound} last={idx === rounds.length - 1} />}
        </motion.div>
      </AnimatePresence>
    </div>
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

function FixStep({ round, onNext, last }: { round: Round; onNext: () => void; last: boolean }) {
  const t = useT();
  const reduce = useReducedMotion();
  const weak = t(`${NS}.r.${round.id}.weak`);
  const chips = useMemo(() => {
    const list = [
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
  const [used, setUsed] = useState<string[]>([]);
  const [text, setText] = useState(weak);

  function toggle(id: string, chipText: string) {
    if (used.includes(id)) {
      setUsed((u) => u.filter((x) => x !== id));
      setText((s) => s.replace(`\n${chipText}`, "").replace(chipText, ""));
    } else {
      setUsed((u) => [...u, id]);
      setText((s) => `${s.trimEnd()}\n${chipText}`);
    }
  }
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
              onClick={() => toggle(c.id, c.text)}
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
      {!revealed ? (
        <p className="text-sm text-[var(--ink2)]" aria-live="polite">
          {t(`${NS}.fixRevealHint`, { n: got, total: helpful.length })}
        </p>
      ) : (
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <ReplyBubble label={t(`${NS}.upgraded`)} tone="good">
            {t(`${NS}.r.${round.id}.fixedOut`)}
          </ReplyBubble>
          <TryForReal prompt={text} intro={t(`${NS}.realIntro`)} />
        </motion.div>
      )}
      <button type="button" onClick={onNext} disabled={!revealed} className={`${BTN_PRIMARY} w-full`}>
        {last ? t(`${NS}.finish`) : t(`${NS}.nextRound`)} →
      </button>
    </div>
  );
}
