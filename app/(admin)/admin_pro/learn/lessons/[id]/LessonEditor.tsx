"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import Markdown from "@/components/learn/Markdown";
import VideoAdmin from "@/components/learn/video/admin/VideoAdmin";
import QuestionBank, { type BankQuestion } from "../../_editor/QuestionBank";
import { useOp, inputCls, labelCls, btnPrimary, btnGhost, btnDanger } from "../../_editor/useOp";

interface Lesson {
  id: string; title: string; objective: string; contentType: string; videoUrl: string; bodyMd: string;
  durationMinutes: number; isPreview: boolean; completions: number;
}
interface Resource { id: string; title: string; url: string; resourceType: string; isFree: boolean; isRequired: boolean; notes: string }

const RESOURCE_TYPES: Array<[string, string]> = [
  ["tool", "Tool"], ["article", "Article"], ["video", "Video"], ["dataset", "Dataset"], ["template", "Template"], ["account_signup", "Account sign-up"],
];

export default function LessonEditor(props: {
  lesson: Lesson;
  crumbs: { trackId: string; trackTitle: string; moduleTitle: string };
  resources: Resource[];
  check: { passScore: number; questionsServed: number; questions: BankQuestion[] };
}) {
  const { run, busy, error } = useOp();
  const [f, setF] = useState(props.lesson);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const set = <K extends keyof Lesson>(k: K, v: Lesson[K]) => { setF((p) => ({ ...p, [k]: v })); setDirty(true); setSaved(false); };

  async function save() {
    const ok = await run({
      op: "lesson.update", id: f.id,
      data: {
        title: f.title, objective: f.objective || null, contentType: f.contentType,
        bodyMd: f.bodyMd, durationMinutes: Number(f.durationMinutes), isPreview: f.isPreview,
      },
    });
    if (ok) { setDirty(false); setSaved(true); }
  }

  const words = f.bodyMd.trim() ? f.bodyMd.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <Link href={`/admin_pro/learn/tracks/${props.crumbs.trackId}`} className="inline-flex items-center gap-1 font-dm text-sm text-[#2251A3]">
          <ArrowLeft size={14} /> {props.crumbs.trackTitle} · {props.crumbs.moduleTitle}
        </Link>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A] mt-2">{f.title || "Untitled lesson"}</h1>
        {props.lesson.completions > 0 && (
          <p className="font-dm text-xs text-[#7A8FA6] mt-1">{props.lesson.completions} learners have completed this lesson. Edits apply to everyone from now on.</p>
        )}
      </div>

      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 space-y-4">
        <div className="grid sm:grid-cols-[1fr_140px_150px] gap-3">
          <div><label className={labelCls}>Title</label><input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div><label className={labelCls}>Minutes</label><input className={inputCls} type="number" min="1" value={f.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} /></div>
          <div><label className={labelCls}>Format</label>
            <select className={inputCls} value={f.contentType} onChange={(e) => set("contentType", e.target.value)}>
              <option value="article">Reading</option><option value="video">Video</option><option value="mixed">Video + reading</option>
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Learning objective (one sentence)</label><input className={inputCls} value={f.objective} onChange={(e) => set("objective", e.target.value)} placeholder="By the end of this lesson you can…" /></div>
        <p className="font-dm text-xs text-[#7A8FA6]">The lesson video is set in the Video section below.</p>
        <label className="flex items-center gap-2 font-dm text-sm text-[#0D1B2A]">
          <input type="checkbox" checked={f.isPreview} onChange={(e) => set("isPreview", e.target.checked)} className="accent-[#F47C20] w-4 h-4" />
          Free preview: visible to people who have not subscribed
        </label>
        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Lesson text (Markdown · {words} words)</label>
            <button type="button" onClick={() => setPreview(!preview)} className={btnGhost}>{preview ? <><Pencil size={13} /> Edit</> : <><Eye size={13} /> Preview</>}</button>
          </div>
          {preview ? (
            <div className="rounded-lg border border-[#D2DCE8] bg-white p-5 prose-sm max-w-none"><Markdown source={f.bodyMd} /></div>
          ) : (
            <textarea className={`${inputCls} min-h-[380px] font-mono text-[13px] leading-6`} value={f.bodyMd} onChange={(e) => set("bodyMd", e.target.value)} placeholder={"## Heading\n\nParagraph text. **Bold**, *italic*, [a link](https://…)\n\n- A bullet\n- Another"} />
          )}
          <p className="font-dm text-xs text-[#7A8FA6] mt-1">Supports headings (##), bold, italic, links, bullet and numbered lists, code and tables.</p>
        </div>
        {error && <p className="font-dm text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={!!busy || !dirty} className={btnPrimary}><Save size={14} /> {busy === "lesson.update" ? "Saving…" : "Save lesson"}</button>
          {saved && <span className="font-dm text-sm text-green-700">Saved</span>}
          {dirty && <span className="font-dm text-xs text-amber-700">Unsaved changes</span>}
        </div>
      </section>

      {/* Video link, chapters, captions and script (saved on their own; components/learn/video/admin). */}
      <VideoAdmin lessonId={f.id} lessonTitle={f.title} initialUrl={props.lesson.videoUrl} />

      <Resources lessonId={f.id} resources={props.resources} />

      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Lesson check</h2>
          <p className="font-dm text-xs text-[#7A8FA6]">Short questions learners answer after the lesson. Each attempt draws from this bank.</p>
        </div>
        <CheckSettings lessonId={f.id} initial={props.check} />
        <QuestionBank bank="micro" parentId={f.id} questions={props.check.questions} />
      </section>
    </div>
  );
}

function CheckSettings({ lessonId, initial }: { lessonId: string; initial: { passScore: number; questionsServed: number } }) {
  const { run, busy, error } = useOp();
  const [s, setS] = useState(initial);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div><label className={labelCls}>Pass score %</label><input className={`${inputCls} w-24`} type="number" min="0" max="100" value={s.passScore} onChange={(e) => setS({ ...s, passScore: Number(e.target.value) })} /></div>
      <div><label className={labelCls}>Questions per attempt</label><input className={`${inputCls} w-24`} type="number" min="1" value={s.questionsServed} onChange={(e) => setS({ ...s, questionsServed: Number(e.target.value) })} /></div>
      <button type="button" disabled={!!busy} onClick={() => run({ op: "bank.settings", bank: "micro", parentId: lessonId, ...s })} className={btnGhost}><Save size={14} /> Save</button>
      {error && <p className="font-dm text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Resources({ lessonId, resources }: { lessonId: string; resources: Resource[] }) {
  const { run, busy, error } = useOp();
  const blank = { title: "", url: "", resourceType: "article", isFree: true, isRequired: false, notes: "" };
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [d, setD] = useState<Omit<Resource, "id">>(blank);

  async function save() {
    const data = { ...d, notes: d.notes || null };
    const ok = editing === "new"
      ? await run({ op: "resource.create", lessonId, data })
      : await run({ op: "resource.update", id: editing, data });
    if (ok) setEditing(null);
  }

  const form = (
    <div className="rounded-xl border border-[#2251A3]/30 bg-[#F8FAFD] p-4 grid sm:grid-cols-2 gap-3">
      <div><label className={labelCls}>Title</label><input className={inputCls} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
      <div><label className={labelCls}>Type</label>
        <select className={inputCls} value={d.resourceType} onChange={(e) => setD({ ...d, resourceType: e.target.value })}>{RESOURCE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>
      <div className="sm:col-span-2"><label className={labelCls}>Link</label><input className={inputCls} value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="https://…" /></div>
      <div className="sm:col-span-2"><label className={labelCls}>Note for learners (optional)</label><input className={inputCls} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} /></div>
      <label className="flex items-center gap-2 font-dm text-sm"><input type="checkbox" checked={d.isFree} onChange={(e) => setD({ ...d, isFree: e.target.checked })} className="accent-[#F47C20]" /> Free</label>
      <label className="flex items-center gap-2 font-dm text-sm"><input type="checkbox" checked={d.isRequired} onChange={(e) => setD({ ...d, isRequired: e.target.checked })} className="accent-[#F47C20]" /> Required</label>
      <div className="sm:col-span-2 flex gap-2">
        <button type="button" onClick={save} disabled={!!busy} className={btnPrimary}><Save size={14} /> Save resource</button>
        <button type="button" onClick={() => setEditing(null)} className={btnGhost}><X size={14} /> Cancel</button>
      </div>
    </div>
  );

  return (
    <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 space-y-3">
      <div>
        <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Resources</h2>
        <p className="font-dm text-xs text-[#7A8FA6]">Tools, readings, videos, templates and downloads learners use with this lesson. Files can be linked from Google Drive, Dropbox or any public URL.</p>
      </div>
      <ul className="space-y-2">
        {resources.map((r, i) =>
          editing === r.id ? <li key={r.id}>{form}</li> : (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#E6EBF1] px-3 py-2 font-dm text-sm">
              <div className="min-w-0">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0D1B2A] hover:underline">{r.title}</a>
                <p className="text-xs text-[#7A8FA6] truncate">{r.resourceType}{r.isRequired ? " · required" : ""}{r.isFree ? "" : " · paid"} · {r.url}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" disabled={i === 0 || !!busy} onClick={() => run({ op: "resource.move", id: r.id, dir: "up" })} className={btnGhost} aria-label="Move up"><ArrowUp size={13} /></button>
                <button type="button" disabled={i === resources.length - 1 || !!busy} onClick={() => run({ op: "resource.move", id: r.id, dir: "down" })} className={btnGhost} aria-label="Move down"><ArrowDown size={13} /></button>
                <button type="button" onClick={() => { setEditing(r.id); setD({ ...r }); }} className={btnGhost} aria-label="Edit"><Pencil size={13} /></button>
                <button type="button" disabled={!!busy} onClick={() => run({ op: "resource.delete", id: r.id }, { confirmText: "Remove this resource?" })} className={btnDanger} aria-label="Delete"><Trash2 size={13} /></button>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing === "new" ? form : <button type="button" onClick={() => { setEditing("new"); setD(blank); }} className={btnGhost}><Plus size={14} /> Add resource</button>}
      {error && <p className="font-dm text-sm text-red-600">{error}</p>}
    </section>
  );
}
