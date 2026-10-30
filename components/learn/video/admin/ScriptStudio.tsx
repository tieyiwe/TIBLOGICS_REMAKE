"use client";

import { useEffect, useState } from "react";
import { Copy, FileText, MonitorPlay, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import Teleprompter from "./Teleprompter";
import {
  SECTION_KINDS,
  WORDS_PER_MINUTE,
  countWords,
  formatTime,
  scriptChapters,
  scriptSeconds,
  scriptToDraftVtt,
  type Chapter,
  type ScriptSection,
  type SectionKind,
  type VideoScript,
} from "@/lib/learn/video/shared";

// Video script and storyboard for one lesson (staff only). "Generate" drafts
// a 3-5 minute script from the lesson with AI; every save is a new version.
// From a script: a storyboard table, a teleprompter, and draft captions.

const inputCls =
  "w-full px-3 py-2 border border-[#D2DCE8] rounded-lg text-sm font-dm text-[#0D1B2A] bg-white placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]";
const labelCls = "block font-dm text-xs font-semibold text-[#3A4A5C] mb-1";
const btn = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-dm font-semibold disabled:opacity-50";
const btnPrimary = `${btn} bg-[#1B3A6B] text-white hover:bg-[#2251A3]`;
const btnAccent = `${btn} bg-[#F47C20] text-white hover:bg-[#E05F00]`;
const btnGhost = `${btn} text-[#2251A3] hover:bg-[#EBF0FA]`;
const btnDanger = `${btn} text-red-600 hover:bg-red-50`;

const KIND_LABEL: Record<SectionKind, string> = { hook: "Hook", point: "Key point", walkthrough: "Screen walkthrough", recap: "Recap", cta: "Call to action" };
const KIND_STYLE: Record<SectionKind, string> = {
  hook: "bg-[#FEF0E3] text-[#E05F00]",
  point: "bg-[#EBF0FA] text-[#2251A3]",
  walkthrough: "bg-purple-50 text-purple-700",
  recap: "bg-green-50 text-green-700",
  cta: "bg-[#0D1B2A] text-white",
};

interface VersionInfo {
  version: number;
  source: string;
  createdBy: string | null;
  createdAt: string;
}

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export default function ScriptStudio({
  lessonId,
  onUseCaptions,
  onUseChapters,
}: {
  lessonId: string;
  onUseCaptions: (vtt: string) => void;
  onUseChapters: (c: Chapter[]) => void;
}) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [version, setVersion] = useState<number | null>(null);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"generate" | "save" | "load" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [view, setView] = useState<"edit" | "board">("edit");
  const [prompter, setPrompter] = useState(false);
  const [draftVtt, setDraftVtt] = useState<string | null>(null);

  async function loadVersions() {
    const d = await fetch(`/api/admin/learn/video?lessonId=${encodeURIComponent(lessonId)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    setVersions(d?.scripts ?? []);
    return (d?.scripts ?? []) as VersionInfo[];
  }

  async function load(v?: number) {
    setBusy("load");
    try {
      const d = await fetch(`/api/admin/learn/video/script?lessonId=${encodeURIComponent(lessonId)}${v ? `&version=${v}` : ""}`).then((r) => r.json());
      setScript(d.script ?? null);
      setVersion(d.version ?? null);
      setDirty(false);
      setDraftVtt(null);
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    loadVersions().then((vs) => {
      if (vs.length) void load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function post(body: Record<string, unknown>, kind: "generate" | "save") {
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/learn/video/script", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, ...body }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: d.error ?? "Something went wrong." });
      setScript(d.script);
      setVersion(d.version);
      setDirty(false);
      setDraftVtt(null);
      setMsg({ ok: true, text: kind === "generate" ? `Draft ready as version ${d.version}. Read it through and edit before recording.` : `Saved as version ${d.version}.` });
      await loadVersions();
    } catch {
      setMsg({ ok: false, text: "Could not reach the server." });
    } finally {
      setBusy(null);
    }
  }

  const edit = (fn: (s: VideoScript) => VideoScript) => {
    setScript((s) => (s ? fn(s) : s));
    setDirty(true);
    setMsg(null);
  };
  const editSection = (i: number, patch: Partial<ScriptSection>) =>
    edit((s) => ({ ...s, sections: s.sections.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  const secs = script ? scriptSeconds(script) : 0;
  const words = script ? script.sections.reduce((n, s) => n + countWords(s.narration), 0) : 0;
  const lengthNote = secs < 180 ? "shorter than 3 minutes" : secs > 300 ? "longer than 5 minutes" : "within 3 to 5 minutes";

  function plainText(s: VideoScript): string {
    return [
      s.title,
      "",
      s.notes ? `Setup notes: ${s.notes}\n` : "",
      ...s.sections.map(
        (x, i) =>
          `${i + 1}. ${KIND_LABEL[x.kind]}: ${x.heading}\n\nSAY:\n${x.narration}\n\nSHOW:\n${x.shots.map((l) => `- ${l}`).join("\n")}${
            x.broll.length ? `\n\nB-ROLL:\n${x.broll.map((l) => `- ${l}`).join("\n")}` : ""
          }${x.onScreenText.length ? `\n\nON-SCREEN TEXT:\n${x.onScreenText.map((l) => `- ${l}`).join("\n")}` : ""}\n`,
      ),
    ].join("\n");
  }

  return (
    <div className="border-t border-[#E6EBF1] pt-5 space-y-4" aria-labelledby="script-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="script-h" className="font-syne font-bold text-base text-[#0D1B2A] inline-flex items-center gap-2">
            <FileText size={16} /> Video script and storyboard
          </h3>
          <p className="font-dm text-xs text-[#7A8FA6] max-w-xl">
            Drafts a 3 to 5 minute script from this lesson: a hook, the key points, a screen-recording walkthrough of the Try it now task, a recap and a call to
            action, with what to show on screen. Always read it through: it is a draft.
          </p>
        </div>
        <button type="button" className={btnAccent} disabled={!!busy} onClick={() => post({ action: "generate" }, "generate")} data-testid="script-generate">
          <Sparkles size={14} /> {busy === "generate" ? "Drafting… (up to a minute)" : script ? "Generate a new draft" : "Generate video script"}
        </button>
      </div>

      {versions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-dm text-xs font-semibold text-[#3A4A5C]" htmlFor="script-version">Version</label>
          <select
            id="script-version"
            className="rounded-lg border border-[#D2DCE8] bg-white px-2 py-1 font-dm text-sm"
            value={version ?? ""}
            disabled={!!busy}
            onChange={(e) => {
              if (dirty && !confirm("Discard your unsaved script changes?")) return;
              load(Number(e.target.value));
            }}
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version} · {v.source === "ai" ? "AI draft" : "edited"} · {new Date(v.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {v.createdBy ? ` · ${v.createdBy}` : ""}
              </option>
            ))}
          </select>
          {dirty && <span className="font-dm text-xs text-amber-700">Unsaved script changes</span>}
        </div>
      )}

      {msg && <p className={`font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`} role="status">{msg.text}</p>}

      {script && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F7FB] px-3 py-2 font-dm text-xs text-[#3A4A5C]">
            <span>
              <strong>About {formatTime(secs)}</strong> spoken ({words} words at {WORDS_PER_MINUTE} a minute), {lengthNote}.
            </span>
            <span className="flex-1" />
            <div role="group" aria-label="Script view" className="inline-flex rounded-lg border border-[#D2DCE8] bg-white p-0.5">
              {(["edit", "board"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-2.5 py-1 font-semibold ${view === v ? "bg-[#1B3A6B] text-white" : "text-[#3A4A5C]"}`}
                >
                  {v === "edit" ? "Edit" : "Storyboard"}
                </button>
              ))}
            </div>
          </div>

          {view === "edit" ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-[1fr_120px] gap-3">
                <div>
                  <label className={labelCls} htmlFor="script-title">Video title</label>
                  <input id="script-title" className={inputCls} value={script.title} onChange={(e) => edit((s) => ({ ...s, title: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="script-mins">Target minutes</label>
                  <input
                    id="script-mins"
                    type="number"
                    min={1}
                    max={15}
                    className={inputCls}
                    value={script.targetMinutes}
                    onChange={(e) => edit((s) => ({ ...s, targetMinutes: Number(e.target.value) || 4 }))}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="script-notes">Recording setup notes</label>
                <textarea id="script-notes" className={`${inputCls} min-h-[60px]`} value={script.notes} onChange={(e) => edit((s) => ({ ...s, notes: e.target.value }))} />
              </div>
              <ol className="space-y-3">
                {script.sections.map((x, i) => {
                  const w = countWords(x.narration);
                  return (
                    <li key={i} className="rounded-xl border border-[#E6EBF1] p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label={`Section ${i + 1} type`}
                          className={`rounded-full px-2 py-0.5 font-dm text-xs font-bold ${KIND_STYLE[x.kind]}`}
                          value={x.kind}
                          onChange={(e) => editSection(i, { kind: e.target.value as SectionKind })}
                        >
                          {SECTION_KINDS.map((k) => (
                            <option key={k} value={k}>{KIND_LABEL[k]}</option>
                          ))}
                        </select>
                        <input
                          aria-label={`Section ${i + 1} heading`}
                          className={`${inputCls} flex-1 min-w-[180px] font-semibold`}
                          value={x.heading}
                          onChange={(e) => editSection(i, { heading: e.target.value })}
                        />
                        <span className="font-dm text-[11px] text-[#7A8FA6]">{w} words · {formatTime(Math.round((w * 60) / WORDS_PER_MINUTE))}</span>
                        <button
                          type="button"
                          className={btnDanger}
                          aria-label={`Remove section ${i + 1}`}
                          disabled={script.sections.length <= 2}
                          onClick={() => confirm("Remove this section?") && edit((s) => ({ ...s, sections: s.sections.filter((_, j) => j !== i) }))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div>
                        <label className={labelCls}>Say (narration)</label>
                        <textarea className={`${inputCls} min-h-[110px] leading-6`} value={x.narration} onChange={(e) => editSection(i, { narration: e.target.value })} />
                      </div>
                      <div className="grid md:grid-cols-3 gap-2">
                        <div>
                          <label className={labelCls}>Show on screen (one per line)</label>
                          <textarea className={`${inputCls} min-h-[90px] text-[13px]`} value={x.shots.join("\n")} onChange={(e) => editSection(i, { shots: lines(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>B-roll and screen captures</label>
                          <textarea className={`${inputCls} min-h-[90px] text-[13px]`} value={x.broll.join("\n")} onChange={(e) => editSection(i, { broll: lines(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>On-screen text</label>
                          <textarea className={`${inputCls} min-h-[90px] text-[13px]`} value={x.onScreenText.join("\n")} onChange={(e) => editSection(i, { onScreenText: lines(e.target.value) })} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                className={btnGhost}
                onClick={() =>
                  edit((s) => ({ ...s, sections: [...s.sections, { kind: "point", heading: "New section", narration: "", shots: [], broll: [], onScreenText: [] }] }))
                }
              >
                <Plus size={14} /> Add section
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse font-dm text-[13px]" data-testid="storyboard">
                <caption className="sr-only">Storyboard</caption>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#7A8FA6]">
                    <th className="border-b border-[#E6EBF1] py-2 pr-3 w-16">Time</th>
                    <th className="border-b border-[#E6EBF1] py-2 pr-3">Say</th>
                    <th className="border-b border-[#E6EBF1] py-2 pr-3">Show on screen</th>
                    <th className="border-b border-[#E6EBF1] py-2 pr-3">B-roll</th>
                    <th className="border-b border-[#E6EBF1] py-2">On-screen text</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const chapters = scriptChapters(script);
                    return script.sections.map((x, i) => (
                      <tr key={i} className="align-top">
                        <td className="border-b border-[#E6EBF1] py-2 pr-3 font-mono text-xs text-[#7A8FA6]">{formatTime(chapters[i]?.time ?? 0)}</td>
                        <td className="border-b border-[#E6EBF1] py-2 pr-3">
                          <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${KIND_STYLE[x.kind]}`}>{KIND_LABEL[x.kind]}</span>
                          <p className="font-semibold text-[#0D1B2A]">{x.heading}</p>
                          <p className="mt-1 whitespace-pre-line text-[#3A4A5C]">{x.narration}</p>
                        </td>
                        <td className="border-b border-[#E6EBF1] py-2 pr-3"><Bullets items={x.shots} /></td>
                        <td className="border-b border-[#E6EBF1] py-2 pr-3"><Bullets items={x.broll} /></td>
                        <td className="border-b border-[#E6EBF1] py-2"><Bullets items={x.onScreenText} quote /></td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btnPrimary} disabled={!dirty || !!busy} onClick={() => post({ action: "save", script }, "save")}>
              <Save size={14} /> {busy === "save" ? "Saving…" : "Save as new version"}
            </button>
            <button type="button" className={btnGhost} onClick={() => setPrompter(true)} data-testid="teleprompter-open">
              <MonitorPlay size={14} /> Teleprompter
            </button>
            <button type="button" className={btnGhost} onClick={() => setDraftVtt(scriptToDraftVtt(script))} data-testid="script-draft-captions">
              <FileText size={14} /> Draft captions from script
            </button>
            <button type="button" className={btnGhost} onClick={() => navigator.clipboard?.writeText(plainText(script)).then(() => setMsg({ ok: true, text: "Script copied." }))}>
              <Copy size={14} /> Copy as text
            </button>
          </div>

          {draftVtt && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2" data-testid="draft-vtt">
              <p className="font-dm text-sm text-amber-900">
                <strong>Draft captions (estimated timings).</strong> Built from the script at {WORDS_PER_MINUTE} words a minute. After recording, play the video and
                adjust each time so the words match; the editor marks them as a draft until you remove the &quot;NOTE DRAFT&quot; lines.
              </p>
              <textarea readOnly className={`${inputCls} min-h-[160px] font-mono text-[12px]`} value={draftVtt} aria-label="Draft captions" />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} onClick={() => onUseCaptions(draftVtt)}>
                  Use as English captions
                </button>
                <button type="button" className={btnGhost} onClick={() => onUseChapters(scriptChapters(script))}>
                  Use suggested chapters
                </button>
                <button type="button" className={btnGhost} onClick={() => setDraftVtt(null)}>
                  Close
                </button>
              </div>
              <p className="font-dm text-xs text-amber-900">Then press Save video above.</p>
            </div>
          )}

          {prompter && <Teleprompter script={script} onClose={() => setPrompter(false)} />}
        </>
      )}
    </div>
  );
}

function Bullets({ items, quote }: { items: string[]; quote?: boolean }) {
  if (!items.length) return <span className="text-[#7A8FA6]">-</span>;
  return (
    <ul className="list-disc space-y-0.5 pl-4 text-[#3A4A5C]">
      {items.map((x, i) => (
        <li key={i}>{quote ? `"${x}"` : x}</li>
      ))}
    </ul>
  );
}
