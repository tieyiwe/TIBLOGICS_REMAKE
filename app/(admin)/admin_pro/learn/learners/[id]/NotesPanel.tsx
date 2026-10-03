"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, StickyNote, Tag, Trash2, X } from "lucide-react";
import { Button, EmptyState, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { Dialog } from "../_components/Dialog";
import { inputCls, postJson } from "../_components/fields";
import { ago, dt, initials } from "../_components/format";

// Private admin notes (a timeline) and tags. Learners never see either.

export interface NoteRow {
  id: string;
  authorEmail: string;
  authorName: string | null;
  body: string;
  createdAt: string;
}

export function NotesPanel({ learnerId, notes, canManage }: { learnerId: string; notes: NoteRow[]; canManage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<NoteRow | null>(null);

  async function add() {
    setBusy(true);
    try {
      await postJson(`/api/admin/learn/learners/${learnerId}/actions`, { action: "addNote", body });
      setBody("");
      toast.success("Note added");
      router.refresh();
    } catch (err) {
      toast.error("Note not added", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await postJson(`/api/admin/learn/learners/${learnerId}/actions`, { action: "deleteNote", noteId: del.id });
      toast.success("Note deleted");
      setDel(null);
      router.refresh();
    } catch (err) {
      toast.error("Note not deleted", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {canManage ? (
        <div className="rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface-2)]/50 p-3">
          <label htmlFor="note-body" className="sr-only">New note</label>
          <textarea
            id="note-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Add a private note: a call, a promise made, context for the next person."
            className={cn(inputCls, "resize-y bg-[var(--a-surface)] py-2 leading-relaxed")}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) add();
            }}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="font-dm text-[11.5px] text-[var(--a-ink-3)]">Only staff see notes. Ctrl + Enter to save.</p>
            <Button size="sm" variant="primary" icon={Plus} loading={busy && !del} disabled={!body.trim()} onClick={add}>
              Add note
            </Button>
          </div>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" body="Notes help the next person who helps this learner." compact />
      ) : (
        <ol className="relative mt-5 space-y-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-[var(--a-border)]">
          {notes.map((n) => (
            <li key={n.id} className="relative flex gap-3">
              <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--a-navy)] font-dm text-[11px] font-bold text-white ring-4 ring-[var(--a-surface)]" aria-hidden>
                {initials(n.authorName || n.authorEmail)}
              </span>
              <div className="min-w-0 flex-1 rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface)] px-3.5 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-dm text-[12.5px] font-semibold text-[var(--a-ink)]">
                    {n.authorName || n.authorEmail}
                    <span className="ml-2 font-normal text-[var(--a-ink-3)]" title={dt(n.createdAt)}>{ago(n.createdAt)}</span>
                  </p>
                  {canManage ? (
                    <button type="button" onClick={() => setDel(n)} aria-label="Delete note" className="rounded-md p-1 text-[var(--a-ink-3)] hover:bg-[var(--a-danger-bg)] hover:text-[var(--a-danger)]">
                      <Trash2 size={14} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)]">{n.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete this note?"
        icon={Trash2}
        tone="danger"
        description="The note is removed for everyone. The deletion is recorded in the audit log."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={remove}>Delete note</Button>
          </>
        }
      />
    </div>
  );
}

const SUGGESTED = ["vip", "scholarship", "at risk", "partner", "beta tester"];

export function TagsEditor({ learnerId, tags, known, canManage }: { learnerId: string; tags: string[]; known: string[]; canManage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(next: string[]) {
    setBusy(true);
    try {
      await postJson(`/api/admin/learn/learners/${learnerId}/actions`, { action: "setTags", tags: next });
      router.refresh();
    } catch (err) {
      toast.error("Tags not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = [...new Set([...SUGGESTED, ...known])].filter((t) => !tags.includes(t)).slice(0, 8);

  return (
    <div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
        {tags.length === 0 ? <li className="font-dm text-[13px] text-[var(--a-ink-3)]">No tags.</li> : null}
        {tags.map((t) => (
          <li key={t} className="inline-flex items-center gap-1 rounded-full bg-[var(--a-orange-bg)] py-0.5 pl-2.5 pr-1 font-dm text-[12.5px] font-semibold text-[var(--a-orange-text)] ring-1 ring-inset ring-[#f9d6b8]">
            <Tag size={11} aria-hidden />
            {t}
            {canManage ? (
              <button type="button" disabled={busy} aria-label={`Remove tag ${t}`} onClick={() => save(tags.filter((x) => x !== t))} className="rounded-full p-0.5 hover:bg-white/70">
                <X size={12} aria-hidden />
              </button>
            ) : (
              <span className="w-1" />
            )}
          </li>
        ))}
      </ul>
      {canManage ? (
        <>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = value.trim().toLowerCase();
              if (!v || tags.includes(v)) return;
              setValue("");
              save([...tags, v]);
            }}
          >
            <label htmlFor="tag-input" className="sr-only">Add a tag</label>
            <input id="tag-input" value={value} onChange={(e) => setValue(e.target.value)} maxLength={32} placeholder="Add a tag" className={cn(inputCls, "h-8 text-[13px]")} list="tag-known" />
            <datalist id="tag-known">
              {known.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <Button size="sm" type="submit" variant="secondary" disabled={!value.trim() || busy}>Add</Button>
          </form>
          {suggestions.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} type="button" disabled={busy} onClick={() => save([...tags, s])} className="rounded-full border border-dashed border-[var(--a-border-strong)] px-2 py-0.5 font-dm text-[12px] text-[var(--a-ink-3)] hover:border-[var(--a-ink-3)] hover:text-[var(--a-ink)]">
                  + {s}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
