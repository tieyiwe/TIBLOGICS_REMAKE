"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import { LAB_TYPE_META, type LabType } from "@/lib/learn/labs/types";
import { useOp, inputCls, labelCls, btnPrimary, btnGhost, btnDanger } from "../../_editor/useOp";

interface Objective { id: string; label: string; weight: number; guidance?: string }
interface LabData {
  id: string; slug: string; title: string; labType: string; moduleId: string; lessonId: string; briefMd: string; scenarioMd: string;
  objectives: Objective[]; config: Record<string, unknown>; passScore: number; points: number; estimatedMinutes: number;
  isPublished: boolean; attempts: number;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 70);
const keyify = (s: string, i: number) => slugify(s).slice(0, 30) || `item-${i + 1}`;

const CRITIQUE_TEMPLATE = {
  answerMd: "Paste the AI answer learners will review. Plant the problems in it.",
  flaws: [{ id: "f1", quote: "exact words from the answer that are wrong", explanation: "Why it is wrong", category: "fabrication" }],
  candidates: [
    { id: "c1", text: "A statement describing a real flaw", isFlaw: true, flawId: "f1" },
    { id: "c2", text: "A statement that sounds like a flaw but is fine", isFlaw: false },
  ],
};

export default function LabEditor(props: {
  trackId: string;
  trackTitle: string;
  modules: Array<{ id: string; title: string; lessons: Array<{ id: string; title: string }> }>;
  lab: LabData | null;
}) {
  const { run, busy, error, setError } = useOp();
  const isNew = !props.lab;
  const [f, setF] = useState<Omit<LabData, "id" | "attempts">>(
    props.lab ?? {
      slug: "", title: "", labType: "workbench", moduleId: "", lessonId: "", briefMd: "", scenarioMd: "",
      objectives: [{ id: "objective-1", label: "", weight: 1 }], config: { fields: [{ id: "answer", label: "Your answer", prompt: "" }] },
      passScore: 70, points: 40, estimatedMinutes: 20, isPublished: false,
    },
  );
  const [critiqueJson, setCritiqueJson] = useState(JSON.stringify(f.labType === "critique" ? f.config : CRITIQUE_TEMPLATE, null, 2));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const cfg = f.config;
  const setCfg = (k: string, v: unknown) => setF((p) => ({ ...p, config: { ...p.config, [k]: v } }));
  const lessons = props.modules.find((m) => m.id === f.moduleId)?.lessons ?? [];

  function changeType(t: string) {
    // Each type needs different settings; start from a usable shape.
    const starter: Record<string, Record<string, unknown>> = {
      prompt: { sandboxSystem: "", starterPrompt: "", maxRuns: 5, contextMd: "" },
      critique: CRITIQUE_TEMPLATE,
      build: { steps: [{ id: "step-1", label: "", detail: "" }], requireArtifact: true, artifactLabel: "Link to your work" },
      workbench: { fields: [{ id: "answer", label: "Your answer", prompt: "", minWords: 30 }] },
    };
    setF((p) => ({ ...p, labType: t, config: starter[t] }));
    if (t === "critique") setCritiqueJson(JSON.stringify(CRITIQUE_TEMPLATE, null, 2));
  }

  async function save() {
    let config = f.config;
    if (f.labType === "critique") {
      try {
        config = JSON.parse(critiqueJson);
      } catch {
        setError("Critique settings are not valid JSON.");
        return;
      }
    }
    const r = await run({
      op: "lab.save", trackId: props.trackId, id: props.lab?.id,
      data: {
        ...f, slug: f.slug || slugify(f.title), moduleId: f.moduleId || null, lessonId: f.lessonId || null, scenarioMd: f.scenarioMd || null,
        objectives: f.objectives.map((o, i) => ({ ...o, id: o.id || keyify(o.label, i), guidance: o.guidance || undefined })), config,
      },
    }, { refresh: !isNew });
    if (r?.id && isNew) window.location.href = `/admin_pro/learn/labs/${r.id}`;
  }

  async function remove() {
    const r = await run({ op: "lab.delete", id: props.lab!.id }, { confirmText: `Delete the lab "${f.title}"?`, refresh: false });
    if (r) window.location.href = `/admin_pro/learn/tracks/${props.trackId}`;
  }

  const listEditor = (key: "steps" | "fields", fieldsFor: (item: Record<string, unknown>, i: number, update: (patch: Record<string, unknown>) => void) => React.ReactNode, make: (i: number) => Record<string, unknown>) => {
    const items = (Array.isArray(cfg[key]) ? cfg[key] : []) as Array<Record<string, unknown>>;
    const update = (i: number, patch: Record<string, unknown>) => setCfg(key, items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    return (
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-[#E6EBF1] p-3 space-y-2 relative">
            <button type="button" onClick={() => setCfg(key, items.filter((_, j) => j !== i))} className={`${btnDanger} absolute top-2 right-2`} aria-label="Remove"><X size={13} /></button>
            {fieldsFor(it, i, (patch) => update(i, patch))}
          </div>
        ))}
        <button type="button" onClick={() => setCfg(key, [...items, make(items.length)])} className={btnGhost}><Plus size={14} /> Add</button>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <Link href={`/admin_pro/learn/tracks/${props.trackId}`} className="inline-flex items-center gap-1 font-dm text-sm text-[var(--a-blue)]"><ArrowLeft size={14} /> {props.trackTitle}</Link>
        <h1 className="font-syne font-bold text-2xl text-[var(--a-ink)] mt-2">{isNew ? "New lab" : f.title}</h1>
        {props.lab && props.lab.attempts > 0 && <p className="font-dm text-xs text-[var(--a-ink-3)] mt-1">{props.lab.attempts} attempts so far. Changing objectives affects how new attempts are scored.</p>}
      </div>

      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className={labelCls}>Title</label><input className={inputCls} value={f.title} onChange={(e) => { set("title", e.target.value); if (isNew) set("slug", slugify(e.target.value)); }} /></div>
          <div><label className={labelCls}>Slug (in the lab&apos;s address)</label><input className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div>
          <div><label className={labelCls}>Type</label>
            <select className={inputCls} value={f.labType} onChange={(e) => changeType(e.target.value)}>
              {(Object.keys(LAB_TYPE_META) as LabType[]).map((t) => <option key={t} value={t}>{LAB_TYPE_META[t].label}</option>)}
            </select>
            <p className="font-dm text-xs text-[var(--a-ink-3)] mt-1">{LAB_TYPE_META[f.labType as LabType]?.blurb}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={labelCls}>Minutes</label><input className={inputCls} type="number" min="1" value={f.estimatedMinutes} onChange={(e) => set("estimatedMinutes", Number(e.target.value))} /></div>
            <div><label className={labelCls}>Pass %</label><input className={inputCls} type="number" min="0" max="100" value={f.passScore} onChange={(e) => set("passScore", Number(e.target.value))} /></div>
            <div><label className={labelCls}>Points</label><input className={inputCls} type="number" min="0" value={f.points} onChange={(e) => set("points", Number(e.target.value))} /></div>
          </div>
          <div><label className={labelCls}>Module</label>
            <select className={inputCls} value={f.moduleId} onChange={(e) => { set("moduleId", e.target.value); set("lessonId", ""); }}>
              <option value="">None</option>{props.modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Shown after lesson (optional)</label>
            <select className={inputCls} value={f.lessonId} onChange={(e) => set("lessonId", e.target.value)} disabled={!f.moduleId}>
              <option value="">None</option>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Brief (Markdown): what the learner does</label><textarea className={`${inputCls} min-h-[120px]`} value={f.briefMd} onChange={(e) => set("briefMd", e.target.value)} /></div>
        <div><label className={labelCls}>Scenario (Markdown, optional): the situation they work in</label><textarea className={`${inputCls} min-h-[80px]`} value={f.scenarioMd} onChange={(e) => set("scenarioMd", e.target.value)} /></div>
        <label className="flex items-center gap-2 font-dm text-sm"><input type="checkbox" checked={f.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="accent-[#F47C20] w-4 h-4" /> Published (visible to learners)</label>
      </section>

      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-5 space-y-3">
        <div>
          <h2 className="font-syne font-bold text-base text-[var(--a-ink)]">Objectives</h2>
          <p className="font-dm text-xs text-[var(--a-ink-3)]">What the attempt is scored against. Learners see these before they start. Weights are relative.</p>
        </div>
        {f.objectives.map((o, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_auto] gap-2 items-start">
            <div className="space-y-1">
              <input className={inputCls} value={o.label} onChange={(e) => set("objectives", f.objectives.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="What a good attempt does" />
              <input className={inputCls} value={o.guidance ?? ""} onChange={(e) => set("objectives", f.objectives.map((x, j) => (j === i ? { ...x, guidance: e.target.value } : x)))} placeholder="Guidance for the grader (optional)" />
            </div>
            <input className={inputCls} type="number" min="1" max="100" value={o.weight} onChange={(e) => set("objectives", f.objectives.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))} aria-label="Weight" />
            <button type="button" disabled={f.objectives.length === 1} onClick={() => set("objectives", f.objectives.filter((_, j) => j !== i))} className={btnDanger} aria-label="Remove objective"><X size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={() => set("objectives", [...f.objectives, { id: "", label: "", weight: 1 }])} className={btnGhost}><Plus size={14} /> Objective</button>
      </section>

      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-5 space-y-3">
        <h2 className="font-syne font-bold text-base text-[var(--a-ink)]">{LAB_TYPE_META[f.labType as LabType]?.label} settings</h2>
        {f.labType === "prompt" && (
          <div className="space-y-3">
            <div><label className={labelCls}>Sandbox model instructions (what the learner&apos;s prompt runs against)</label><textarea className={`${inputCls} min-h-[80px]`} value={String(cfg.sandboxSystem ?? "")} onChange={(e) => setCfg("sandboxSystem", e.target.value)} /></div>
            <div><label className={labelCls}>Starter prompt shown in the editor (optional)</label><textarea className={`${inputCls} min-h-[60px]`} value={String(cfg.starterPrompt ?? "")} onChange={(e) => setCfg("starterPrompt", e.target.value)} /></div>
            <div><label className={labelCls}>Fixed context given with the prompt (optional)</label><textarea className={`${inputCls} min-h-[60px]`} value={String(cfg.contextMd ?? "")} onChange={(e) => setCfg("contextMd", e.target.value)} /></div>
            <div className="w-32"><label className={labelCls}>Runs per attempt</label><input className={inputCls} type="number" min="1" max="20" value={Number(cfg.maxRuns ?? 5)} onChange={(e) => setCfg("maxRuns", Number(e.target.value))} /></div>
          </div>
        )}
        {f.labType === "build" && (
          <>
            {listEditor("steps", (it, i, up) => (
              <>
                <input className={inputCls} value={String(it.label ?? "")} onChange={(e) => up({ label: e.target.value, id: it.id || keyify(e.target.value, i) })} placeholder={`Step ${i + 1}`} />
                <input className={inputCls} value={String(it.detail ?? "")} onChange={(e) => up({ detail: e.target.value })} placeholder="Detail (optional)" />
              </>
            ), (i) => ({ id: `step-${i + 1}`, label: "", detail: "" }))}
            <label className="flex items-center gap-2 font-dm text-sm"><input type="checkbox" checked={cfg.requireArtifact !== false} onChange={(e) => setCfg("requireArtifact", e.target.checked)} className="accent-[#F47C20]" /> Require a link to the finished work</label>
            <input className={inputCls} value={String(cfg.artifactLabel ?? "")} onChange={(e) => setCfg("artifactLabel", e.target.value)} placeholder="Label for the link field" />
          </>
        )}
        {f.labType === "workbench" && listEditor("fields", (it, i, up) => (
          <>
            <input className={inputCls} value={String(it.label ?? "")} onChange={(e) => up({ label: e.target.value, id: it.id || keyify(e.target.value, i) })} placeholder="Field label" />
            <textarea className={`${inputCls} min-h-[50px]`} value={String(it.prompt ?? "")} onChange={(e) => up({ prompt: e.target.value })} placeholder="What to write in this field" />
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <input className={inputCls} value={String(it.placeholder ?? "")} onChange={(e) => up({ placeholder: e.target.value })} placeholder="Placeholder (optional)" />
              <input className={inputCls} type="number" min="0" value={Number(it.minWords ?? 30)} onChange={(e) => up({ minWords: Number(e.target.value) })} aria-label="Minimum words" />
            </div>
          </>
        ), (i) => ({ id: `field-${i + 1}`, label: "", prompt: "", minWords: 30 }))}
        {f.labType === "critique" && (
          <>
            <p className="font-dm text-xs text-[var(--a-ink-3)]">
              The AI answer to review (answerMd), the flaws planted in it (each quote must appear word for word in the answer), and the
              statements learners choose from (candidates; genuine flaws point to a flaw id). Checked when you save.
            </p>
            <textarea className={`${inputCls} min-h-[320px] font-mono text-[12px]`} value={critiqueJson} onChange={(e) => setCritiqueJson(e.target.value)} />
          </>
        )}
      </section>

      {error && <p className="font-dm text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={!!busy} className={btnPrimary}><Save size={14} /> {busy === "lab.save" ? "Saving…" : isNew ? "Create lab" : "Save lab"}</button>
        {!isNew && <button type="button" onClick={remove} disabled={!!busy} className={btnDanger}><Trash2 size={14} /> Delete lab</button>}
      </div>
    </div>
  );
}
