"use client";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { useOp, inputCls, labelCls, btnPrimary, btnGhost, btnDanger } from "./useOp";

export interface BankQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty?: number;
  moduleId?: string | null;
}

type Draft = Omit<BankQuestion, "id">;
const empty = (): Draft => ({ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", difficulty: 2, moduleId: null });

/**
 * A question bank: lesson check, module quiz or final exam. Learners are
 * served a random subset with options shuffled per learner, so option order
 * here does not matter; what does is that the right answer is not given away
 * by being the longest or most detailed option.
 */
export default function QuestionBank(props: {
  bank: "micro" | "quiz" | "exam";
  parentId: string;
  questions: BankQuestion[];
  modules?: Array<{ id: string; title: string }>;
}) {
  const { run, busy, error } = useOp();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(empty());

  function start(q?: BankQuestion) {
    setEditing(q ? q.id : "new");
    setDraft(q ? { question: q.question, options: [...q.options], correctIndex: q.correctIndex, explanation: q.explanation, difficulty: q.difficulty ?? 2, moduleId: q.moduleId ?? null } : empty());
  }

  async function save() {
    // Blank options are dropped; the correct answer is re-pointed to where it
    // lands, so a blank above it cannot silently mark a different option right.
    const kept = draft.options.map((o, i) => ({ text: o.trim(), i })).filter((o) => o.text);
    const correct = kept.findIndex((o) => o.i === draft.correctIndex);
    if (correct < 0) {
      alert("The option marked correct is empty.");
      return;
    }
    const data = { ...draft, options: kept.map((o) => o.text), correctIndex: correct };
    const ok = editing === "new"
      ? await run({ op: "question.create", bank: props.bank, parentId: props.parentId, data }, { key: "q-save" })
      : await run({ op: "question.update", bank: props.bank, id: editing, data }, { key: "q-save" });
    if (ok) setEditing(null);
  }

  // The giveaway the content validator also checks: the right answer being
  // clearly the longest option.
  const longestGiveaway = (() => {
    const lens = draft.options.map((o) => o.trim().length).filter((n) => n > 0);
    if (lens.length < 3) return false;
    const right = draft.options[draft.correctIndex]?.trim().length ?? 0;
    const others = lens.filter((_, i) => i !== draft.correctIndex);
    return right > 0 && others.every((n) => right > n * 1.4);
  })();

  const form = (
    <div className="rounded-[var(--a-radius-control)] border border-[#2251A3]/30 bg-[var(--a-surface-2)] p-4 space-y-3">
      <div>
        <label className={labelCls}>Question</label>
        <textarea className={`${inputCls} min-h-[70px]`} value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Options (select the correct one)</label>
        {draft.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={draft.correctIndex === i} onChange={() => setDraft({ ...draft, correctIndex: i })} className="accent-[#0F6E56] w-4 h-4 shrink-0" aria-label={`Option ${i + 1} is correct`} />
            <input className={inputCls} value={o} onChange={(e) => setDraft({ ...draft, options: draft.options.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Option ${i + 1}`} />
            {draft.options.length > 2 && (
              <button type="button" onClick={() => setDraft({ ...draft, options: draft.options.filter((_, j) => j !== i), correctIndex: draft.correctIndex === i ? 0 : draft.correctIndex > i ? draft.correctIndex - 1 : draft.correctIndex })} className={btnDanger} aria-label="Remove option"><X size={14} /></button>
            )}
          </div>
        ))}
        {draft.options.length < 6 && <button type="button" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })} className={btnGhost}><Plus size={14} /> Option</button>}
        {longestGiveaway && (
          <p className="flex items-center gap-1.5 font-dm text-xs text-amber-700"><AlertTriangle size={13} /> The correct option is much longer than the others, which gives it away. Make the wrong options as specific.</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Explanation (shown after answering)</label>
        <textarea className={`${inputCls} min-h-[60px]`} value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} />
      </div>
      {props.bank === "exam" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Module it tests</label>
            <select className={inputCls} value={draft.moduleId ?? ""} onChange={(e) => setDraft({ ...draft, moduleId: e.target.value || null })}>
              <option value="">Not mapped</option>
              {props.modules?.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Difficulty</label>
            <select className={inputCls} value={draft.difficulty ?? 2} onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) })}>
              <option value={1}>1 · Recall</option><option value={2}>2 · Application</option><option value={3}>3 · Analysis</option>
            </select>
          </div>
        </div>
      )}
      {error && <p className="font-dm text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={!!busy} className={btnPrimary}><Check size={14} /> {busy === "q-save" ? "Saving…" : "Save question"}</button>
        <button type="button" onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {props.questions.length === 0 && editing !== "new" && <p className="font-dm text-sm text-[var(--a-ink-3)]">No questions yet.</p>}
      <ol className="space-y-2">
        {props.questions.map((q, n) =>
          editing === q.id ? (
            <li key={q.id}>{form}</li>
          ) : (
            <li key={q.id} className="flex gap-3 rounded-lg border border-[#E6EBF1] bg-white p-3">
              <span className="font-dm text-xs text-[var(--a-ink-3)] w-5 shrink-0 pt-0.5">{n + 1}.</span>
              <div className="min-w-0 flex-1 font-dm text-sm">
                <p className="text-[var(--a-ink)]">{q.question}</p>
                <p className="text-xs text-[#0F6E56] mt-1">✓ {q.options[q.correctIndex]}</p>
                {props.bank === "exam" && q.moduleId && <p className="text-xs text-[var(--a-ink-3)] mt-0.5">{props.modules?.find((m) => m.id === q.moduleId)?.title}</p>}
              </div>
              <div className="flex items-start gap-1 shrink-0">
                <button type="button" onClick={() => start(q)} className={btnGhost} aria-label="Edit question"><Pencil size={14} /></button>
                <button type="button" disabled={!!busy} onClick={() => run({ op: "question.delete", bank: props.bank, id: q.id }, { confirmText: "Delete this question?" })} className={btnDanger} aria-label="Delete question"><Trash2 size={14} /></button>
              </div>
            </li>
          ),
        )}
      </ol>
      {editing === "new" ? form : <button type="button" onClick={() => start()} className={btnGhost}><Plus size={14} /> Add question</button>}
    </div>
  );
}
