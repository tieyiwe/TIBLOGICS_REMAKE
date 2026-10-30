"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, CheckCircle2, Circle, GripVertical, Lightbulb, Plus, Sparkles, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { promptBuilder } from "@/lib/learn/studio/tools/prompt-builder";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { type StudioGuide } from "../StudioFrame";
import { useStudioDraft } from "../useStudioDraft";
import {
  BLOCK_EMOJI,
  BLOCK_TYPES,
  DIMENSIONS,
  SCENARIOS,
  assemble,
  placeholders,
  score,
  starsFor,
  type Block,
  type BlockType,
} from "./prompts/builder-data";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
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

const NS = "studio.prompt-builder";
let seq = 0;
const newKey = () => `b${++seq}`;
/** A saved list of blocks, as restored from a draft. */
const isBlockList = (v: unknown): v is Block[] =>
  Array.isArray(v) &&
  v.every((b) => b && typeof b.key === "string" && typeof b.text === "string" && (BLOCK_TYPES as readonly string[]).includes(b.type));
/** Restored blocks keep their keys; new ones must not reuse them. */
const keepKeysUnique = (bs: Block[]) => {
  for (const b of bs) seq = Math.max(seq, Number(/^b(\d+)$/.exec(b.key)?.[1] ?? 0));
};

export default function PromptBuilder({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const flow = useChallengeFlow({ toolId: promptBuilder.id, challenges: promptBuilder.challenges, challengeId, progress, freePlay: true, onComplete });
  const toolbar = <ChallengeBar ns={NS} flow={flow} compact={embedded} />;
  if (flow.current && flow.isLocked(flow.current)) {
    return (
      <div className="space-y-3">
        {toolbar}
        <LockedNotice ns={NS} flow={flow} id={flow.current} />
      </div>
    );
  }
  return <Workbench key={flow.current ?? "free"} scenarioId={flow.current} toolbar={toolbar} onNext={(id) => flow.pick(id)} onComplete={flow.complete} />;
}

const isFilledIn = (blocks: Block[], type: BlockType) => {
  const b = blocks.find((x) => x.type === type);
  return !!b && b.text.trim().length > 0 && placeholders(b.text) === 0;
};

function Workbench({
  scenarioId,
  toolbar,
  onNext,
  onComplete,
}: {
  scenarioId: string | null;
  toolbar: ReactNode;
  onNext: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
}) {
  const t = useT();
  const sc = SCENARIOS.find((s) => s.id === scenarioId) ?? null;
  const [blocks, setBlocks] = useState<Block[]>(() =>
    sc ? [{ key: newKey(), type: "task", text: t(`${NS}.sc.${sc.id}.naive`) }] : [],
  );
  // The blocks in progress follow the learner to any device.
  useStudioDraft<Block[]>(promptBuilder.id, scenarioId ?? "free", blocks, (v) => {
    keepKeysUnique(v);
    setBlocks(v);
  }, { validate: isBlockList });
  const [result, setResult] = useState<{ stars: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const s = useMemo(() => score(blocks), [blocks]);
  const prompt = assemble(blocks);
  const used = new Set(blocks.map((b) => b.type));
  const missing = sc ? sc.required.filter((r) => !isFilledIn(blocks, r)) : [];

  // The live panel follows the blocks ~300ms after the learner stops typing.
  const liveBlocks = useDebounced(blocks, 300);
  const liveScore = useMemo(() => score(liveBlocks), [liveBlocks]);

  function add(type: BlockType) {
    if (used.has(type)) return;
    setBlocks((bs) => [...bs, { key: newKey(), type, text: t(`${NS}.blk.${type}.tpl`) }]);
    setAnnounce(t(`${NS}.added`, { block: t(`${NS}.blk.${type}.name`) }));
    setResult(null);
  }
  function update(key: string, text: string) {
    setBlocks((bs) => bs.map((b) => (b.key === key ? { ...b, text } : b)));
    setResult(null);
  }
  function remove(key: string) {
    setBlocks((bs) => bs.filter((b) => b.key !== key));
    setResult(null);
  }
  function move(key: string, dir: -1 | 1) {
    const i = blocks.findIndex((b) => b.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const out = [...blocks];
    [out[i], out[j]] = [out[j], out[i]];
    setBlocks(out);
    setAnnounce(t(`${NS}.moved`, { block: t(`${NS}.blk.${out[j].type}.name`), n: j + 1 }));
  }
  function fillExample(key: string, type: BlockType) {
    if (!sc) return;
    update(key, t(`${NS}.sc.${sc.id}.${type}`));
  }

  function check() {
    if (!sc) return;
    const stars = starsFor(sc, s.total, missing.length);
    if (stars === 0) {
      if (missing.length)
        setFeedback(t(`${NS}.needBlocks`, { list: missing.map((m) => t(`${NS}.blk.${m}.name`)).join(", ") }));
      else setFeedback(t(`${NS}.needScore`, { n: sc.target[0], score: s.total }));
      return;
    }
    setFeedback(null);
    setResult({ stars });
    onComplete({ challengeId: sc.id, stars: stars as 1 | 2 | 3 });
  }

  const tips = liveScore.criteria
    .filter((c) => c.earned < c.points)
    .sort((a, b) => b.points - b.earned - (a.points - a.earned))
    .slice(0, 3);
  const next = nextChallenge(promptBuilder.challenges, scenarioId);
  const G = `${NS}.guide`;

  const guide: StudioGuide = sc
    ? {
        goal: t(`${G}.goal.${sc.id}`),
        steps: [
          t(`${G}.step.read`),
          t(`${G}.step.add`, { list: sc.required.map((r) => t(`${NS}.blk.${r}.name`)).join(", ") }),
          t(`${G}.step.fill`),
          t(`${G}.step.watch`),
          t(`${G}.step.tips`, { n: sc.target[0] }),
          t(`${G}.step.check`),
        ],
        stars: [t(`${G}.star1`, { n: sc.target[0] }), t(`${G}.star2`, { n: sc.target[1] }), t(`${G}.star3`, { n: sc.target[2] })],
        tips: [t(`${G}.tip.${sc.id}`), t(`${G}.tip.reorder`)],
      }
    : {
        goal: t(`${G}.goal.free`),
        steps: [1, 2, 3, 4, 5].map((i) => t(`${G}.free.step${i}`)),
        tips: [t(`${G}.tip.free`), t(`${G}.tip.reorder`)],
      };

  const live = (
    <div className="space-y-3">
      <Meter total={liveScore.total} byDim={liveScore.byDim} target={sc?.target[0]} />
      <LiveReply scenarioId={sc?.id ?? null} naive={sc ? t(`${NS}.sc.${sc.id}.naive`) : ""} blocks={liveBlocks} total={liveScore.total} />
      {tips.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
            <Lightbulb className="h-3.5 w-3.5 text-[#F47C20]" aria-hidden="true" /> {t(`${NS}.tips`)}
          </p>
          <ul className="mt-1.5 space-y-1.5 text-sm text-[var(--ink2)]">
            {tips.map((c) => (
              <li key={c.id}>
                <span className="font-semibold text-[var(--ink)]">+{c.points - c.earned}</span> {t(`${NS}.tip.${c.id}`)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={t(`${NS}.live.title`)}>
      <div className="space-y-3">
        <p className="sr-only" aria-live="polite">{announce}</p>

        {sc ? (
          <div className="rounded-2xl border-2 border-[#F47C20]/40 bg-[#FFF6EE] p-4">
            <p className="text-sm text-[var(--ink)]">{t(`${NS}.sc.${sc.id}.situation`)}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.required`)}</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {sc.required.map((r) => {
                const ok = isFilledIn(blocks, r);
                return (
                  <li key={r} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
                    {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden="true" /> : <Circle className="h-3.5 w-3.5 text-[var(--ink3)]" aria-hidden="true" />}
                    {t(`${NS}.blk.${r}.name`)}
                    <span className="sr-only">{ok ? t(`${NS}.filled`) : t(`${NS}.notFilled`)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-[var(--ink2)]">{t(`${NS}.targetLine`, { a: sc.target[0], b: sc.target[1], c: sc.target[2] })}</p>
          </div>
        ) : (
          <p className="rounded-2xl bg-[var(--s2)] p-4 text-sm text-[var(--ink2)]">{t(`${NS}.freePlayIntro`)}</p>
        )}

        {/* Palette */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.palette`)}</p>
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                draggable={!used.has(type)}
                onDragStart={(e) => e.dataTransfer.setData("text/x-block", type)}
                disabled={used.has(type)}
                onClick={() => add(type)}
                title={t(`${NS}.blk.${type}.hint`)}
                aria-label={t(`${NS}.addBlock`, { block: t(`${NS}.blk.${type}.name`) })}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:opacity-40"
              >
                <span aria-hidden="true">{BLOCK_EMOJI[type]}</span>
                {t(`${NS}.blk.${type}.name`)}
                {!used.has(type) && <Plus className="h-3 w-3" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        {/* Blocks */}
        <div
          ref={listRef}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("text/x-block")) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            const type = e.dataTransfer.getData("text/x-block") as BlockType;
            setDragOver(false);
            if (BLOCK_TYPES.includes(type)) add(type);
          }}
          className={`min-h-[120px] rounded-2xl border-2 border-dashed p-2 ${dragOver ? "border-[#F47C20] bg-[#FFF6EE]" : "border-[var(--border)]"}`}
        >
          {blocks.length === 0 && <p className="p-6 text-center text-sm text-[var(--ink3)]">{t(`${NS}.empty`)}</p>}
          <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-2" aria-label={t(`${NS}.yourPrompt`)}>
            {blocks.map((b, i) => (
              <BlockCard
                key={b.key}
                block={b}
                index={i}
                count={blocks.length}
                hasExample={!!sc}
                onChange={(v) => update(b.key, v)}
                onRemove={() => remove(b.key)}
                onMove={(d) => move(b.key, d)}
                onExample={() => fillExample(b.key, b.type)}
              />
            ))}
          </Reorder.Group>
        </div>

        {sc && !result && (
          <button type="button" onClick={check} className={`${BTN_PRIMARY} w-full`}>
            <Sparkles className="h-4 w-4" aria-hidden="true" /> {t(`${NS}.check`)}
          </button>
        )}
        {feedback && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {feedback}
          </p>
        )}
        {result && sc && (
          <ResultCard
            stars={result.stars}
            body={
              <>
                <p>{t(`${NS}.resultScore`, { score: s.total })}</p>
                <p className="mt-1">{t(`${NS}.sc.${sc.id}.lesson`)}</p>
              </>
            }
            onRetry={() => setResult(null)}
            onNext={next ? () => onNext(next) : undefined}
          />
        )}

        <details className="rounded-2xl border border-[var(--border)] bg-white p-3 text-sm">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.howScored`)}</summary>
          <p className="mt-2 text-xs text-[var(--ink2)]">{t(`${NS}.howScoredBody`)}</p>
          <ul className="mt-2 space-y-1 text-xs">
            {s.criteria.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className={c.earned === c.points ? "text-[var(--ink)]" : "text-[var(--ink3)]"}>
                  {c.earned === c.points ? "✓" : "·"} {t(`${NS}.crit.${c.id}`)}
                </span>
                <span className="shrink-0 tabular-nums text-[var(--ink3)]">
                  {c.earned}/{c.points}
                </span>
              </li>
            ))}
          </ul>
        </details>

        <TryForReal prompt={prompt || t(`${NS}.previewEmpty`)} intro={t(`${NS}.realIntro`)} />
        {!sc && (
          <button type="button" onClick={() => setBlocks([])} className={`${BTN_SECONDARY} w-full`}>
            {t(`${NS}.clear`)}
          </button>
        )}
      </div>
    </StudioFrame>
  );
}

type Source = BlockType | "base";

/**
 * "What the AI would likely give you": a reply composed from pre-written
 * fragments for the scenario. It starts vague and gains tone, facts,
 * structure, flagged assumptions and knock-on effects as blocks are filled in.
 */
function LiveReply({ scenarioId, naive, blocks, total }: { scenarioId: string | null; naive: string; blocks: Block[]; total: number }) {
  const t = useT();
  const reduce = useReducedMotion();
  const L = (part: string) => t(`${NS}.live.${scenarioId ?? "free"}.${part}`);
  const has = (type: BlockType) => isFilledIn(blocks, type);
  // The scenario's naive one-liner is the "before": it still gets the generic answer.
  const taskText = blocks.find((b) => b.type === "task")?.text.trim() ?? "";
  const onTopic = has("task") && taskText !== naive.trim();
  const holes = blocks.filter((b) => placeholders(b.text) > 0).map((b) => t(`${NS}.blk.${b.type}.name`));

  const parts: Array<{ id: string; src: Source; text: string }> = [];
  if (has("format")) parts.push({ id: "format", src: "format", text: L("format") });
  if (has("role")) parts.push({ id: "role", src: "role", text: L("role") });
  if (has("audience")) parts.push({ id: "audience", src: "audience", text: L("audience") });
  if (!onTopic) parts.push({ id: "vague", src: "base", text: L("vague") });
  else if (has("context")) parts.push({ id: "context", src: "context", text: L("context") });
  else parts.push({ id: "task", src: "task", text: L("task") });
  if (has("examples")) parts.push({ id: "examples", src: "examples", text: L("examples") });
  if (has("constraints")) parts.push({ id: "constraints", src: "constraints", text: L("constraints") });
  if (has("checks")) parts.push({ id: "checks", src: "checks", text: L("checks") });
  if (has("systems")) parts.push({ id: "systems", src: "systems", text: L("systems") });
  const fresh = useFresh(parts.map((p) => p.id));

  const stage = total >= 80 ? "ready" : total >= 55 ? "tailored" : onTopic ? "onTopic" : "generic";
  const stageColor = { ready: "bg-green-100 text-green-800", tailored: "bg-[#FFF6EE] text-[#B8500A]", onTopic: "bg-amber-50 text-amber-800", generic: "bg-red-50 text-red-700" }[stage];

  return (
    <section aria-label={t(`${NS}.live.replyLabel`)} className="rounded-2xl border-2 border-[var(--border)] bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
          <span aria-hidden="true">🤖</span> {t(`${NS}.live.replyLabel`)}
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${stageColor}`} aria-live="polite">
          {t(`${NS}.live.stage.${stage}`)}
        </span>
      </div>
      <div className="space-y-2">
        {parts.map((p) => {
          const isNew = fresh.includes(p.id);
          return (
            <div
              key={p.id}
              className={`rounded-xl border-l-4 px-2.5 py-1.5 transition-colors duration-700 motion-reduce:transition-none ${
                p.src === "base" ? "border-red-200 bg-[var(--s2)] text-[var(--ink2)]" : isNew && !reduce ? "border-[#22C55E] bg-green-50" : "border-[#F47C20]/60 bg-white"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink3)]">
                {p.src === "base" ? (
                  t(`${NS}.live.generic`)
                ) : (
                  <>
                    <span aria-hidden="true">{BLOCK_EMOJI[p.src]}</span> {t(`${NS}.live.from`, { block: t(`${NS}.blk.${p.src}.name`) })}
                  </>
                )}
                {isNew && <NewBadge />}
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink)]">{p.text}</p>
            </div>
          );
        })}
      </div>
      {holes.length > 0 && (
        <p className="mt-2 rounded-xl bg-amber-50 p-2 text-xs font-semibold text-amber-800">{t(`${NS}.live.holes`, { list: holes.join(", ") })}</p>
      )}
      <div className="mt-2">
        <Illustrative />
      </div>
    </section>
  );
}

function BlockCard({
  block,
  index,
  count,
  hasExample,
  onChange,
  onRemove,
  onMove,
  onExample,
}: {
  block: Block;
  index: number;
  count: number;
  hasExample: boolean;
  onChange: (v: string) => void;
  onRemove: () => void;
  onMove: (d: -1 | 1) => void;
  onExample: () => void;
}) {
  const t = useT();
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const name = t(`${NS}.blk.${block.type}.name`);
  const holes = placeholders(block.text);
  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ink2)] hover:bg-[var(--s2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:opacity-30";
  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      layout={reduce ? undefined : "position"}
      className="list-none rounded-2xl border-2 border-[var(--border)] bg-white p-2.5 shadow-sm"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t(`${NS}.dragHandle`, { block: name })}
          onPointerDown={(e) => controls.start(e)}
          className={`${iconBtn} cursor-grab touch-none`}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--ink)]">
          <span aria-hidden="true">{BLOCK_EMOJI[block.type]}</span> {name}
        </span>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={t(`${NS}.moveUp`, { block: name })} className={iconBtn}>
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={t(`${NS}.moveDown`, { block: name })} className={iconBtn}>
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onRemove} aria-label={t(`${NS}.remove`, { block: name })} className={iconBtn}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="px-1 text-xs text-[var(--ink3)]">{t(`${NS}.blk.${block.type}.hint`)}</p>
      <textarea
        value={block.text}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(6, Math.max(2, Math.ceil(block.text.length / 60)))}
        aria-label={t(`${NS}.editBlock`, { block: name })}
        className="mt-1.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--s2)] p-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none"
      />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs ${holes ? "font-semibold text-amber-700" : "text-[var(--ink3)]"}`}>
          {holes ? t(`${NS}.holes`, { n: holes }) : ""}
        </span>
        {hasExample && (
          <button type="button" onClick={onExample} className="text-xs font-semibold text-[var(--blue2)] underline">
            {t(`${NS}.useExample`)}
          </button>
        )}
      </div>
    </Reorder.Item>
  );
}

function Meter({ total, byDim, target }: { total: number; byDim: Record<string, number>; target?: number }) {
  const t = useT();
  const color = total >= 80 ? "#16a34a" : total >= 55 ? "#F47C20" : "#dc2626";
  const label = total >= 80 ? t(`${NS}.level.strong`) : total >= 55 ? t(`${NS}.level.ok`) : t(`${NS}.level.weak`);
  return (
    <div className="rounded-2xl border-2 border-[var(--border)] bg-white p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.meter`)}</p>
        <p className="text-2xl font-black tabular-nums" style={{ color }}>
          {total}
          <span className="text-sm text-[var(--ink3)]">/100</span>
        </p>
      </div>
      <div
        className="relative mt-1 h-3 overflow-hidden rounded-full bg-[var(--s2)]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={total}
        aria-valuetext={`${total}/100, ${label}`}
        aria-label={t(`${NS}.meter`)}
      >
        <div className="h-full rounded-full transition-all duration-500 motion-reduce:transition-none" style={{ width: `${total}%`, background: color }} />
        {target !== undefined && <div className="absolute inset-y-0 w-0.5 bg-[var(--ink)]" style={{ left: `${target}%` }} aria-hidden="true" />}
      </div>
      <p className="mt-1 text-xs font-semibold" style={{ color }}>
        {label}
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {DIMENSIONS.map((d) => (
          <li key={d}>
            <div className="flex justify-between text-xs text-[var(--ink2)]">
              <span>{t(`${NS}.dim.${d}`)}</span>
              <span className="tabular-nums">{byDim[d]}/20</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden="true">
              <div className="h-full rounded-full bg-[var(--blue2)] transition-all duration-500 motion-reduce:transition-none" style={{ width: `${(byDim[d] / 20) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
