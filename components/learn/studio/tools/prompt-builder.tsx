"use client";

import { useMemo, useRef, useState } from "react";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, CheckCircle2, Circle, GripVertical, Lightbulb, Plus, Sparkles, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { promptBuilder } from "@/lib/learn/studio/tools/prompt-builder";
import type { StudioToolProps } from "@/lib/learn/studio/types";
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
  ChallengeHeader,
  ChallengePicker,
  CopyButton,
  ResultCard,
  TryForReal,
  nextChallenge,
} from "./prompts/ui";

const NS = "studio.prompt-builder";
let seq = 0;
const newKey = () => `b${++seq}`;

export default function PromptBuilder({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT();
  const [mode, setMode] = useState<"picker" | "play">(challengeId ? "play" : "picker");
  const [current, setCurrent] = useState<string | null>(challengeId);

  function start(id: string | null) {
    setCurrent(id);
    setMode("play");
  }

  if (mode === "picker") {
    return (
      <div className="space-y-4">
        <Intro />
        <ChallengePicker ns={NS} challenges={promptBuilder.challenges} progress={progress} onPick={start} freePlay compact={embedded} />
      </div>
    );
  }
  return (
    <Workbench
      key={current ?? "free"}
      scenarioId={current}
      embedded={!!embedded}
      onBack={() => setMode("picker")}
      onNext={(id) => start(id)}
      onComplete={onComplete}
      t={t}
    />
  );
}

function Intro() {
  const t = useT();
  return (
    <div className="rounded-2xl bg-[var(--s2)] p-4">
      <p className="text-sm text-[var(--ink2)]">{t(`${NS}.intro`)}</p>
    </div>
  );
}

function Workbench({
  scenarioId,
  embedded,
  onBack,
  onNext,
  onComplete,
  t,
}: {
  scenarioId: string | null;
  embedded: boolean;
  onBack: () => void;
  onNext: (id: string) => void;
  onComplete: StudioToolProps["onComplete"];
  t: ReturnType<typeof useT>;
}) {
  const sc = SCENARIOS.find((s) => s.id === scenarioId) ?? null;
  const meta = promptBuilder.challenges.find((c) => c.id === scenarioId) ?? null;
  const [blocks, setBlocks] = useState<Block[]>(() =>
    sc ? [{ key: newKey(), type: "task", text: t(`${NS}.sc.${sc.id}.naive`) }] : [],
  );
  const [result, setResult] = useState<{ stars: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const s = useMemo(() => score(blocks), [blocks]);
  const prompt = assemble(blocks);
  const used = new Set(blocks.map((b) => b.type));
  const isFilled = (type: BlockType) => {
    const b = blocks.find((x) => x.type === type);
    return !!b && b.text.trim().length > 0 && placeholders(b.text) === 0;
  };
  const missing = sc ? sc.required.filter((r) => !isFilled(r)) : [];

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
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const out = [...bs];
      [out[i], out[j]] = [out[j], out[i]];
      setAnnounce(t(`${NS}.moved`, { block: t(`${NS}.blk.${out[j].type}.name`), n: j + 1 }));
      return out;
    });
  }
  function useExample(key: string, type: BlockType) {
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

  const tips = s.criteria
    .filter((c) => c.earned < c.points)
    .sort((a, b) => b.points - b.earned - (a.points - a.earned))
    .slice(0, 3);
  const next = nextChallenge(promptBuilder.challenges, scenarioId);

  return (
    <div>
      <ChallengeHeader ns={NS} challenge={meta} onBack={onBack} />
      <p className="sr-only" aria-live="polite">{announce}</p>

      {sc ? (
        <div className="mb-4 rounded-2xl border-2 border-[#F47C20]/40 bg-[#FFF6EE] p-4">
          <p className="text-sm text-[var(--ink)]">{t(`${NS}.sc.${sc.id}.situation`)}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.required`)}</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {sc.required.map((r) => (
              <li key={r} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
                {isFilled(r) ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden="true" /> : <Circle className="h-3.5 w-3.5 text-[var(--ink3)]" aria-hidden="true" />}
                {t(`${NS}.blk.${r}.name`)}
                <span className="sr-only">{isFilled(r) ? t(`${NS}.filled`) : t(`${NS}.notFilled`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--ink2)]">{t(`${NS}.targetLine`, { a: sc.target[0], b: sc.target[1], c: sc.target[2] })}</p>
        </div>
      ) : (
        <p className="mb-4 rounded-2xl bg-[var(--s2)] p-4 text-sm text-[var(--ink2)]">{t(`${NS}.freePlayIntro`)}</p>
      )}

      <div className={`grid gap-4 ${embedded ? "" : "lg:grid-cols-[1fr_340px]"}`}>
        <div className="min-w-0 space-y-3">
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
                  onExample={() => useExample(b.key, b.type)}
                />
              ))}
            </Reorder.Group>
          </div>
        </div>

        {/* Meter + preview */}
        <div className="min-w-0 space-y-3">
          <Meter total={s.total} byDim={s.byDim} target={sc?.target[0]} />
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

          <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t(`${NS}.preview`)}</p>
              <CopyButton text={prompt} />
            </div>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[var(--ink)]">{prompt || t(`${NS}.previewEmpty`)}</pre>
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
          <TryForReal prompt={prompt || t(`${NS}.previewEmpty`)} intro={t(`${NS}.realIntro`)} />
          {!sc && (
            <button type="button" onClick={() => setBlocks([])} className={`${BTN_SECONDARY} w-full`}>
              {t(`${NS}.clear`)}
            </button>
          )}
        </div>
      </div>
    </div>
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
      layout={reduce ? false : "position"}
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
      <ul className="mt-2 space-y-1.5">
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
