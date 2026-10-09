"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LEVEL_H, LEVEL_W_MAX, LEVEL_W_MIN, MAP_H_MAX, MAP_H_MIN, MAP_W_MAX, MAP_W_MIN, MAX_ITEMS, MAX_LEVELS, MAX_NPCS } from "@/lib/learn/game-forge/schema";
import type { AdventureConfig, ClickerConfig, ConfigIssue, GameConfig, PlatformerConfig, QuizConfig } from "@/lib/learn/game-forge/schema";
import { THEMES, type ThemeName } from "@/lib/learn/game-forge/templates";
import type { ReachResult } from "@/lib/learn/game-forge/reach";
import TileGrid, { TilePalette, paintRows, type PaletteItem } from "./game-forge-tiles";

// Game Forge "Settings": every main value of the game as plain controls, the
// tile editor for platformer levels and the adventure map, and the quest.
// Edits update the working game at once; the preview follows when the game
// is valid, and problems are listed above the controls.

type K = (key: string, vars?: Record<string, string | number>) => string;
type Path = Array<string | number>;

/** An immutable set at a path. */
export function setIn<V>(obj: V, path: Path, value: unknown): V {
  if (!path.length) return value as V;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head as number] = setIn(copy[head as number], rest, value);
    return copy as V;
  }
  const o = (obj ?? {}) as Record<string, unknown>;
  return { ...o, [head]: setIn(o[head as string], rest, value) } as V;
}

const inputCls =
  "min-h-[44px] w-full rounded-xl border-2 border-[#D2DCE8] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]/40";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[var(--ink2)]">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-0.5 block text-[11px] text-[var(--ink3)]">{hint}</span>}
    </label>
  );
}

function Text({ label, value, max, onChange, testId, small }: { label: string; value: string; max: number; onChange: (v: string) => void; testId: string; small?: boolean }) {
  return (
    <Field label={label}>
      <input type="text" value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${small ? "text-center text-lg" : ""}`} data-testid={testId} />
    </Field>
  );
}

function Slider({ label, value, min, max, onChange, testId, step = 1 }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; testId: string; step?: number }) {
  return (
    <Field label={`${label}: ${value}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full accent-[#F47C20]"
        data-testid={testId}
      />
    </Field>
  );
}

function Num({ label, value, min, max, onChange, testId }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; testId: string }) {
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Math.round(Number(e.target.value)))}
        className={inputCls}
        data-testid={testId}
      />
    </Field>
  );
}

function Section({ title, children, testId }: { title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="space-y-3 rounded-2xl border-2 border-[#D2DCE8] bg-white p-3" data-testid={testId}>
      <h3 className="text-sm font-black text-[var(--ink)]">{title}</h3>
      {children}
    </section>
  );
}

function SmallBtn({ onClick, children, testId, danger, disabled, label }: { onClick: () => void; children: ReactNode; testId?: string; danger?: boolean; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 px-3 py-1.5 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:opacity-40 ${
        danger ? "border-[#F5C2C7] bg-white text-[#B02A37] hover:bg-[#FFF5F5]" : "border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#F47C20]"
      }`}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

/** A short, kind sentence for each problem the validator found. */
export function issueText(k: K, i: ConfigIssue): string {
  const code = i.code.replace(":", ".");
  const known = k(`issue.${code}`);
  const what = known === `studio.game-forge.issue.${code}` ? k("issue.other") : known;
  const w = whereOf(k, i.path);
  return w ? `${w}: ${what}` : what;
}

/** Where a problem is, in words ("Question 3", "Level 2", "Title"). */
function whereOf(k: K, path: string): string {
  const p = path.split(".");
  if (!p[0]) return "";
  const n = Number(p[1]) + 1;
  switch (p[0]) {
    case "questions":
      return k("set.quiz.questionN", { n });
    case "levels":
      return k("set.plat.levelN", { n });
    case "npcs":
      return k("where.npc", { n });
    case "items":
      return k("where.item", { n });
    case "map":
      return k("set.adv.map");
    case "quest":
      return k("set.adv.quest");
    case "theme":
      return k("set.theme");
    case "title":
      return k("set.title");
    case "winText":
      return k("set.winText");
    default:
      return k("where.setting");
  }
}

export default function GameSettings({
  config,
  onChange,
  issues,
  reach,
  k,
}: {
  config: GameConfig;
  onChange: (c: GameConfig) => void;
  issues: ConfigIssue[];
  reach: ReachResult[] | null;
  k: K;
}) {
  const set = (path: Path, v: unknown) => onChange(setIn(config, path, v));
  return (
    <div className="space-y-3" data-testid="gf-settings">
      {issues.length > 0 && (
        <div role="alert" className="rounded-xl border-2 border-[#F5C2C7] bg-[#FFF5F5] p-3 text-sm text-[#842029]" data-testid="gf-issues">
          <p className="font-bold">⚠️ {k("set.fixFirst")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {issues.map((i, n) => (
              <li key={n}>{issueText(k, i)}</li>
            ))}
          </ul>
        </div>
      )}

      <Section title={k("set.basics")}>
        <Text label={k("set.title")} value={config.title} max={40} onChange={(v) => set(["title"], v)} testId="gf-title" />
        <Text label={k("set.winText")} value={config.winText} max={140} onChange={(v) => set(["winText"], v)} testId="gf-wintext" />
        <div>
          <p className="text-xs font-bold text-[var(--ink2)]">{k("set.theme")}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {(Object.keys(THEMES) as ThemeName[]).map((name) => {
              const th = THEMES[name];
              const on = th.bg.toLowerCase() === config.theme.bg.toLowerCase() && th.panel.toLowerCase() === config.theme.panel.toLowerCase();
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set(["theme"], { ...th })}
                  className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 px-2.5 py-1 text-xs font-bold ${on ? "border-[#F47C20]" : "border-[#D2DCE8]"}`}
                  style={{ background: th.bg, color: th.text }}
                  data-testid={`gf-theme-${name}`}
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: th.panel }} aria-hidden="true" />
                  {k(`theme.${name}`)}
                </button>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {(["bg", "panel", "text", "accent"] as const).map((c) => (
              <label key={c} className="text-center text-[11px] font-bold text-[var(--ink2)]">
                <input
                  type="color"
                  value={config.theme[c]}
                  onChange={(e) => set(["theme", c], e.target.value.toUpperCase())}
                  className="block h-11 w-full cursor-pointer rounded-lg border-2 border-[#D2DCE8] bg-white"
                  data-testid={`gf-color-${c}`}
                />
                {k(`set.color.${c}`)}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {config.template === "clicker" && <ClickerSettings c={config} set={set} k={k} />}
      {config.template === "quiz" && <QuizSettings c={config} set={set} k={k} />}
      {config.template === "platformer" && <PlatformerSettings c={config} set={set} k={k} reach={reach} />}
      {config.template === "adventure" && <AdventureSettings c={config} set={set} k={k} />}
    </div>
  );
}

type SetFn = (path: Path, v: unknown) => void;

function ClickerSettings({ c, set, k }: { c: ClickerConfig; set: SetFn; k: K }) {
  return (
    <>
      <Section title={k("set.clicker.main")}>
        <div className="grid grid-cols-3 gap-2">
          <Text label={k("set.clicker.clickEmoji")} value={c.clickEmoji} max={16} onChange={(v) => set(["clickEmoji"], v)} testId="gf-click-emoji" small />
          <Text label={k("set.clicker.currencyEmoji")} value={c.currencyEmoji} max={16} onChange={(v) => set(["currencyEmoji"], v)} testId="gf-currency-emoji" small />
          <Text label={k("set.clicker.currencyName")} value={c.currencyName} max={20} onChange={(v) => set(["currencyName"], v)} testId="gf-currency-name" />
        </div>
        <Slider label={k("set.clicker.perClick")} value={c.perClick} min={1} max={50} onChange={(v) => set(["perClick"], v)} testId="gf-perclick" />
        <Num label={k("set.clicker.goal")} value={c.goal} min={10} max={1_000_000} onChange={(v) => set(["goal"], v)} testId="gf-goal" />
      </Section>
      <Section title={k("set.clicker.items")}>
        {c.items.map((it, i) => (
          <div key={i} className="grid grid-cols-[64px_1fr] gap-2 rounded-xl bg-[var(--s2)] p-2" data-testid={`gf-item-${i}`}>
            <Text label={k("set.emoji")} value={it.emoji} max={16} onChange={(v) => set(["items", i, "emoji"], v)} testId={`gf-item-${i}-emoji`} small />
            <Text label={k("set.name")} value={it.name} max={24} onChange={(v) => set(["items", i, "name"], v)} testId={`gf-item-${i}-name`} />
            <Num label={k("set.clicker.cost")} value={it.cost} min={1} max={1_000_000} onChange={(v) => set(["items", i, "cost"], v)} testId={`gf-item-${i}-cost`} />
            <Num label={k("set.clicker.perSecond")} value={it.perSecond} min={0} max={10_000} onChange={(v) => set(["items", i, "perSecond"], v)} testId={`gf-item-${i}-ps`} />
            <div className="col-span-2 flex justify-end">
              <SmallBtn danger disabled={c.items.length <= 1} onClick={() => set(["items"], c.items.filter((_, j) => j !== i))} label={k("set.remove")}>
                <Trash2 size={14} aria-hidden="true" /> {k("set.remove")}
              </SmallBtn>
            </div>
          </div>
        ))}
        <SmallBtn disabled={c.items.length >= 8} onClick={() => set(["items"], [...c.items, { name: k("set.clicker.newItem"), emoji: "⭐", cost: 50, perSecond: 2 }])} testId="gf-add-item">
          <Plus size={14} aria-hidden="true" /> {k("set.clicker.addItem")}
        </SmallBtn>
      </Section>
      <Section title={k("set.clicker.upgrades")}>
        {c.upgrades.map((u, i) => (
          <div key={i} className="grid grid-cols-[64px_1fr] gap-2 rounded-xl bg-[var(--s2)] p-2">
            <Text label={k("set.emoji")} value={u.emoji} max={16} onChange={(v) => set(["upgrades", i, "emoji"], v)} testId={`gf-upgrade-${i}-emoji`} small />
            <Text label={k("set.name")} value={u.name} max={24} onChange={(v) => set(["upgrades", i, "name"], v)} testId={`gf-upgrade-${i}-name`} />
            <Num label={k("set.clicker.cost")} value={u.cost} min={1} max={1_000_000} onChange={(v) => set(["upgrades", i, "cost"], v)} testId={`gf-upgrade-${i}-cost`} />
            <Num label={k("set.clicker.clickBonus")} value={u.clickBonus} min={1} max={1000} onChange={(v) => set(["upgrades", i, "clickBonus"], v)} testId={`gf-upgrade-${i}-bonus`} />
            <div className="col-span-2 flex justify-end">
              <SmallBtn danger onClick={() => set(["upgrades"], c.upgrades.filter((_, j) => j !== i))} label={k("set.remove")}>
                <Trash2 size={14} aria-hidden="true" /> {k("set.remove")}
              </SmallBtn>
            </div>
          </div>
        ))}
        <SmallBtn disabled={c.upgrades.length >= 8} onClick={() => set(["upgrades"], [...c.upgrades, { name: k("set.clicker.newUpgrade"), emoji: "🚀", cost: 200, clickBonus: 2 }])} testId="gf-add-upgrade">
          <Plus size={14} aria-hidden="true" /> {k("set.clicker.addUpgrade")}
        </SmallBtn>
      </Section>
    </>
  );
}

function QuizSettings({ c, set, k }: { c: QuizConfig; set: SetFn; k: K }) {
  return (
    <>
      <Section title={k("set.quiz.main")}>
        <Text label={k("set.quiz.topic")} value={c.topic} max={40} onChange={(v) => set(["topic"], v)} testId="gf-topic" />
        <Slider label={k("set.quiz.timer")} value={c.timer} min={5} max={60} onChange={(v) => set(["timer"], v)} testId="gf-timer" />
        <Slider label={k("set.quiz.lives")} value={c.lives} min={1} max={5} onChange={(v) => set(["lives"], v)} testId="gf-lives" />
      </Section>
      <Section title={k("set.quiz.questions", { n: c.questions.length })} testId="gf-questions">
        {c.questions.map((q, i) => (
          <fieldset key={i} className="space-y-2 rounded-xl bg-[var(--s2)] p-2" data-testid={`gf-q-${i}`}>
            <legend className="sr-only">{k("set.quiz.questionN", { n: i + 1 })}</legend>
            <Field label={k("set.quiz.questionN", { n: i + 1 })}>
              <input type="text" value={q.q} maxLength={140} onChange={(e) => set(["questions", i, "q"], e.target.value)} className={inputCls} data-testid={`gf-q-${i}-text`} />
            </Field>
            <div className="space-y-1.5" role="radiogroup" aria-label={k("set.quiz.rightAnswer")}>
              {q.answers.map((a, j) => (
                <div key={j} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`gf-q-${i}-correct`}
                    checked={q.correct === j}
                    onChange={() => set(["questions", i, "correct"], j)}
                    aria-label={k("set.quiz.markRight", { n: j + 1 })}
                    className="h-6 w-6 shrink-0 accent-[#2F9E44]"
                    data-testid={`gf-q-${i}-correct-${j}`}
                  />
                  <input
                    type="text"
                    value={a}
                    maxLength={60}
                    onChange={(e) => set(["questions", i, "answers", j], e.target.value)}
                    aria-label={k("set.quiz.answerN", { n: j + 1 })}
                    className={inputCls}
                    data-testid={`gf-q-${i}-a-${j}`}
                  />
                  <SmallBtn
                    danger
                    disabled={q.answers.length <= 2}
                    label={k("set.remove")}
                    onClick={() => {
                      const answers = q.answers.filter((_, x) => x !== j);
                      set(["questions", i], { ...q, answers, correct: q.correct === j ? 0 : q.correct > j ? q.correct - 1 : q.correct });
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </SmallBtn>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <SmallBtn disabled={q.answers.length >= 4} onClick={() => set(["questions", i, "answers"], [...q.answers, ""])} testId={`gf-q-${i}-add-answer`}>
                <Plus size={14} aria-hidden="true" /> {k("set.quiz.addAnswer")}
              </SmallBtn>
              <SmallBtn danger disabled={c.questions.length <= 1} onClick={() => set(["questions"], c.questions.filter((_, x) => x !== i))} testId={`gf-q-${i}-remove`}>
                <Trash2 size={14} aria-hidden="true" /> {k("set.quiz.removeQuestion")}
              </SmallBtn>
            </div>
          </fieldset>
        ))}
        <SmallBtn
          disabled={c.questions.length >= 20}
          onClick={() => set(["questions"], [...c.questions, { q: "", answers: ["", ""], correct: 0 }])}
          testId="gf-add-question"
        >
          <Plus size={14} aria-hidden="true" /> {k("set.quiz.addQuestion")}
        </SmallBtn>
      </Section>
    </>
  );
}

const PLAT_LOOK = (c: PlatformerConfig, k: K): Record<string, { bg: string; icon?: string; name: string }> => ({
  ".": { bg: "#FFFFFF", name: k("tile.empty") },
  "#": { bg: c.theme.panel, name: k("tile.ground") },
  C: { bg: "#FFFFFF", icon: c.coinEmoji, name: k("tile.coin") },
  E: { bg: "#FFFFFF", icon: c.enemyEmoji, name: k("tile.enemy") },
  L: { bg: "#FF6B00", icon: "", name: k("tile.lava") },
  P: { bg: "#FFFFFF", icon: c.playerEmoji, name: k("tile.start") },
  G: { bg: "#FFFFFF", icon: c.goalEmoji, name: k("tile.goal") },
});

function blankLevel(name: string, w = 24): { name: string; rows: string[] } {
  const rows = Array.from({ length: LEVEL_H }, () => ".".repeat(w));
  rows[LEVEL_H - 1] = "#".repeat(w);
  rows[LEVEL_H - 2] = ".P" + ".".repeat(w - 4) + "G.";
  return { name, rows };
}

function PlatformerSettings({ c, set, k, reach }: { c: PlatformerConfig; set: SetFn; k: K; reach: ReachResult[] | null }) {
  const [li, setLi] = useState(0);
  const [paint, setPaint] = useState("#");
  const lv = c.levels[Math.min(li, c.levels.length - 1)];
  const idx = Math.min(li, c.levels.length - 1);
  const look = PLAT_LOOK(c, k);
  const palette: PaletteItem[] = ["#", ".", "C", "E", "L", "P", "G"].map((ch) => ({ id: ch, label: look[ch].name, icon: ch === "#" ? "🟩" : ch === "." ? "⬜" : ch === "L" ? "🟧" : look[ch].icon ?? "" }));
  const w = lv.rows[0].length;
  const resize = (nw: number) =>
    set(
      ["levels", idx, "rows"],
      lv.rows.map((r, y) => (nw > r.length ? r + (y === LEVEL_H - 1 ? "#" : ".").repeat(nw - r.length) : r.slice(0, nw))),
    );
  const r = reach?.[idx];
  return (
    <>
      <Section title={k("set.plat.main")}>
        <div className="grid grid-cols-4 gap-2">
          <Text label={k("tile.start")} value={c.playerEmoji} max={16} onChange={(v) => set(["playerEmoji"], v)} testId="gf-player-emoji" small />
          <Text label={k("tile.coin")} value={c.coinEmoji} max={16} onChange={(v) => set(["coinEmoji"], v)} testId="gf-coin-emoji" small />
          <Text label={k("tile.enemy")} value={c.enemyEmoji} max={16} onChange={(v) => set(["enemyEmoji"], v)} testId="gf-enemy-emoji" small />
          <Text label={k("tile.goal")} value={c.goalEmoji} max={16} onChange={(v) => set(["goalEmoji"], v)} testId="gf-goal-emoji" small />
        </div>
        <Slider label={k("set.plat.speed")} value={c.speed} min={1} max={10} onChange={(v) => set(["speed"], v)} testId="gf-speed" />
        <Slider label={k("set.plat.jump")} value={c.jump} min={1} max={10} onChange={(v) => set(["jump"], v)} testId="gf-jump" />
        <Slider label={k("set.plat.gravity")} value={c.gravity} min={1} max={10} onChange={(v) => set(["gravity"], v)} testId="gf-gravity" />
        <Slider label={k("set.plat.lives")} value={c.lives} min={1} max={9} onChange={(v) => set(["lives"], v)} testId="gf-lives" />
      </Section>
      <Section title={k("set.plat.levels")} testId="gf-levels">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={k("set.plat.levels")}>
          {c.levels.map((l, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === idx}
              onClick={() => setLi(i)}
              className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 px-3 py-1 text-xs font-bold ${i === idx ? "border-[#F47C20] bg-[#FFF4EB]" : "border-[#D2DCE8] bg-white"}`}
              data-testid={`gf-level-tab-${i}`}
            >
              {reach?.[i] ? (reach[i].ok ? "✅" : "⚠️") : ""} {k("set.plat.levelN", { n: i + 1 })}
            </button>
          ))}
          <SmallBtn
            disabled={c.levels.length >= MAX_LEVELS}
            onClick={() => {
              set(["levels"], [...c.levels, blankLevel(k("set.plat.newLevel", { n: c.levels.length + 1 }))]);
              setLi(c.levels.length);
            }}
            testId="gf-add-level"
          >
            <Plus size={14} aria-hidden="true" /> {k("set.plat.addLevel")}
          </SmallBtn>
        </div>
        <Text label={k("set.plat.levelName")} value={lv.name} max={30} onChange={(v) => set(["levels", idx, "name"], v)} testId={`gf-level-${idx}-name`} />
        {r && (
          <p
            role="status"
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${r.ok ? "bg-[#E8F7EF] text-[#0B5A33]" : "bg-[#FFF4E6] text-[#8A4B00]"}`}
            data-testid={`gf-reach-${idx}`}
            data-ok={r.ok ? "true" : "false"}
          >
            {r.ok ? `✅ ${k("reach.ok")}` : `⚠️ ${k(`reach.${r.reason}`)}`}
          </p>
        )}
        <TilePalette items={palette} value={paint} onPick={setPaint} testPrefix="gf" />
        <TileGrid
          rows={lv.rows}
          look={look}
          onTap={(x, y) => set(["levels", idx, "rows"], paintRows(lv.rows, x, y, paint))}
          label={k("set.plat.gridLabel", { n: idx + 1 })}
          testPrefix={`gf-level-${idx}`}
          cellLabel={(x, y, name) => k("set.cell", { x: x + 1, y: y + 1, name })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SmallBtn disabled={w <= LEVEL_W_MIN} onClick={() => resize(w - 2)} testId="gf-level-narrower">
            ↔︎ {k("set.narrower")}
          </SmallBtn>
          <SmallBtn disabled={w >= LEVEL_W_MAX} onClick={() => resize(w + 2)} testId="gf-level-wider">
            ↔︎ {k("set.wider")}
          </SmallBtn>
          <span className="text-xs text-[var(--ink3)]">{k("set.size", { w, h: LEVEL_H })}</span>
          <span className="flex-1" />
          <SmallBtn
            danger
            disabled={c.levels.length <= 1}
            onClick={() => {
              set(["levels"], c.levels.filter((_, i) => i !== idx));
              setLi(Math.max(0, idx - 1));
            }}
            testId="gf-remove-level"
          >
            <Trash2 size={14} aria-hidden="true" /> {k("set.plat.removeLevel")}
          </SmallBtn>
        </div>
      </Section>
    </>
  );
}

function AdventureSettings({ c, set, k }: { c: AdventureConfig; set: SetFn; k: K }) {
  const [paint, setPaint] = useState("#");
  const rows = c.map.rows;
  const look: Record<string, { bg: string; icon?: string; name: string }> = {
    ".": { bg: "#FFFFFF", name: k("tile.floor") },
    "#": { bg: c.theme.panel, name: k("tile.wall") },
    T: { bg: "#EBFBEE", icon: "🌳", name: k("tile.tree") },
    "~": { bg: "#74C0FC", icon: "", name: k("tile.water") },
    P: { bg: "#FFFFFF", icon: c.playerEmoji, name: k("tile.start") },
  };
  const palette: PaletteItem[] = [
    ...["#", ".", "T", "~", "P"].map((ch) => ({ id: ch, label: look[ch].name, icon: ch === "#" ? "🧱" : ch === "." ? "⬜" : ch === "~" ? "🌊" : look[ch].icon ?? "" })),
    ...c.npcs.map((n, i) => ({ id: `@npc:${i}`, label: n.name, icon: n.emoji })),
    ...c.items.map((it, i) => ({ id: `@item:${i}`, label: it.name, icon: it.emoji })),
  ];
  const markers = [
    ...c.npcs.map((n) => ({ x: n.x, y: n.y, icon: n.emoji, label: n.name })),
    ...c.items.map((it) => ({ x: it.x, y: it.y, icon: it.emoji, label: it.name })),
  ];
  const tap = (x: number, y: number) => {
    const m = /^@(npc|item):(\d)$/.exec(paint);
    if (m) {
      if (rows[y][x] !== ".") return;
      const list = m[1] === "npc" ? "npcs" : "items";
      set([list, Number(m[2])], { ...(list === "npcs" ? c.npcs : c.items)[Number(m[2])], x, y });
      return;
    }
    set(["map", "rows"], paintRows(rows, x, y, paint));
  };
  const w = rows[0].length;
  const h = rows.length;
  const free = (): { x: number; y: number } => {
    const taken = new Set(markers.map((m) => `${m.x},${m.y}`));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === "." && !taken.has(`${x},${y}`)) return { x, y };
    return { x: 0, y: 0 };
  };
  return (
    <>
      <Section title={k("set.adv.map")} testId="gf-map">
        <Text label={k("tile.start")} value={c.playerEmoji} max={16} onChange={(v) => set(["playerEmoji"], v)} testId="gf-player-emoji" small />
        <TilePalette items={palette} value={paint} onPick={setPaint} testPrefix="gf" />
        <p className="text-xs text-[var(--ink3)]">{k("set.adv.placeHint")}</p>
        <TileGrid
          rows={rows}
          look={look}
          markers={markers}
          onTap={tap}
          label={k("set.adv.gridLabel")}
          testPrefix="gf-map"
          cellLabel={(x, y, name) => k("set.cell", { x: x + 1, y: y + 1, name })}
        />
        <div className="flex flex-wrap gap-2">
          <SmallBtn disabled={w <= MAP_W_MIN} onClick={() => set(["map", "rows"], rows.map((r) => r.slice(0, w - 1)))}>↔︎ {k("set.narrower")}</SmallBtn>
          <SmallBtn disabled={w >= MAP_W_MAX} onClick={() => set(["map", "rows"], rows.map((r) => r + "."))}>↔︎ {k("set.wider")}</SmallBtn>
          <SmallBtn disabled={h <= MAP_H_MIN} onClick={() => set(["map", "rows"], rows.slice(0, h - 1))}>↕︎ {k("set.shorter")}</SmallBtn>
          <SmallBtn disabled={h >= MAP_H_MAX} onClick={() => set(["map", "rows"], [...rows, ".".repeat(w)])}>↕︎ {k("set.taller")}</SmallBtn>
          <span className="self-center text-xs text-[var(--ink3)]">{k("set.size", { w, h })}</span>
        </div>
      </Section>

      <Section title={k("set.adv.npcs")} testId="gf-npcs">
        {c.npcs.map((n, i) => (
          <div key={i} className="space-y-2 rounded-xl bg-[var(--s2)] p-2" data-testid={`gf-npc-${i}`}>
            <div className="grid grid-cols-[64px_1fr] gap-2">
              <Text label={k("set.emoji")} value={n.emoji} max={16} onChange={(v) => set(["npcs", i, "emoji"], v)} testId={`gf-npc-${i}-emoji`} small />
              <Text label={k("set.name")} value={n.name} max={24} onChange={(v) => set(["npcs", i, "name"], v)} testId={`gf-npc-${i}-name`} />
            </div>
            <Text label={k("set.adv.personality")} value={n.personality} max={100} onChange={(v) => set(["npcs", i, "personality"], v)} testId={`gf-npc-${i}-personality`} />
            <Text label={k("set.adv.greeting")} value={n.greeting} max={140} onChange={(v) => set(["npcs", i, "greeting"], v)} testId={`gf-npc-${i}-greeting`} />
            <Field label={k("set.adv.lines")} hint={k("set.adv.linesHint")}>
              <textarea
                value={n.lines.join("\n")}
                rows={3}
                onChange={(e) => set(["npcs", i, "lines"], e.target.value.split("\n").slice(0, 6))}
                className={inputCls}
                data-testid={`gf-npc-${i}-lines`}
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {n.ai && <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[11px] font-bold text-[#5F3DC4]">✨ {k("set.adv.aiMade")}</span>}
              <SmallBtn
                danger
                onClick={() => {
                  const npcs = c.npcs.filter((_, j) => j !== i);
                  const quest = c.quest && c.quest.giver !== i ? { ...c.quest, giver: c.quest.giver > i ? c.quest.giver - 1 : c.quest.giver } : null;
                  onChangeBoth(set, npcs, quest);
                }}
                testId={`gf-npc-${i}-remove`}
              >
                <Trash2 size={14} aria-hidden="true" /> {k("set.remove")}
              </SmallBtn>
            </div>
          </div>
        ))}
        <SmallBtn
          disabled={c.npcs.length >= MAX_NPCS}
          onClick={() => set(["npcs"], [...c.npcs, { name: k("set.adv.newNpc"), emoji: "🧙", ...free(), personality: "", greeting: "", lines: [] }])}
          testId="gf-add-npc"
        >
          <Plus size={14} aria-hidden="true" /> {k("set.adv.addNpc")}
        </SmallBtn>
      </Section>

      <Section title={k("set.adv.items")} testId="gf-items">
        {c.items.map((it, i) => (
          <div key={i} className="grid grid-cols-[64px_1fr_auto] items-end gap-2 rounded-xl bg-[var(--s2)] p-2">
            <Text label={k("set.emoji")} value={it.emoji} max={16} onChange={(v) => set(["items", i, "emoji"], v)} testId={`gf-adv-item-${i}-emoji`} small />
            <Text label={k("set.name")} value={it.name} max={24} onChange={(v) => set(["items", i, "name"], v)} testId={`gf-adv-item-${i}-name`} />
            <SmallBtn
              danger
              label={k("set.remove")}
              onClick={() => {
                const items = c.items.filter((_, j) => j !== i);
                const quest = c.quest && c.quest.item !== i ? { ...c.quest, item: c.quest.item > i ? c.quest.item - 1 : c.quest.item } : null;
                set([], { ...c, items, quest });
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
            </SmallBtn>
          </div>
        ))}
        <SmallBtn disabled={c.items.length >= MAX_ITEMS} onClick={() => set(["items"], [...c.items, { name: k("set.adv.newItem"), emoji: "⭐", ...free() }])} testId="gf-add-adv-item">
          <Plus size={14} aria-hidden="true" /> {k("set.adv.addItem")}
        </SmallBtn>
      </Section>

      <Section title={k("set.adv.quest")} testId="gf-quest">
        <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <input
            type="checkbox"
            checked={!!c.quest}
            disabled={!c.quest && (!c.npcs.length || !c.items.length)}
            onChange={(e) => set(["quest"], e.target.checked ? { giver: 0, item: 0, ask: k("set.adv.defaultAsk", { item: c.items[0]?.name ?? "" }), thanks: k("set.adv.defaultThanks") } : null)}
            className="h-5 w-5 accent-[#F47C20]"
            data-testid="gf-quest-on"
          />
          {k("set.adv.questOn")}
        </label>
        {c.quest && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label={k("set.adv.giver")}>
                <select value={c.quest.giver} onChange={(e) => set(["quest", "giver"], Number(e.target.value))} className={inputCls} data-testid="gf-quest-giver">
                  {c.npcs.map((n, i) => (
                    <option key={i} value={i}>{`${n.emoji} ${n.name}`}</option>
                  ))}
                </select>
              </Field>
              <Field label={k("set.adv.questItem")}>
                <select value={c.quest.item} onChange={(e) => set(["quest", "item"], Number(e.target.value))} className={inputCls} data-testid="gf-quest-item">
                  {c.items.map((it, i) => (
                    <option key={i} value={i}>{`${it.emoji} ${it.name}`}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Text label={k("set.adv.ask")} value={c.quest.ask} max={140} onChange={(v) => set(["quest", "ask"], v)} testId="gf-quest-ask" />
            <Text label={k("set.adv.thanks")} value={c.quest.thanks} max={140} onChange={(v) => set(["quest", "thanks"], v)} testId="gf-quest-thanks" />
          </>
        )}
      </Section>
    </>
  );

  function onChangeBoth(s: SetFn, npcs: AdventureConfig["npcs"], quest: AdventureConfig["quest"]) {
    s([], { ...c, npcs, quest });
  }
}
