"use client";

import { useRef, useState } from "react";
import { History, Send, Sparkles, Wand2 } from "lucide-react";
import { applyOps } from "@/lib/learn/game-forge/patch";
import { quickChanges } from "@/lib/learn/game-forge/quick";
import type { GameConfig } from "@/lib/learn/game-forge/schema";
import type { VersionSummary } from "@/lib/learn/game-forge/db";

// Game Forge "Change it": talk to the AI ("make the player jump higher and add
// a lava level"), one-tap quick changes that need no AI, AI characters for
// the adventure, and the version history. Every change comes back as a
// proposal the kid previews, then applies or undoes (the parent component).

type K = (key: string, vars?: Record<string, string | number>) => string;

export interface Proposal {
  config: GameConfig;
  say: string;
  source: "ai" | "quick" | "character" | "restore";
  note: string;
}

interface Msg {
  id: number;
  who: "kid" | "ai" | "note";
  text: string;
  error?: boolean;
}

const MAX_REQUEST = 300;

async function callAi(body: Record<string, unknown>): Promise<{ ok: true; config: GameConfig; say: string; changed: boolean } | { ok: false; error: string; code?: string }> {
  const res = await fetch("/api/learn/game-forge/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  const d = res ? await res.json().catch(() => ({})) : {};
  if (!res || !res.ok) return { ok: false, error: typeof d.error === "string" ? d.error : "", code: d.code };
  return { ok: true, config: d.config, say: typeof d.say === "string" ? d.say : "", changed: !!d.changed };
}

export default function ChangePanel({
  config,
  k,
  onProposal,
  pending,
  versions,
  onPreviewVersion,
  onSaveVersion,
  canSave,
  dates,
}: {
  config: GameConfig;
  k: K;
  onProposal: (p: Proposal) => void;
  /** A proposal is on screen: new changes wait until it is applied or undone. */
  pending: boolean;
  versions: VersionSummary[];
  onPreviewVersion: (n: number) => void;
  onSaveVersion: () => void;
  canSave: boolean;
  dates: (iso: string) => string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [ideaFor, setIdeaFor] = useState<number | null>(null);
  const [idea, setIdea] = useState("");
  const nextId = useRef(1);
  const add = (m: Omit<Msg, "id">) => setMsgs((l) => [...l.slice(-11), { ...m, id: nextId.current++ }]);

  const fail = (error: string, code?: string) =>
    add({ who: "ai", error: true, text: `${error || k("chat.failed")}${code && code !== "filtered" ? ` ${k("chat.tryQuick")}` : ""}` });

  async function send(text: string) {
    const request = text.trim().slice(0, MAX_REQUEST);
    if (!request || busy || pending) return;
    setInput("");
    add({ who: "kid", text: request });
    setBusy("chat");
    const r = await callAi({ mode: "change", config, request });
    setBusy(null);
    if (!r.ok) return fail(r.error, r.code ?? "ai_error");
    add({ who: "ai", text: r.say || (r.changed ? k("chat.done") : k("chat.nothing")) });
    if (r.changed) onProposal({ config: r.config, say: r.say || k("chat.done"), source: "ai", note: r.say || k("history.ai") });
  }

  function quick(id: string, ops: unknown[]) {
    if (pending) return;
    if (!ops.length) return add({ who: "note", text: k("quick.max") });
    const r = applyOps(config, ops);
    if (!r.ok) return add({ who: "note", error: true, text: k("quick.cannot") });
    onProposal({ config: r.config, say: k(`quick.${id}.done`), source: "quick", note: k(`quick.${id}`) });
  }

  async function makeCharacter(i: number) {
    const text = idea.trim().slice(0, 200);
    if (!text || busy || pending || config.template !== "adventure") return;
    setBusy(`npc-${i}`);
    const r = await callAi({ mode: "character", config, npc: i, idea: text });
    setBusy(null);
    if (!r.ok) return fail(r.error, r.code ?? "ai_error");
    setIdea("");
    setIdeaFor(null);
    const name = r.config.template === "adventure" ? r.config.npcs[i]?.name ?? "" : "";
    add({ who: "ai", text: k("chars.made", { name }) });
    onProposal({ config: r.config, say: k("chars.made", { name }), source: "character", note: k("history.character", { name }) });
  }

  const ideas = [1, 2, 3].map((n) => k(`ideas.${config.template}.${n}`));
  const chip =
    "inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-2 border-[#D2DCE8] bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:opacity-40";

  return (
    <div className="space-y-3" data-testid="gf-change">
      {/* Talk to change it */}
      <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3">
        <h3 className="flex items-center gap-1.5 text-sm font-black text-[var(--ink)]">
          <Wand2 size={16} className="text-[#7048E8]" aria-hidden="true" /> {k("chat.title")}
        </h3>
        <p className="mt-1 text-xs text-[var(--ink2)]">{k("chat.intro")}</p>
        {msgs.length > 0 && (
          <ol className="mt-3 max-h-64 space-y-2 overflow-y-auto" aria-live="polite" data-testid="gf-chat-log">
            {msgs.map((m) => (
              <li
                key={m.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                  m.who === "kid"
                    ? "ml-auto bg-[#1B3A6B] text-white"
                    : m.error
                      ? "bg-[#FFF4E6] text-[#8A4B00]"
                      : m.who === "note"
                        ? "bg-[var(--s2)] text-[var(--ink2)]"
                        : "bg-[#F3F0FF] text-[#3B2A7A]"
                }`}
                data-testid="gf-chat-msg"
                data-who={m.who}
              >
                {m.who === "ai" && <span aria-hidden="true">{m.error ? "🤔 " : "✨ "}</span>}
                {m.text}
              </li>
            ))}
          </ol>
        )}
        {busy === "chat" && (
          <p className="mt-2 text-xs font-semibold text-[#7048E8]" role="status">
            ✨ {k("chat.thinking")}
          </p>
        )}
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label className="sr-only" htmlFor="gf-chat-input">{k("chat.label")}</label>
          <textarea
            id="gf-chat-input"
            value={input}
            maxLength={MAX_REQUEST}
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={k(`chat.placeholder.${config.template}`)}
            className="min-h-[52px] flex-1 resize-none rounded-xl border-2 border-[#D2DCE8] px-3 py-2 text-sm focus:border-[#7048E8] focus:outline-none"
            disabled={pending}
            data-testid="gf-chat-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || !!busy || pending}
            className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl bg-[#7048E8] px-3 text-white hover:bg-[#5F3DC4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7048E8] focus-visible:ring-offset-2 disabled:opacity-40"
            aria-label={k("chat.send")}
            data-testid="gf-chat-send"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
        {pending && <p className="mt-2 text-xs font-semibold text-[#8A4B00]">{k("chat.pending")}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ideas.map((t, i) => (
            <button key={i} type="button" className={chip} onClick={() => setInput(t)} disabled={pending} data-testid={`gf-idea-${i}`}>
              💡 {t}
            </button>
          ))}
        </div>
      </section>

      {/* Quick changes */}
      <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3">
        <h3 className="text-sm font-black text-[var(--ink)]">⚡ {k("quick.title")}</h3>
        <p className="mt-1 text-xs text-[var(--ink2)]">{k("quick.intro")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickChanges(config.template).map((q) => (
            <button key={q.id} type="button" className={chip} disabled={pending} onClick={() => quick(q.id, q.ops(config))} data-testid={`gf-quick-${q.id}`}>
              <span aria-hidden="true">{q.icon}</span> {k(`quick.${q.id}`)}
            </button>
          ))}
        </div>
      </section>

      {/* AI characters (adventure) */}
      {config.template === "adventure" && (
        <section className="rounded-2xl border-2 border-[#D9CCFF] bg-[#FAF8FF] p-3" data-testid="gf-chars">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-[var(--ink)]">
            <Sparkles size={16} className="text-[#7048E8]" aria-hidden="true" /> {k("chars.title")}
          </h3>
          <p className="mt-1 text-xs text-[var(--ink2)]">{k("chars.intro")}</p>
          {config.npcs.length === 0 && <p className="mt-2 text-sm text-[var(--ink3)]">{k("chars.none")}</p>}
          <ul className="mt-2 space-y-2">
            {config.npcs.map((n, i) => (
              <li key={i} className="rounded-xl border border-[#D9CCFF] bg-white p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 text-sm">
                    <span aria-hidden="true" className="text-xl">{n.emoji}</span> <strong>{n.name}</strong>
                    {n.ai && <span className="ml-1 rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[11px] font-bold text-[#5F3DC4]">✨ {k("set.adv.aiMade")}</span>}
                    {n.personality && <span className="block text-xs text-[var(--ink2)]">{n.personality}</span>}
                  </span>
                  <button
                    type="button"
                    className={chip}
                    disabled={pending || !!busy}
                    aria-expanded={ideaFor === i}
                    onClick={() => {
                      setIdeaFor(ideaFor === i ? null : i);
                      setIdea("");
                    }}
                    data-testid={`gf-npc-ai-${i}`}
                  >
                    ✨ {n.ai ? k("chars.redo") : k("chars.make")}
                  </button>
                </div>
                {ideaFor === i && (
                  <form
                    className="mt-2 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      makeCharacter(i);
                    }}
                  >
                    <label className="block text-xs font-bold text-[var(--ink2)]" htmlFor={`gf-npc-idea-${i}`}>
                      {k("chars.ideaLabel", { name: n.name })}
                    </label>
                    <input
                      id={`gf-npc-idea-${i}`}
                      type="text"
                      value={idea}
                      maxLength={200}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder={k("chars.ideaPh")}
                      className="min-h-[44px] w-full rounded-xl border-2 border-[#D2DCE8] px-3 py-2 text-sm focus:border-[#7048E8] focus:outline-none"
                      data-testid={`gf-npc-idea-${i}`}
                    />
                    <button
                      type="submit"
                      disabled={!idea.trim() || !!busy}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#7048E8] px-4 py-2 text-sm font-bold text-white hover:bg-[#5F3DC4] disabled:opacity-40"
                      data-testid={`gf-npc-make-${i}`}
                    >
                      <Sparkles size={15} aria-hidden="true" /> {busy === `npc-${i}` ? k("chat.thinking") : k("chars.create")}
                    </button>
                    <p className="text-[11px] text-[var(--ink3)]">{k("chars.once")}</p>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Versions */}
      <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3" data-testid="gf-history">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-[var(--ink)]">
            <History size={16} aria-hidden="true" /> {k("history.title")}
          </h3>
          <button type="button" className={chip} onClick={onSaveVersion} disabled={!canSave || pending} data-testid="gf-save-version">
            💾 {k("history.save")}
          </button>
        </div>
        {versions.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--ink3)]">{k("history.empty")}</p>
        ) : (
          <ol className="mt-2 divide-y divide-[var(--border)]">
            {versions.map((v, i) => (
              <li key={v.n} className="flex items-center justify-between gap-2 py-2 text-sm" data-testid={`gf-version-${v.n}`}>
                <span className="min-w-0">
                  <strong className="text-[var(--ink3)]">#{v.n}</strong> {k(`history.source.${v.source}`)}
                  {v.note && <span className="block truncate text-xs text-[var(--ink2)]">{v.note}</span>}
                  <span className="block text-[11px] text-[var(--ink3)]">{dates(v.createdAt)}</span>
                </span>
                {i === 0 ? (
                  <span className="shrink-0 rounded-full bg-[#E8F7EF] px-2 py-0.5 text-[11px] font-bold text-[#0B5A33]">{k("history.current")}</span>
                ) : (
                  <button type="button" className={chip} disabled={pending} onClick={() => onPreviewVersion(v.n)} data-testid={`gf-version-${v.n}-preview`}>
                    ↩︎ {k("history.preview")}
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
