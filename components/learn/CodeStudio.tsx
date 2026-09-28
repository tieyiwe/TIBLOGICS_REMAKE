"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "./Markdown";
import { useT } from "@/lib/i18n/client";

// Code Studio: build a single-file web app in the browser, the way an engineer
// would: small steps, AI changes reviewed before they are applied, versions
// saved like commits, and automated checks.
//
// Both previews are sandboxed iframes WITHOUT allow-same-origin: the learner's
// code runs in an opaque origin and cannot touch the platform. The checks run
// inside a fresh, hidden copy of the page via postMessage, so they see exactly
// what the learner built.

export interface StudioCheck { id: string; label: string; code: string; hint?: string }
export interface StudioField { id: string; label: string; prompt: string; placeholder?: string; minWords?: number }
export interface StudioSubmission {
  code: string;
  checkResults: Array<{ id: string; pass: boolean; message?: string; kind?: CheckFailKind }>;
  commits: Array<{ message: string; at: string }>;
  answers: Record<string, string>;
}

/** Why a check failed, so the UI can say it in the learner's language. */
type CheckFailKind = "fail" | "timeout" | "error" | "noresponse";

interface Version { message: string; at: string; code: string }
interface Turn {
  request: string;
  reply: string;
  proposal?: string | null;
  /** The code the AI was given, to warn before an apply overwrites later edits. */
  base?: string;
  decision?: "applied" | "discarded";
}

const RUNNER = `<script>
window.addEventListener("message", async function (e) {
  var d = e.data || {};
  if (d.type !== "tib-run-checks") return;
  var AF = Object.getPrototypeOf(async function () {}).constructor;
  var out = [];
  for (var i = 0; i < d.checks.length; i++) {
    var c = d.checks[i];
    try {
      var r = await Promise.race([
        new AF("doc", "win", c.code)(document, window),
        new Promise(function (_, rej) { setTimeout(function () { rej({ tibTimeout: true }); }, 3000); })
      ]);
      out.push(r === true ? { id: c.id, pass: true, message: "" } : { id: c.id, pass: false, message: typeof r === "string" ? r : "", kind: "fail" });
    } catch (err) {
      if (err && err.tibTimeout) out.push({ id: c.id, pass: false, message: "Timed out", kind: "timeout" });
      else out.push({ id: c.id, pass: false, message: String((err && err.message) || err), kind: "error" });
    }
  }
  parent.postMessage({ type: "tib-check-results", nonce: d.nonce, results: out }, "*");
});
</script>`;

function withRunner(code: string): string {
  const i = code.toLowerCase().lastIndexOf("</body>");
  return i === -1 ? code + RUNNER : code.slice(0, i) + RUNNER + code.slice(i);
}

/** Lines added and removed between two versions, for the review panel. */
function diffStat(a: string, b: string): { added: string[]; removed: string[] } {
  const count = (s: string) => {
    const m = new Map<string, number>();
    for (const l of s.split("\n")) if (l.trim()) m.set(l, (m.get(l) ?? 0) + 1);
    return m;
  };
  const ca = count(a), cb = count(b);
  const added: string[] = [], removed: string[] = [];
  for (const [l, n] of cb) for (let i = 0; i < n - (ca.get(l) ?? 0); i++) added.push(l);
  for (const [l, n] of ca) for (let i = 0; i < n - (cb.get(l) ?? 0); i++) removed.push(l);
  return { added, removed };
}

const btn = "rounded-full px-4 py-2 text-xs font-bold disabled:opacity-40";

export default function CodeStudio({
  labId,
  starterCode,
  checks,
  fields,
  maxRuns,
  initialCode,
  initialRuns,
  accentColor,
  busy,
  onSubmit,
}: {
  labId: string;
  starterCode: string;
  checks: StudioCheck[];
  fields: StudioField[];
  maxRuns: number;
  initialCode?: string;
  initialRuns: number;
  accentColor: string;
  busy: boolean;
  onSubmit: (s: StudioSubmission) => void;
}) {
  const t = useT();
  const storeKey = `tiblogics:code-lab:${labId}`;
  const [code, setCode] = useState(initialCode || starterCode);
  const [preview, setPreview] = useState(initialCode || starterCode);
  const [previewKey, setPreviewKey] = useState(0);
  const [versions, setVersions] = useState<Version[]>([]);
  const [commitMsg, setCommitMsg] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [request, setRequest] = useState("");
  const [asking, setAsking] = useState(false);
  const [runsLeft, setRunsLeft] = useState(Math.max(0, maxRuns - initialRuns));
  const [checkResults, setCheckResults] = useState<StudioSubmission["checkResults"] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedCode, setCheckedCode] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"preview" | "ai" | "versions">("preview");
  const editor = useRef<HTMLTextAreaElement>(null);
  const checkFrame = useRef<HTMLIFrameElement>(null);
  const [checkDoc, setCheckDoc] = useState<string | null>(null);
  const nonce = useRef("");
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore work saved in this browser (after mount, to keep hydration stable).
  // The AI conversation is kept too: it used to vanish on refresh, taking any
  // proposal not yet reviewed with it.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storeKey) ?? "null");
      if (saved?.code) { setCode(saved.code); setPreview(saved.code); }
      if (Array.isArray(saved?.versions)) setVersions(saved.versions);
      if (saved?.answers) setAnswers(saved.answers);
      if (Array.isArray(saved?.turns)) setTurns(saved.turns);
    } catch { /* storage unavailable */ }
  }, [storeKey]);
  useEffect(() => {
    // Reviewed proposals are not needed again, so they are not stored.
    const keep = turns.slice(-20).map((x) => (x.decision ? { ...x, proposal: null, base: undefined } : x));
    try { window.localStorage.setItem(storeKey, JSON.stringify({ code, versions, answers, turns: keep })); } catch { /* ignore */ }
  }, [storeKey, code, versions, answers, turns]);
  useEffect(() => () => { if (watchdog.current) clearTimeout(watchdog.current); }, []);

  // Live preview follows the editor after a short pause.
  useEffect(() => {
    const t = setTimeout(() => setPreview(code), 500);
    return () => clearTimeout(t);
  }, [code]);

  // Check results arrive from the hidden check frame.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== "tib-check-results" || d.nonce !== nonce.current) return;
      if (e.source !== checkFrame.current?.contentWindow) return;
      if (watchdog.current) clearTimeout(watchdog.current);
      setCheckResults(d.results);
      setChecking(false);
      setCheckDoc(null);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const runChecks = useCallback(() => {
    setChecking(true);
    setCheckResults(null);
    const run = Math.random().toString(36).slice(2);
    nonce.current = run;
    setCheckedCode(code);
    setCheckDoc(withRunner(code));
    // If the page never loads (an infinite loop, say), report it. The timer
    // belongs to this run only: it used to fire 12 seconds after ANY run and
    // fail whichever run was in progress by then.
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => {
      if (nonce.current !== run) return;
      nonce.current = "";
      setCheckResults(checks.map((c) => ({ id: c.id, pass: false, message: "The page did not respond (endless loop or script error).", kind: "noresponse" as const })));
      setCheckDoc(null);
      setChecking(false);
    }, 12_000);
  }, [code, checks]);

  function onCheckFrameLoad() {
    // Give the page's own scripts a moment to set up before checking.
    setTimeout(() => {
      checkFrame.current?.contentWindow?.postMessage(
        { type: "tib-run-checks", nonce: nonce.current, checks: checks.map((c) => ({ id: c.id, code: c.code })) },
        "*",
      );
    }, 150);
  }

  function saveVersion(message?: string) {
    const msg = (message ?? commitMsg).trim();
    if (!msg) return;
    setVersions((v) => [...v, { message: msg.slice(0, 120), at: new Date().toISOString(), code }].slice(-50));
    setCommitMsg("");
  }

  async function ask() {
    if (!request.trim() || asking) return;
    setAsking(true);
    setError("");
    const res = await fetch("/api/learn/lab/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labId, code, request }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setTurns((all) => [...all, { request, reply: d.reply, proposal: d.code ?? null, base: code }]);
      setRunsLeft(d.runsLeft ?? 0);
      setRequest("");
    } else {
      setError(d.error ?? t("labs.code.aiError"));
      if (typeof d.runsLeft === "number") setRunsLeft(d.runsLeft);
    }
    setAsking(false);
  }

  function decide(i: number, decision: "applied" | "discarded") {
    const turn = turns[i];
    if (decision === "applied" && turn.proposal) {
      // The proposal is a whole file based on the code at the time of asking.
      if (turn.base !== undefined && turn.base !== code && !confirm(t("labs.code.overwriteConfirm"))) return;
      setCode(turn.proposal);
      setPreview(turn.proposal);
      setPreviewKey((k) => k + 1);
    }
    setTurns((all) => all.map((x, j) => (j === i ? { ...x, decision } : x)));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const s = el.selectionStart, end = el.selectionEnd;
    setCode(code.slice(0, s) + "  " + code.slice(end));
    requestAnimationFrame(() => { if (editor.current) editor.current.selectionStart = editor.current.selectionEnd = s + 2; });
  }

  const passCount = checkResults?.filter((r) => r.pass).length ?? 0;
  const stale = checkResults && checkedCode !== code;
  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
  const missingField = fields.some((f) => !(answers[f.id] ?? "").trim());

  function submit() {
    if (!checkResults || stale) {
      setError(t("labs.code.runFirst"));
      return;
    }
    onSubmit({
      code,
      checkResults,
      commits: versions.map((v) => ({ message: v.message, at: v.at })),
      answers,
    });
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-base font-bold text-[var(--ink)]">💻 Code Studio</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${btn} border border-[var(--border)] text-[var(--ink2)]`} onClick={() => { setPreview(code); setPreviewKey((k) => k + 1); }}>
            {t("labs.code.runPreview")}
          </button>
          <button type="button" className={`${btn} text-white`} style={{ background: accentColor }} onClick={runChecks} disabled={checking}>
            {checking ? t("labs.checking") : t("labs.code.runChecks", { n: checks.length })}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        {/* Editor */}
        <div className="border-b border-[var(--border)] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between bg-[#0F172A] px-3 py-1.5 text-[11px] text-[#94A3B8]">
            <span>{t("labs.code.lines", { n: lineCount })}</span>
            <button type="button" className="hover:text-white" onClick={() => { if (confirm(t("labs.code.resetConfirm"))) setCode(starterCode); }}>
              {t("labs.code.reset")}
            </button>
          </div>
          <textarea
            ref={editor}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            aria-label={t("labs.code.editor")}
            className="h-[460px] w-full resize-y bg-[#0F172A] p-3 font-mono text-[12.5px] leading-relaxed text-[#E2E8F0] outline-none"
          />
        </div>

        {/* Right panel */}
        <div className="flex min-h-[460px] flex-col">
          <div className="flex border-b border-[var(--border)] text-xs font-bold">
            {([
              ["preview", t("labs.code.tabPreview")],
              ["ai", t("labs.code.tabAi", { n: runsLeft })],
              ["versions", t("labs.code.tabVersions", { n: versions.length })],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 px-3 py-2.5 ${tab === id ? "border-b-2 text-[var(--ink)]" : "text-[var(--ink3)]"}`}
                style={tab === id ? { borderColor: accentColor } : undefined}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "preview" && (
            <iframe key={previewKey} title={t("labs.code.previewTitle")} sandbox="allow-scripts allow-modals allow-forms" srcDoc={preview} className="w-full flex-1 bg-white" />
          )}

          {tab === "ai" && (
            <div className="flex flex-1 flex-col">
              <div className="max-h-[360px] flex-1 space-y-3 overflow-auto p-3">
                {turns.length === 0 && (
                  <p className="text-sm text-[var(--ink2)]">{t("labs.code.aiIntro")}</p>
                )}
                {turns.map((turn, i) => {
                  const stat = turn.proposal ? diffStat(code, turn.proposal) : null;
                  return (
                    <div key={i} className="rounded-xl border border-[var(--border)] text-sm">
                      <p className="border-b border-[var(--border)] bg-[var(--s2)] px-3 py-2 text-xs"><strong>{t("labs.code.you")}</strong> {turn.request}</p>
                      <div className="p-3"><Markdown source={turn.reply} /></div>
                      {turn.proposal && !turn.decision && stat && (
                        <div className="border-t border-[var(--border)] p-3">
                          <p className="text-xs font-bold text-[var(--ink)]">
                            {t("labs.code.proposed")} <span className="text-green-700">+{stat.added.length}</span> / <span className="text-red-600">-{stat.removed.length}</span> {t("labs.code.proposedTail")}
                          </p>
                          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-[#0F172A] p-2 text-[11px] leading-relaxed">
                            {stat.removed.slice(0, 40).map((l, j) => <div key={`r${j}`} className="text-red-300">- {l}</div>)}
                            {stat.added.slice(0, 60).map((l, j) => <div key={`a${j}`} className="text-green-300">+ {l}</div>)}
                          </pre>
                          <div className="mt-2 flex gap-2">
                            <button type="button" className={`${btn} text-white`} style={{ background: accentColor }} onClick={() => decide(i, "applied")}>{t("labs.code.apply")}</button>
                            <button type="button" className={`${btn} border border-[var(--border)] text-[var(--ink2)]`} onClick={() => decide(i, "discarded")}>{t("labs.code.discard")}</button>
                          </div>
                        </div>
                      )}
                      {turn.decision && (
                        <p className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--ink3)]">
                          {turn.decision === "applied" ? t("labs.code.applied") : t("labs.code.discarded")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[var(--border)] p-3">
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); }}
                  rows={3}
                  placeholder={t("labs.code.askPlaceholder")}
                  className="w-full rounded-lg border border-[var(--border)] p-2 text-sm outline-none"
                />
                <button type="button" onClick={ask} disabled={asking || !request.trim() || runsLeft <= 0} className={`${btn} mt-2 text-white`} style={{ background: accentColor }}>
                  {asking ? t("labs.code.thinking") : runsLeft <= 0 ? t("labs.code.noRequests") : t("labs.code.ask")}
                </button>
              </div>
            </div>
          )}

          {tab === "versions" && (
            <div className="flex-1 space-y-3 p-3">
              <p className="text-sm text-[var(--ink2)]">{t("labs.code.versionsIntro")}</p>
              <div className="flex gap-2">
                <input
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveVersion(); }}
                  placeholder={t("labs.code.commitPlaceholder")}
                  className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                />
                <button type="button" onClick={() => saveVersion()} disabled={!commitMsg.trim()} className={`${btn} text-white`} style={{ background: accentColor }}>{t("labs.code.save")}</button>
              </div>
              <ol className="max-h-[320px] space-y-2 overflow-auto">
                {[...versions].reverse().map((v, i) => (
                  <li key={v.at + i} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                    <span className="min-w-0 truncate"><span className="font-mono text-xs text-[var(--ink3)]">#{versions.length - i}</span> {v.message}</span>
                    <button type="button" className="shrink-0 text-xs font-semibold text-[var(--blue2)]" onClick={() => { setCode(v.code); setPreview(v.code); setPreviewKey((k) => k + 1); }}>
                      {t("labs.code.restore")}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Checks */}
      <div className="border-t border-[var(--border)] p-4">
        <h3 className="text-sm font-bold text-[var(--ink)]">
          {t("labs.code.checksTitle")} {checkResults && <span style={{ color: passCount === checks.length ? "#0F6E56" : "#E05F00" }}>{t("labs.code.passing", { pass: passCount, total: checks.length })}</span>}
          {stale && <span className="ml-2 text-xs font-normal text-[var(--ink3)]">{t("labs.code.stale")}</span>}
        </h3>
        <ul className="mt-2 space-y-1.5">
          {checks.map((c) => {
            const r = checkResults?.find((x) => x.id === c.id);
            return (
              <li key={c.id} className="flex items-start gap-2 text-sm">
                <span aria-hidden="true" className="mt-0.5 w-4 text-center">{!r ? "○" : r.pass ? "✅" : "❌"}</span>
                <span className="text-[var(--ink2)]">
                  {c.label}
                  {r && !r.pass && <FailReason result={r} hint={c.hint} />}
                </span>
              </li>
            );
          })}
        </ul>
        {checkDoc && (
          // Off screen rather than display:none, so the page gets a real layout
          // and checks that measure or scroll behave as they do in the preview.
          <iframe
            ref={checkFrame}
            title={t("labs.code.checksFrame")}
            sandbox="allow-scripts allow-forms"
            srcDoc={checkDoc}
            onLoad={onCheckFrameLoad}
            aria-hidden="true"
            tabIndex={-1}
            className="pointer-events-none fixed left-[-10000px] top-0 h-[600px] w-[800px] opacity-0"
          />
        )}
      </div>

      {/* Written parts */}
      {fields.length > 0 && (
        <div className="space-y-5 border-t border-[var(--border)] p-4">
          {fields.map((f) => {
            const n = wordCount(answers[f.id] ?? "");
            const min = f.minWords ?? 30;
            return (
              <div key={f.id}>
                <label htmlFor={`cs-${f.id}`} className="text-sm font-semibold text-[var(--ink)]">{f.label}</label>
                <p className="mt-0.5 text-sm text-[var(--ink2)]">{f.prompt}</p>
                <textarea
                  id={`cs-${f.id}`}
                  rows={5}
                  value={answers[f.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none"
                />
                <p className={`text-right text-xs ${n >= min ? "text-[#0F6E56]" : "text-[var(--ink3)]"}`}>{n < min ? t("labs.wordsAim", { n, min }) : t("labs.wordsDone", { n })}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-[var(--border)] p-4">
        {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={busy || missingField}
          className="w-full rounded-full py-3.5 text-sm font-bold text-white disabled:opacity-40"
          style={{ background: accentColor }}
        >
          {busy ? t("labs.code.assessing") : t("labs.code.submit")}
        </button>
        <p className="mt-2 text-center text-xs text-[var(--ink3)]">
          {missingField ? `${t("labs.code.fillFirst")} ` : ""}{t("labs.code.submitNote")}
        </p>
      </div>
    </section>
  );
}

/**
 * Why a check failed. The lab's hint (translated) comes first; the check's own
 * message, written in English inside the check code, follows as detail.
 */
function FailReason({ result, hint }: { result: StudioSubmission["checkResults"][number]; hint?: string }) {
  const t = useT();
  const kind = result.kind ?? (result.message ? "error" : "fail");
  const lead =
    kind === "noresponse"
      ? t("labs.code.noResponse")
      : hint || (kind === "timeout" ? t("labs.code.timedOut") : t("labs.code.checkFailed"));
  const detail = kind !== "noresponse" && kind !== "timeout" && result.message ? result.message : "";
  return (
    <span className="block text-xs text-[var(--ink3)]">
      {lead}
      {detail && <span className="block font-mono text-[11px]">{t("labs.code.details", { msg: detail })}</span>}
    </span>
  );
}
