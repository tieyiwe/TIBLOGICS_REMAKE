"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, Lock } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { criticMode } from "@/lib/learn/studio/tools/critic-mode";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { type StudioGuide } from "../StudioFrame";
import {
  CRITIC_SCENARIOS,
  FREE_MOVES,
  MOVES,
  MOVE_EMOJI,
  countedMoves,
  criticStars,
  uncovered,
  type CriticScenario,
  type Move,
} from "./prompts/critic-data";
import {
  BTN_PRIMARY,
  ChallengeBar,
  Illustrative,
  LockedNotice,
  NewBadge,
  ResultCard,
  TryForReal,
  nextChallenge,
  useChallengeFlow,
  useDebounced,
  useFresh,
} from "./prompts/ui";

const NS = "studio.critic-mode";

export default function CriticMode({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const flow = useChallengeFlow({ toolId: criticMode.id, challenges: criticMode.challenges, challengeId, progress, freePlay: false, onComplete });
  const [run, setRun] = useState(0);
  const toolbar = <ChallengeBar ns={NS} flow={flow} compact={embedded} />;
  const sc = CRITIC_SCENARIOS.find((s) => s.id === flow.current) ?? null;
  if (!sc || flow.isLocked(sc.id)) {
    return (
      <div className="space-y-3">
        {toolbar}
        {sc && <LockedNotice ns={NS} flow={flow} id={sc.id} />}
      </div>
    );
  }
  return (
    <Scenario
      key={`${sc.id}-${run}`}
      sc={sc}
      toolbar={toolbar}
      onRetry={() => setRun((r) => r + 1)}
      onNext={(id) => flow.pick(id)}
      onComplete={flow.complete}
    />
  );
}

function Scenario({
  sc,
  toolbar,
  onRetry,
  onNext,
  onComplete,
}: {
  sc: CriticScenario;
  toolbar: ReactNode;
  onRetry: () => void;
  onNext: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
}) {
  const t = useT();
  const k = (s: string) => t(`${NS}.sc.${sc.id}.${s}`);
  const [part, setPart] = useState<"A" | "B">("A");
  // Part A
  const [flagged, setFlagged] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  // Part B
  const [moves, setMoves] = useState<Move[]>([]);
  const [last, setLast] = useState<{ move: Move; found: string[] } | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [warn, setWarn] = useState(false);

  const liveFlagged = useDebounced(flagged, 300);
  const liveMoves = useDebounced(moves, 300);
  const found = uncovered(sc, moves);
  const used = countedMoves(moves);
  const total = sc.issues.length;
  const next = nextChallenge(criticMode.challenges, sc.id);

  function toggle(m: Move) {
    setResult(null);
    setWarn(false);
    if (moves.includes(m)) {
      setMoves((ms) => ms.filter((x) => x !== m));
      setLast(null);
      return;
    }
    const nextMoves = [...moves, m];
    const newly = uncovered(sc, nextMoves).filter((id) => !found.includes(id));
    setMoves(nextMoves);
    setLast({ move: m, found: newly });
  }

  function finish() {
    const stars = criticStars(found.length, total, used);
    if (stars === 0) {
      setWarn(true);
      return;
    }
    setResult(stars);
    onComplete({ challengeId: sc.id, stars });
  }

  const prompt = [k("user"), ...moves.map((m) => t(`${NS}.move.${m}.snippet`))].join("\n\n");
  const G = `${NS}.guide`;
  const guide: StudioGuide = {
    goal: t(`${G}.goal.${sc.id}`),
    steps: [1, 2, 3, 4, 5, 6].map((i) => t(`${G}.step${i}`)),
    stars: [t(`${G}.star1`), t(`${G}.star2`), t(`${G}.star3`)],
    tips: [t(`${G}.tip.${sc.id}`), t(`${G}.tip.free`)],
  };

  const live = part === "A" ? <LiveA sc={sc} flagged={liveFlagged} checked={checked} /> : <LiveB sc={sc} moves={liveMoves} />;

  return (
    <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={t(`${NS}.live.title${part}`)}>
      <div className="space-y-3">
        <div className="flex gap-1.5" role="list" aria-label={t(`${NS}.parts`)}>
          {(["A", "B"] as const).map((p) => (
            <span
              key={p}
              role="listitem"
              aria-current={part === p ? "step" : undefined}
              className={`rounded-full px-3 py-1 text-xs font-bold ${part === p ? "bg-[#F47C20] text-white" : "bg-[var(--s2)] text-[var(--ink3)]"}`}
            >
              {p === "B" && part === "A" && <Lock className="mr-1 inline h-3 w-3" aria-hidden="true" />}
              {t(`${NS}.part${p}`)}
            </span>
          ))}
        </div>
        <div className="rounded-2xl bg-[var(--s2)] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
            <span aria-hidden="true">🙋</span> {t(`${NS}.userSaid`)}
          </p>
          <p className="text-sm font-semibold text-[var(--ink)]">{k("user")}</p>
        </div>
        {part === "A" ? (
          <PartA sc={sc} flagged={flagged} setFlagged={setFlagged} checked={checked} onCheck={() => setChecked(true)} onDone={() => setPart("B")} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--ink2)]">{t(`${NS}.partBHelp`)}</p>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.movesTitle`)}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {MOVES.map((m) => {
                  const on = moves.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(m)}
                      title={t(`${NS}.move.${m}.desc`)}
                      className={`flex min-h-[48px] items-start gap-2 rounded-xl border-2 p-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${on ? "border-[#F47C20] bg-[#FFF6EE]" : "border-[var(--border)] bg-white hover:border-[#F47C20]"}`}
                    >
                      <span aria-hidden="true" className="text-base leading-5">{MOVE_EMOJI[m]}</span>
                      <span className="min-w-0">
                        <span className="block font-bold text-[var(--ink)]">
                          {t(`${NS}.move.${m}.name`)}
                          {FREE_MOVES.includes(m) && <span className="ml-1 rounded-full bg-green-100 px-1.5 text-[10px] font-bold uppercase text-green-800">{t(`${NS}.freeMove`)}</span>}
                        </span>
                        <span className="block text-xs text-[var(--ink3)]">{t(`${NS}.move.${m}.desc`)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--s2)] px-3 py-2 text-sm">
              <span className="font-bold text-[var(--ink)]">{t(`${NS}.uncovered`, { n: found.length, total })}</span>
              <span className="text-xs font-bold text-[var(--ink3)]">{t(`${NS}.movesUsed`, { n: used })}</span>
            </div>
            {last && (
              <p role="status" className={`text-xs font-semibold ${last.found.length ? "text-green-700" : "text-[var(--ink3)]"}`}>
                {last.found.length
                  ? t(`${NS}.newFound`, { list: last.found.map((id) => k(`i.${id}.title`)).join(", ") })
                  : FREE_MOVES.includes(last.move)
                    ? t(`${NS}.toneOnly`)
                    : t(`${NS}.nothingNew`)}
              </p>
            )}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.yourPrompt`)}</p>
              <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--ink)]">{prompt}</pre>
            </div>
            {result === null ? (
              <>
                <button type="button" onClick={finish} className={`${BTN_PRIMARY} w-full`}>
                  {t(`${NS}.finish`)}
                </button>
                {warn && (
                  <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {t(`${NS}.needMore`)}
                  </p>
                )}
              </>
            ) : (
              <ResultCard
                stars={result}
                body={
                  <>
                    <p>{t(`${NS}.result`, { n: found.length, total, m: used })}</p>
                    <p className="mt-1">{k("lesson")}</p>
                  </>
                }
                onRetry={onRetry}
                onNext={next ? () => onNext(next) : undefined}
              />
            )}
            <TryForReal prompt={prompt} intro={t(`${NS}.realIntro`)} />
          </div>
        )}
      </div>
    </StudioFrame>
  );
}

function PartA({
  sc,
  flagged,
  setFlagged,
  checked,
  onCheck,
  onDone,
}: {
  sc: CriticScenario;
  flagged: number[];
  setFlagged: (f: (x: number[]) => number[]) => void;
  checked: boolean;
  onCheck: () => void;
  onDone: () => void;
}) {
  const t = useT();
  const syc = sc.sentences.map((k, i) => (k !== "fine" ? i : -1)).filter((i) => i >= 0);
  const hit = flagged.filter((i) => syc.includes(i)).length;
  const wrong = flagged.length - hit;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--ink2)]">{t(`${NS}.partAHelp`)}</p>
      <div className="rounded-2xl border-2 border-[var(--border)] bg-white p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
          <span aria-hidden="true">🤖</span> {t(`${NS}.aiSaid`)}
        </p>
        <ul className="space-y-1.5">
          {sc.sentences.map((kind, i) => {
            const on = flagged.includes(i);
            const isSyc = kind !== "fine";
            let cls = on ? "border-[#F47C20] bg-[#FFF6EE]" : "border-transparent bg-[var(--s2)]";
            if (checked) cls = isSyc ? (on ? "border-green-500 bg-green-50" : "border-amber-400 bg-amber-50") : on ? "border-red-300 bg-red-50" : "border-transparent bg-[var(--s2)]";
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={checked}
                  onClick={() => setFlagged((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]))}
                  className={`w-full rounded-xl border-2 p-2.5 text-left text-sm text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${cls}`}
                >
                  {on && !checked && <span aria-hidden="true">🚩 </span>}
                  {t(`${NS}.sc.${sc.id}.s${i + 1}`)}
                  {checked && (
                    <span className={`mt-1 block text-xs font-bold ${isSyc ? "text-[var(--ink2)]" : "text-green-700"}`}>
                      {isSyc ? (on ? "✓ " : "⚠ ") : on ? "✗ " : "✓ "}
                      {t(`${NS}.kind.${kind}`)}
                      {" · "}
                      <span className="font-normal">{t(`${NS}.kind.${kind}.why`)}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <Illustrative />
      {!checked ? (
        <button type="button" onClick={onCheck} disabled={flagged.length === 0} className={BTN_PRIMARY}>
          {t(`${NS}.checkA`)}
        </button>
      ) : (
        <div className="space-y-2" role="status">
          <p className="rounded-xl bg-[var(--s2)] p-3 text-sm font-semibold text-[var(--ink)]">{t(`${NS}.resultA`, { hit, total: syc.length, wrong })}</p>
          <p className="text-sm text-[var(--ink2)]">{t(`${NS}.lessonA`)}</p>
          <button type="button" onClick={onDone} className={BTN_PRIMARY}>
            {t(`${NS}.toPartB`)} →
          </button>
        </div>
      )}
    </div>
  );
}

/** Part A live: the reply with the flagged sentences cut out, so you see how little is left. */
function LiveA({ sc, flagged, checked }: { sc: CriticScenario; flagged: number[]; checked: boolean }) {
  const t = useT();
  const kept = sc.sentences.map((_, i) => i).filter((i) => !flagged.includes(i));
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between rounded-2xl border border-[var(--border)] bg-white p-3">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.live.flags`)}</span>
        <motion.span key={flagged.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-2xl font-black tabular-nums text-[#F47C20]">
          🚩 {flagged.length}
        </motion.span>
      </div>
      <div className="rounded-2xl border-2 border-[var(--border)] bg-white p-3">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.live.cleaned`)}</p>
        <div className="space-y-1.5 text-sm leading-relaxed">
          {sc.sentences.map((kind, i) => {
            const cut = flagged.includes(i);
            const wrongCut = checked && cut && kind === "fine";
            const missed = checked && !cut && kind !== "fine";
            return (
              <p
                key={i}
                className={`rounded-lg px-2 py-1 transition-colors duration-500 motion-reduce:transition-none ${
                  cut ? (wrongCut ? "bg-red-50 text-red-700 line-through" : "bg-[var(--s2)] text-[var(--ink3)] line-through") : missed ? "bg-amber-50 text-[var(--ink)]" : "text-[var(--ink)]"
                }`}
              >
                {t(`${NS}.sc.${sc.id}.s${i + 1}`)}
              </p>
            );
          })}
        </div>
        {kept.length === 0 && <p className="mt-2 text-xs font-semibold text-red-700">{t(`${NS}.live.nothingLeft`)}</p>}
      </div>
      <p className="text-xs text-[var(--ink3)]">{t(`${NS}.live.aHint`)}</p>
    </div>
  );
}

/** Part B live: the counter and the reply rebuilding as critic moves are added. */
function LiveB({ sc, moves }: { sc: CriticScenario; moves: Move[] }) {
  const t = useT();
  const reduce = useReducedMotion();
  const k = (s: string) => t(`${NS}.sc.${sc.id}.${s}`);
  const found = useMemo(() => uncovered(sc, moves), [sc, moves]);
  const fresh = useFresh(found);
  const total = sc.issues.length;

  return (
    <div className="space-y-3">
      {/* Blind-spot counter */}
      <div className="rounded-2xl border-2 border-[var(--border)] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-[var(--ink)]" aria-live="polite">
            <Eye className="mr-1 inline h-4 w-4 text-[#F47C20]" aria-hidden="true" />
            {t(`${NS}.live.counterLabel`)}
          </p>
          <motion.span
            key={found.length}
            initial={reduce ? false : { scale: 1.5, color: "#22C55E" }}
            animate={{ scale: 1, color: "#0D1B2A" }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-black tabular-nums"
          >
            {found.length}/{total}
          </motion.span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden="true">
          <div className="h-full rounded-full bg-[#22C55E] transition-all duration-500 motion-reduce:transition-none" style={{ width: `${(found.length / total) * 100}%` }} />
        </div>
        <ul className="mt-2 grid gap-1.5">
          {sc.issues.map((iss) => {
            const open = found.includes(iss.id);
            const isNew = fresh.includes(iss.id);
            return (
              <li
                key={iss.id}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition-colors duration-700 motion-reduce:transition-none ${
                  open ? (isNew ? "bg-green-200 font-semibold text-green-900" : "bg-green-50 font-semibold text-green-900") : "bg-[var(--s2)] text-[var(--ink3)]"
                }`}
              >
                {open ? <span aria-hidden="true">💡</span> : <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                {open ? k(`i.${iss.id}.title`) : t(`${NS}.hidden`)}
                {isNew && <NewBadge />}
              </li>
            );
          })}
        </ul>
      </div>

      {/* The (pre-written) reply, assembled from the moves in play */}
      <div className={`rounded-2xl border-2 p-3 ${found.length >= 4 ? "border-green-300 bg-green-50" : "border-[var(--border)] bg-white"}`}>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
          <span aria-hidden="true">🤖</span> {t(`${NS}.aiSaid`)}
        </p>
        <div className="text-sm leading-relaxed text-[var(--ink)]">
          <p className={moves.includes("noPraise") ? "" : "text-[var(--ink2)]"}>{moves.includes("noPraise") ? t(`${NS}.resp.direct`) : k("praise")}</p>
          {moves.includes("skeptic") && <p className="mt-2 italic">{t(`${NS}.resp.skeptic`)}</p>}
          {found.length === 0 ? (
            <p className="mt-2 text-[var(--ink2)]">{k("bland")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              <AnimatePresence initial={false}>
                {sc.issues
                  .filter((i) => found.includes(i.id))
                  .map((i) => (
                    <motion.li
                      key={i.id}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`rounded-lg px-2 py-1 transition-colors duration-1000 motion-reduce:transition-none ${fresh.includes(i.id) ? "bg-[#FEF0E3] ring-2 ring-[#F47C20]" : ""}`}
                    >
                      <span className="font-bold">{k(`i.${i.id}.title`)}: </span>
                      {k(`i.${i.id}.text`)}
                      {fresh.includes(i.id) && <NewBadge />}
                    </motion.li>
                  ))}
              </AnimatePresence>
            </ul>
          )}
          {moves.includes("confidence") && <p className="mt-2 text-[var(--ink2)]">{t(`${NS}.resp.confidence`)}</p>}
        </div>
      </div>
      <Illustrative />
    </div>
  );
}
