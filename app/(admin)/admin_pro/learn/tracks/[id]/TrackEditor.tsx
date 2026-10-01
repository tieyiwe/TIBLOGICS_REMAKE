"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowLeft, ArrowUp, BookOpen, ChevronDown, ChevronRight, ExternalLink, FlaskConical, GraduationCap,
  ListChecks, Pencil, Plus, Save, Trash2, Video, X,
} from "lucide-react";
import QuestionBank, { type BankQuestion } from "../../_editor/QuestionBank";
import { useOp, inputCls, labelCls, btnPrimary, btnGhost, btnDanger } from "../../_editor/useOp";
import { trackPriceCents } from "@/lib/learn/pricing";

interface Track {
  id: string; slug: string; title: string; tagline: string; description: string; level: string; levelEnd: string;
  status: string; sortOrder: number; accentColor: string; heroImage: string; certificateName: string; audience: string;
  outcomes: string[]; estimatedHours: number; certificates: number;
  /** One-time price override in cents; null = from the level. */
  priceCents: number | null;
}
interface LessonRow {
  id: string; title: string; durationMinutes: number; hasVideo: boolean; isPreview: boolean;
  resources: number; completions: number; checkQuestions: number; edited: boolean;
}
interface ModuleRow {
  id: string; title: string; summary: string; estimatedMinutes: number; lessons: LessonRow[];
  quiz: { passScore: number; questionsServed: number; questions: BankQuestion[] } | null;
}
interface LabRow { id: string; title: string; labType: string; moduleId: string | null; isPublished: boolean; estimatedMinutes: number }
interface Exam {
  title: string; timeLimitMinutes: number; questionsServed: number; passScore: number; distinctionScore: number;
  maxAttempts: number; cooldownHours: number; instructionsMd: string; questions: BankQuestion[];
}
interface Capstone { briefMd: string; passThreshold: number; rubric: Array<{ criterion: string; weight: number; description?: string }> }

const LEVELS = ["starter", "beginner", "intermediate", "advanced"];

function Section({ title, icon: Icon, children, defaultOpen = true, right }: { title: string; icon: typeof BookOpen; children: React.ReactNode; defaultOpen?: boolean; right?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 font-syne font-bold text-base text-[var(--a-ink)]">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}<Icon size={17} className="text-[#B8500A]" /> {title}
        </button>
        {right}
      </div>
      {open && <div className="px-5 pb-5 border-t border-[var(--a-border)] pt-4">{children}</div>}
    </section>
  );
}

export default function TrackEditor(props: { track: Track; modules: ModuleRow[]; labs: LabRow[]; exam: Exam | null; capstone: Capstone | null }) {
  const t = props.track;
  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <Link href="/admin_pro/learn" className="inline-flex items-center gap-1 font-dm text-sm text-[var(--a-blue)]"><ArrowLeft size={14} /> ARFA · AI Academy</Link>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-2">
          <div>
            <h1 className="font-syne font-bold text-[24px] leading-tight text-[var(--a-ink)] sm:text-[26px]">{t.title}</h1>
            <p className="font-dm text-sm text-[var(--a-ink-3)]">
              {props.modules.length} modules · {props.modules.reduce((n, m) => n + m.lessons.length, 0)} lessons · {props.labs.length} labs · status <strong>{t.status.replace("_", " ")}</strong>
            </p>
          </div>
          <a href={`/learn/track/${t.slug}`} target="_blank" rel="noopener noreferrer" className={btnGhost}><ExternalLink size={14} /> View as learner</a>
        </div>
        <p className="font-dm text-xs text-[var(--a-ink-3)] mt-2">
          Changes here are live for learners as soon as they are saved. Anything you edit, add or delete here is kept when the
          built-in content is re-seeded.
        </p>
      </div>

      <TrackSettings track={t} />
      <Modules trackId={t.id} modules={props.modules} labs={props.labs} />
      <Labs trackId={t.id} labs={props.labs} modules={props.modules} />
      <ExamEditor trackId={t.id} exam={props.exam} modules={props.modules.map((m) => ({ id: m.id, title: m.title }))} />
      <CapstoneEditor trackId={t.id} capstone={props.capstone} />
    </div>
  );
}

// ── Track settings ──────────────────────────────────────────────────────────

function TrackSettings({ track }: { track: Track }) {
  const { run, busy, error } = useOp();
  const [f, setF] = useState({
    ...track,
    outcomesText: track.outcomes.join("\n"),
    // Dollars as typed; empty = use the level's price.
    priceUsd: track.priceCents != null ? String(track.priceCents / 100) : "",
  });
  const [saved, setSaved] = useState(false);
  const [priceError, setPriceError] = useState("");
  const set = (k: string, v: string | number) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };

  async function save() {
    setPriceError("");
    const typed = f.priceUsd.trim();
    const priceCents = typed === "" ? null : Math.round(Number(typed) * 100);
    if (priceCents !== null && (!Number.isFinite(priceCents) || priceCents < 100)) {
      setPriceError("One-time price must be a dollar amount of at least 1, or empty to use the level price.");
      return;
    }
    const ok = await run({
      op: "track.update", id: track.id,
      data: {
        title: f.title, tagline: f.tagline || null, description: f.description, level: f.level, levelEnd: f.levelEnd || null,
        status: f.status, sortOrder: Number(f.sortOrder), accentColor: f.accentColor, heroImage: f.heroImage || null,
        certificateName: f.certificateName, audience: f.audience || null,
        outcomes: f.outcomesText.split("\n").map((s) => s.trim()).filter(Boolean), estimatedHours: Number(f.estimatedHours),
        priceCents,
      },
    });
    if (ok) setSaved(true);
  }

  return (
    <Section title="Track settings" icon={GraduationCap} defaultOpen={false}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Title</label><input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><label className={labelCls}>Status</label>
          <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
            <option value="draft">Draft (hidden)</option><option value="coming_soon">Coming soon</option><option value="live">Live</option>
          </select>
        </div>
        <div className="sm:col-span-2"><label className={labelCls}>Tagline</label><input className={inputCls} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea className={`${inputCls} min-h-[110px]`} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div><label className={labelCls}>Level</label>
          <select className={inputCls} value={f.level} onChange={(e) => set("level", e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        </div>
        <div><label className={labelCls}>Level up to (optional)</label>
          <select className={inputCls} value={f.levelEnd} onChange={(e) => set("levelEnd", e.target.value)}><option value="">—</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        </div>
        <div><label className={labelCls}>Certificate name</label><input className={inputCls} value={f.certificateName} onChange={(e) => set("certificateName", e.target.value)} /></div>
        <div><label className={labelCls}>Estimated hours</label><input className={inputCls} type="number" step="0.5" min="0" value={f.estimatedHours} onChange={(e) => set("estimatedHours", e.target.value)} /></div>
        <div>
          <label className={labelCls} htmlFor="track-price">One-time price (USD)</label>
          <input
            id="track-price" className={inputCls} type="number" step="1" min="1" inputMode="decimal"
            value={f.priceUsd} onChange={(e) => set("priceUsd", e.target.value)}
            placeholder={String(trackPriceCents(f.level) / 100)}
          />
          <p className="font-dm text-xs text-[var(--a-ink-3)] mt-1">
            Lifetime access to this track, paid once. Leave empty to use the level price
            (${trackPriceCents(f.level) / 100} for {f.level}). The all-tracks subscription is separate.
          </p>
        </div>
        <div><label className={labelCls}>Order on the catalogue</label><input className={inputCls} type="number" min="0" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></div>
        <div><label className={labelCls}>Accent colour</label>
          <div className="flex gap-2"><input type="color" value={f.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-9 w-12 rounded border border-[var(--a-border)]" /><input className={inputCls} value={f.accentColor} onChange={(e) => set("accentColor", e.target.value)} /></div>
        </div>
        <div className="sm:col-span-2"><label className={labelCls}>Who it&apos;s for</label><input className={inputCls} value={f.audience} onChange={(e) => set("audience", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Hero image URL (optional)</label><input className={inputCls} value={f.heroImage} onChange={(e) => set("heroImage", e.target.value)} placeholder="https://…" /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Outcomes (one per line)</label><textarea className={`${inputCls} min-h-[100px]`} value={f.outcomesText} onChange={(e) => set("outcomesText", e.target.value)} /></div>
      </div>
      {(priceError || error) && <p className="font-dm text-sm text-red-600 mt-3">{priceError || error}</p>}
      <div className="flex items-center gap-3 mt-4">
        <button type="button" onClick={save} disabled={!!busy} className={btnPrimary}><Save size={14} /> {busy ? "Saving…" : "Save settings"}</button>
        {saved && <span className="font-dm text-sm text-green-700">Saved</span>}
      </div>
    </Section>
  );
}

// ── Modules and lessons ─────────────────────────────────────────────────────

function Modules({ trackId, modules, labs }: { trackId: string; modules: ModuleRow[]; labs: LabRow[] }) {
  const { run, busy, error } = useOp();
  const [newTitle, setNewTitle] = useState("");
  return (
    <Section title="Modules and lessons" icon={BookOpen}>
      <div className="space-y-4">
        {modules.map((m, i) => (
          <ModuleCard key={m.id} module={m} index={i} last={i === modules.length - 1} labs={labs.filter((l) => l.moduleId === m.id)} />
        ))}
        {modules.length === 0 && <p className="font-dm text-sm text-[var(--a-ink-3)]">No modules yet.</p>}
        <div className="flex gap-2">
          <input className={inputCls} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New module title" />
          <button type="button" disabled={!newTitle.trim() || !!busy} onClick={async () => { if (await run({ op: "module.create", trackId, title: newTitle })) setNewTitle(""); }} className={`${btnPrimary} shrink-0`}><Plus size={14} /> Add module</button>
        </div>
        {error && <p className="font-dm text-sm text-red-600">{error}</p>}
      </div>
    </Section>
  );
}

function ModuleCard({ module: m, index, last, labs }: { module: ModuleRow; index: number; last: boolean; labs: LabRow[] }) {
  const { run, busy, error } = useOp();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(m.title);
  const [summary, setSummary] = useState(m.summary);
  const [newLesson, setNewLesson] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState({ passScore: m.quiz?.passScore ?? 80, questionsServed: m.quiz?.questionsServed ?? 8 });

  return (
    <div className="rounded-[var(--a-radius-control)] border border-[#E6EBF1]">
      <div className="flex flex-wrap items-start justify-between gap-2 bg-[var(--a-surface-2)] rounded-t-xl px-4 py-3">
        {editing ? (
          <div className="flex-1 min-w-[240px] space-y-2">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className={`${inputCls} min-h-[60px]`} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary (optional)" />
            <div className="flex gap-2">
              <button type="button" disabled={!!busy} onClick={async () => { if (await run({ op: "module.update", id: m.id, title, summary: summary || null })) setEditing(false); }} className={btnPrimary}><Save size={14} /> Save</button>
              <button type="button" onClick={() => setEditing(false)} className={btnGhost}><X size={14} /> Cancel</button>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="font-dm font-semibold text-[var(--a-ink)]">Module {index + 1}: {m.title}</p>
            <p className="font-dm text-xs text-[var(--a-ink-3)]">{m.lessons.length} lessons · {m.estimatedMinutes} min · quiz {m.quiz ? `${m.quiz.questions.length} questions` : "none"}</p>
          </div>
        )}
        {!editing && (
          <div className="flex items-center gap-1">
            <button type="button" disabled={index === 0 || !!busy} onClick={() => run({ op: "module.move", id: m.id, dir: "up" })} className={btnGhost} aria-label="Move module up"><ArrowUp size={14} /></button>
            <button type="button" disabled={last || !!busy} onClick={() => run({ op: "module.move", id: m.id, dir: "down" })} className={btnGhost} aria-label="Move module down"><ArrowDown size={14} /></button>
            <button type="button" onClick={() => setEditing(true)} className={btnGhost} aria-label="Edit module"><Pencil size={14} /></button>
            <button type="button" disabled={!!busy} onClick={() => run({ op: "module.delete", id: m.id }, { confirmText: `Delete "${m.title}" and all its lessons, quiz and question banks?` })} className={btnDanger} aria-label="Delete module"><Trash2 size={14} /></button>
          </div>
        )}
      </div>

      <ul className="divide-y divide-[var(--a-border)]">
        {m.lessons.map((l, li) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="min-w-0">
              <Link href={`/admin_pro/learn/lessons/${l.id}`} className="font-dm text-sm font-medium text-[var(--a-ink)] hover:text-[var(--a-blue)] hover:underline">
                {index + 1}.{li + 1} {l.title}
              </Link>
              <p className="font-dm text-xs text-[var(--a-ink-3)] flex flex-wrap gap-x-3">
                <span>{l.durationMinutes} min</span>
                {l.hasVideo && <span className="inline-flex items-center gap-1"><Video size={11} /> video</span>}
                <span>{l.resources} resources</span>
                <span>{l.checkQuestions} check questions</span>
                {l.isPreview && <span className="text-[#0F6E56]">free preview</span>}
                {l.completions > 0 && <span>{l.completions} completions</span>}
                {l.edited && <span className="text-[#B8500A]">edited</span>}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" disabled={li === 0 || !!busy} onClick={() => run({ op: "lesson.move", id: l.id, dir: "up" })} className={btnGhost} aria-label="Move lesson up"><ArrowUp size={13} /></button>
              <button type="button" disabled={li === m.lessons.length - 1 || !!busy} onClick={() => run({ op: "lesson.move", id: l.id, dir: "down" })} className={btnGhost} aria-label="Move lesson down"><ArrowDown size={13} /></button>
              <Link href={`/admin_pro/learn/lessons/${l.id}`} className={btnGhost} aria-label="Edit lesson"><Pencil size={13} /></Link>
              <button type="button" disabled={!!busy} onClick={() => run({ op: "lesson.delete", id: l.id }, { confirmText: `Delete the lesson "${l.title}"?` })} className={btnDanger} aria-label="Delete lesson"><Trash2 size={13} /></button>
            </div>
          </li>
        ))}
      </ul>

      <div className="px-4 py-3 space-y-3 border-t border-[var(--a-border)]">
        <div className="flex gap-2">
          <input className={inputCls} value={newLesson} onChange={(e) => setNewLesson(e.target.value)} placeholder="New lesson title" />
          <button
            type="button"
            disabled={!newLesson.trim() || !!busy}
            onClick={async () => {
              const r = await run({ op: "lesson.create", moduleId: m.id, title: newLesson }, { refresh: false });
              if (r?.id) window.location.href = `/admin_pro/learn/lessons/${r.id}`;
            }}
            className={`${btnPrimary} shrink-0`}
          ><Plus size={14} /> Add lesson</button>
        </div>

        {labs.length > 0 && (
          <p className="font-dm text-xs text-[var(--a-ink-2)] flex flex-wrap gap-2 items-center">
            <FlaskConical size={13} className="text-[#7c3aed]" /> Labs:
            {labs.map((lab) => <Link key={lab.id} href={`/admin_pro/learn/labs/${lab.id}`} className="text-[var(--a-blue)] hover:underline">{lab.title}</Link>)}
          </p>
        )}

        <button type="button" onClick={() => setShowQuiz(!showQuiz)} className={btnGhost}>
          <ListChecks size={14} /> {showQuiz ? "Hide" : "Edit"} module quiz ({m.quiz?.questions.length ?? 0} questions)
        </button>
        {showQuiz && (
          <div className="rounded-[var(--a-radius-control)] border border-[#E6EBF1] p-4 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div><label className={labelCls}>Pass score %</label><input className={`${inputCls} w-24`} type="number" min="0" max="100" value={quiz.passScore} onChange={(e) => setQuiz({ ...quiz, passScore: Number(e.target.value) })} /></div>
              <div><label className={labelCls}>Questions per attempt</label><input className={`${inputCls} w-24`} type="number" min="1" value={quiz.questionsServed} onChange={(e) => setQuiz({ ...quiz, questionsServed: Number(e.target.value) })} /></div>
              <button type="button" disabled={!!busy} onClick={() => run({ op: "bank.settings", bank: "quiz", parentId: m.id, ...quiz })} className={btnPrimary}><Save size={14} /> Save quiz settings</button>
            </div>
            <p className="font-dm text-xs text-[var(--a-ink-3)]">Each attempt draws this many questions at random from the bank below, so a bigger bank gives better retakes.</p>
            <QuestionBank bank="quiz" parentId={m.id} questions={m.quiz?.questions ?? []} />
          </div>
        )}
        {error && <p className="font-dm text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

// ── Labs ────────────────────────────────────────────────────────────────────

function Labs({ trackId, labs, modules }: { trackId: string; labs: LabRow[]; modules: ModuleRow[] }) {
  return (
    <Section
      title={`Labs (${labs.length})`}
      icon={FlaskConical}
      defaultOpen={false}
      right={<Link href={`/admin_pro/learn/labs/new?track=${trackId}`} className={btnGhost}><Plus size={14} /> New lab</Link>}
    >
      {labs.length === 0 ? (
        <p className="font-dm text-sm text-[var(--a-ink-3)]">No labs yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--a-border)]">
          {labs.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 font-dm text-sm">
              <div>
                <Link href={`/admin_pro/learn/labs/${l.id}`} className="font-medium text-[var(--a-ink)] hover:text-[var(--a-blue)] hover:underline">{l.title}</Link>
                <p className="text-xs text-[var(--a-ink-3)]">
                  {l.labType} · {l.estimatedMinutes} min · {modules.find((m) => m.id === l.moduleId)?.title ?? "no module"} {l.isPublished ? "" : "· unpublished"}
                </p>
              </div>
              <Link href={`/admin_pro/learn/labs/${l.id}`} className={btnGhost}><Pencil size={13} /></Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ── Final exam ──────────────────────────────────────────────────────────────

function ExamEditor({ trackId, exam, modules }: { trackId: string; exam: Exam | null; modules: Array<{ id: string; title: string }> }) {
  const { run, busy, error } = useOp();
  const [f, setF] = useState({
    title: exam?.title ?? "Final exam", timeLimitMinutes: exam?.timeLimitMinutes ?? 45, questionsServed: exam?.questionsServed ?? 30,
    passScore: exam?.passScore ?? 75, distinctionScore: exam?.distinctionScore ?? 90, maxAttempts: exam?.maxAttempts ?? 3,
    cooldownHours: exam?.cooldownHours ?? 24, instructionsMd: exam?.instructionsMd ?? "",
  });
  const num = (k: keyof typeof f, label: string) => (
    <div><label className={labelCls}>{label}</label><input className={inputCls} type="number" min="0" value={f[k] as number} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} /></div>
  );
  return (
    <Section title={`Final exam (${exam?.questions.length ?? 0} questions)`} icon={ListChecks} defaultOpen={false}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3"><label className={labelCls}>Title</label><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        {num("timeLimitMinutes", "Time limit (minutes)")}
        {num("questionsServed", "Questions per attempt")}
        {num("passScore", "Pass score %")}
        {num("distinctionScore", "Distinction score %")}
        {num("maxAttempts", "Max attempts")}
        {num("cooldownHours", "Hours between attempts")}
        <div className="sm:col-span-3"><label className={labelCls}>Instructions (Markdown)</label><textarea className={`${inputCls} min-h-[80px]`} value={f.instructionsMd} onChange={(e) => setF({ ...f, instructionsMd: e.target.value })} /></div>
      </div>
      {error && <p className="font-dm text-sm text-red-600 mt-3">{error}</p>}
      <button type="button" disabled={!!busy} onClick={() => run({ op: "exam.settings", trackId, data: f })} className={`${btnPrimary} mt-3`}><Save size={14} /> {exam ? "Save exam settings" : "Create exam"}</button>
      {exam && (
        <div className="mt-5">
          <p className="font-dm text-xs text-[var(--a-ink-3)] mb-2">Map each question to the module it tests so learners see their results by module.</p>
          <QuestionBank bank="exam" parentId={trackId} questions={exam.questions} modules={modules} />
        </div>
      )}
    </Section>
  );
}

// ── Capstone ────────────────────────────────────────────────────────────────

function CapstoneEditor({ trackId, capstone }: { trackId: string; capstone: Capstone | null }) {
  const { run, busy, error } = useOp();
  const [brief, setBrief] = useState(capstone?.briefMd ?? "");
  const [threshold, setThreshold] = useState(capstone?.passThreshold ?? 70);
  const [rubric, setRubric] = useState(capstone?.rubric.length ? capstone.rubric : [{ criterion: "", weight: 100, description: "" }]);
  const total = rubric.reduce((n, r) => n + (Number(r.weight) || 0), 0);
  return (
    <Section title="Capstone project" icon={GraduationCap} defaultOpen={false}>
      <label className={labelCls}>Brief (Markdown)</label>
      <textarea className={`${inputCls} min-h-[140px]`} value={brief} onChange={(e) => setBrief(e.target.value)} />
      <div className="mt-4 space-y-2">
        <label className={labelCls}>Rubric (weights must total 100%; now {total}%)</label>
        {rubric.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_auto] gap-2 items-start">
            <div className="space-y-1">
              <input className={inputCls} value={r.criterion} onChange={(e) => setRubric(rubric.map((x, j) => (j === i ? { ...x, criterion: e.target.value } : x)))} placeholder="Criterion" />
              <input className={inputCls} value={r.description ?? ""} onChange={(e) => setRubric(rubric.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} placeholder="What good looks like (optional)" />
            </div>
            <input className={inputCls} type="number" min="1" max="100" value={r.weight} onChange={(e) => setRubric(rubric.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))} aria-label="Weight" />
            <button type="button" onClick={() => setRubric(rubric.filter((_, j) => j !== i))} className={btnDanger} disabled={rubric.length === 1} aria-label="Remove criterion"><X size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={() => setRubric([...rubric, { criterion: "", weight: 10, description: "" }])} className={btnGhost}><Plus size={14} /> Criterion</button>
      </div>
      <div className="mt-3 w-40"><label className={labelCls}>Pass threshold %</label><input className={inputCls} type="number" min="0" max="100" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /></div>
      {error && <p className="font-dm text-sm text-red-600 mt-3">{error}</p>}
      <button
        type="button"
        disabled={!!busy}
        onClick={() => run({ op: "capstone.save", trackId, data: { briefMd: brief, passThreshold: threshold, rubric: rubric.map((r) => ({ ...r, description: r.description || undefined })) } })}
        className={`${btnPrimary} mt-3`}
      ><Save size={14} /> Save capstone</button>
    </Section>
  );
}
