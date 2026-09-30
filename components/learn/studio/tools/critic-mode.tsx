"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, Lock } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { criticMode } from "@/lib/learn/studio/tools/critic-mode";
import type { StudioToolProps } from "@/lib/learn/studio/types";
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
  ChallengeHeader,
  ChallengePicker,
  Illustrative,
  ReplyBubble,
  ResultCard,
  TryForReal,
  nextChallenge,
} from "./prompts/ui";

const NS = "studio.critic-mode";

export default function CriticMode({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const valid = CRITIC_SCENARIOS.some((s) => s.id === challengeId) ? challengeId : null;
  const [current, setCurrent] = useState<string | null>(valid);
  const [run, setRun] = useState(0);

  if (!current) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--s2)] p-4 text-sm text-[var(--ink2)]">
          <p>{t(`${NS}.intro`)}</p>
        </div>
        <ChallengePicker ns={NS} challenges={criticMode.challenges} progress={progress} onPick={(id) => id && setCurrent(id)} compact={embedded} />
      </div>
    );
  }
  const sc = CRITIC_SCENARIOS.find((s) => s.id === current)!;
  return (
    <Scenario
      key={`${current}-${run}`}
      sc={sc}
      embedded={!!embedded}
      onBack={() => setCurrent(null)}
      onRetry={() => setRun((r) => r + 1)}
      onNext={(id) => setCurrent(id)}
      onComplete={onComplete}
    />
  );
}

function Scenario({
  sc,
  embedded,
  onBack,
  onRetry,
  onNext,
  onComplete,
}: {
  sc: CriticScenario;
  embedded: boolean;
  onBack: () => void;
  onRetry: () => void;
  onNext: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
}) {
  const t = useT();
  const meta = criticMode.challenges.find((c) => c.id === sc.id) ?? null;
  const [part, setPart] = useState<"A" | "B">("A");
  const k = (s: string) => t(`${NS}.sc.${sc.id}.${s}`);

  return (
    <div>
      <ChallengeHeader ns={NS} challenge={meta} onBack={onBack} />
      <div className="mb-3 flex gap-1.5" role="tablist" aria-label={t(`${NS}.parts`)}>
        {(["A", "B"] as const).map((p) => (
          <span
            key={p}
            role="tab"
            aria-selected={part === p}
            className={`rounded-full px-3 py-1 text-xs font-bold ${part === p ? "bg-[#F47C20] text-white" : "bg-[var(--s2)] text-[var(--ink3)]"}`}
          >
            {t(`${NS}.part${p}`)}
          </span>
        ))}
      </div>
      <div className="mb-3 rounded-2xl bg-[var(--s2)] p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
          <span aria-hidden="true">🙋</span> {t(`${NS}.userSaid`)}
        </p>
        <p className="text-sm font-semibold text-[var(--ink)]">{k("user")}</p>
      </div>
      {part === "A" ? (
        <PartA sc={sc} onDone={() => setPart("B")} />
      ) : (
        <PartB sc={sc} embedded={embedded} onRetry={onRetry} onNext={onNext} onComplete={onComplete} />
      )}
    </div>
  );
}

function PartA({ sc, onDone }: { sc: CriticScenario; onDone: () => void }) {
  const t = useT();
  const [flagged, setFlagged] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
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
        <button type="button" onClick={() => setChecked(true)} disabled={flagged.length === 0} className={BTN_PRIMARY}>
          {t(`${NS}.checkA`)}
        </button>
      ) : (
        <div className="space-y-2" role="status">
          <p className="rounded-xl bg-[var(--s2)] p-3 text-sm font-semibold text-[var(--ink)]">
            {t(`${NS}.resultA`, { hit, total: syc.length, wrong })}
          </p>
          <p className="text-sm text-[var(--ink2)]">{t(`${NS}.lessonA`)}</p>
          <button type="button" onClick={onDone} className={BTN_PRIMARY}>
            {t(`${NS}.toPartB`)} →
          </button>
        </div>
      )}
    </div>
  );
}

function PartB({
  sc,
  embedded,
  onRetry,
  onNext,
  onComplete,
}: {
  sc: CriticScenario;
  embedded: boolean;
  onRetry: () => void;
  onNext: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const [moves, setMoves] = useState<Move[]>([]);
  const [last, setLast] = useState<{ move: Move; found: string[] } | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [warn, setWarn] = useState(false);
  const found = uncovered(sc, moves);
  const used = countedMoves(moves);
  const total = sc.issues.length;
  const k = (s: string) => t(`${NS}.sc.${sc.id}.${s}`);
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

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--ink2)]">{t(`${NS}.partBHelp`)}</p>
      <div className={`grid gap-3 ${embedded ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"}`}>
        <div className="min-w-0 space-y-3">
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
          <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.yourPrompt`)}</p>
            <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--ink)]">{prompt}</pre>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          {/* Blind-spot counter */}
          <div className="rounded-2xl border-2 border-[var(--border)] bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-[var(--ink)]" aria-live="polite">
                <Eye className="mr-1 inline h-4 w-4 text-[#F47C20]" aria-hidden="true" />
                {t(`${NS}.uncovered`, { n: found.length, total })}
              </p>
              <p className="text-xs font-bold text-[var(--ink3)]">{t(`${NS}.movesUsed`, { n: used })}</p>
            </div>
            <ul className="mt-2 grid gap-1.5">
              {sc.issues.map((iss) => {
                const open = found.includes(iss.id);
                return (
                  <li
                    key={iss.id}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm ${open ? "bg-green-50 font-semibold text-green-900" : "bg-[var(--s2)] text-[var(--ink3)]"}`}
                  >
                    {open ? <span aria-hidden="true">💡</span> : <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                    {open ? k(`i.${iss.id}.title`) : t(`${NS}.hidden`)}
                  </li>
                );
              })}
            </ul>
            {last && (
              <p role="status" className={`mt-2 text-xs font-semibold ${last.found.length ? "text-green-700" : "text-[var(--ink3)]"}`}>
                {last.found.length
                  ? t(`${NS}.newFound`, { list: last.found.map((id) => k(`i.${id}.title`)).join(", ") })
                  : FREE_MOVES.includes(last.move)
                    ? t(`${NS}.toneOnly`)
                    : t(`${NS}.nothingNew`)}
              </p>
            )}
          </div>

          {/* The (pre-written) reply, assembled from the moves in play */}
          <ReplyBubble label={t(`${NS}.aiSaid`)} tone={found.length >= 4 ? "good" : "neutral"}>
            <p>{moves.includes("noPraise") ? t(`${NS}.resp.direct`) : k("praise")}</p>
            {moves.includes("skeptic") && <p className="mt-2 italic">{t(`${NS}.resp.skeptic`)}</p>}
            {found.length === 0 ? (
              <p className="mt-2">{k("bland")}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                <AnimatePresence initial={false}>
                  {sc.issues
                    .filter((i) => found.includes(i.id))
                    .map((i) => (
                      <motion.li
                        key={i.id}
                        initial={reduce ? false : { opacity: 0, y: 8, backgroundColor: "#FFF6EE" }}
                        animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                        transition={{ duration: 0.6 }}
                        className="rounded-lg"
                      >
                        <span className="font-bold">{k(`i.${i.id}.title`)}: </span>
                        {k(`i.${i.id}.text`)}
                      </motion.li>
                    ))}
                </AnimatePresence>
              </ul>
            )}
            {moves.includes("confidence") && <p className="mt-2 text-[var(--ink2)]">{t(`${NS}.resp.confidence`)}</p>}
          </ReplyBubble>
          <Illustrative />

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
      </div>
    </div>
  );
}
