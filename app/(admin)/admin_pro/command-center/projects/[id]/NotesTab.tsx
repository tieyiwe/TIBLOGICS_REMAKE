"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, FileText, NotebookPen, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, EmptyState, SearchInput, useConfirm, useToast } from "@/components/admin/ui";
import type { NoteDTO, ProjectBundle } from "@/lib/admin/command-center/pm";
import { NOTE_KINDS } from "@/lib/admin/command-center/constants";
import { localTodayKey, relativeDay } from "@/lib/admin/command-center/dates";
import { api, errMsg } from "../../_components/api";
import { emitChanged } from "../../_components/CcShell";
import { inputCls, SelectInput } from "../../_components/fields";
import { Markdown, toggleChecklistLine } from "../../_components/Markdown";
import { MarkdownEditor } from "../../_components/MarkdownEditor";

type SaveState = "saved" | "saving" | "dirty" | "error";

export function NotesTab({ b, reload, setB }: { b: ProjectBundle; reload: () => Promise<void>; setB: React.Dispatch<React.SetStateAction<ProjectBundle>> }) {
  const toast = useToast();
  const confirm = useConfirm();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(search?.get("note") ?? b.notes[0]?.id ?? null);
  const [capture, setCapture] = useState("");
  const [busy, setBusy] = useState(false);
  const today = localTodayKey();

  const notes = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return b.notes.filter((n) => !ql || `${n.title} ${n.bodyMd}`.toLowerCase().includes(ql));
  }, [b.notes, q]);
  const active = b.notes.find((n) => n.id === activeId) ?? null;

  const select = (id: string) => {
    setActiveId(id);
    const sp = new URLSearchParams(search?.toString());
    sp.set("tab", "notes");
    sp.set("note", id);
    router.replace(`${pathname}?${sp}`, { scroll: false });
  };

  const create = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      const r = await api<{ note: NoteDTO }>("/api/admin/pm/notes", { body: { projectId: b.project.id, ...body } });
      setB((x) => ({ ...x, notes: [r.note, ...x.notes] }));
      select(r.note.id);
      toast.success(msg, r.note.title);
      emitChanged({ kind: "note", projectId: b.project.id });
      return true;
    } catch (e) {
      toast.error("Could not create the note", errMsg(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-3">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!capture.trim()) return;
            if (await create({ bodyMd: capture.trim(), kind: "note" }, "Captured")) setCapture("");
          }}
          className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-3 shadow-[var(--a-shadow-card)]"
        >
          <label htmlFor="quick-capture" className="a-micro mb-1.5 block">
            Quick capture
          </label>
          <textarea
            id="quick-capture"
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
            rows={2}
            placeholder="A thought, a decision, a link. First line becomes the title."
            className={cn(inputCls, "h-auto py-2")}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" type="submit" variant="primary" disabled={!capture.trim()} loading={busy}>
              Save note
            </Button>
            <Button size="sm" icon={CalendarDays} onClick={() => void create({ kind: "meeting" }, "Meeting notes started")}>
              Meeting
            </Button>
            <Button size="sm" icon={Plus} onClick={() => void create({ kind: "spec", title: "Untitled spec", bodyMd: "## Problem\n\n## Proposal\n\n## Open questions\n- [ ] \n" }, "Spec created")}>
              Spec
            </Button>
            <Button size="sm" icon={Plus} onClick={() => void create({ kind: "decision", title: "Decision", bodyMd: "## Decision\n\n## Why\n\n## Alternatives considered\n- \n" }, "Decision record created")}>
              Decision
            </Button>
          </div>
        </form>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes" label="Search notes" className="sm:max-w-none" />
        {notes.length ? (
          <ul className="space-y-1" aria-label="Notes">
            {notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => select(n.id)}
                  aria-current={n.id === activeId ? "page" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-[10px] px-3 py-2 text-left transition-colors",
                    n.id === activeId ? "bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] ring-1 ring-[var(--a-border)]" : "hover:bg-[var(--a-surface)]",
                  )}
                >
                  {n.kind === "meeting" ? <CalendarDays size={15} className="mt-0.5 shrink-0 text-[var(--a-ink-3)]" aria-hidden /> : <FileText size={15} className="mt-0.5 shrink-0 text-[var(--a-ink-3)]" aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{n.title}</span>
                      {n.pinned ? <Pin size={12} className="shrink-0 text-[var(--a-orange)]" aria-label="Pinned" /> : null}
                    </span>
                    <span className="block truncate font-dm text-[12px] text-[var(--a-ink-3)]">
                      {NOTE_KINDS.find((k) => k.value === n.kind)?.label} · {relativeDay(n.updatedAt.slice(0, 10), today)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 font-dm text-[13px] text-[var(--a-ink-3)]">{q ? "No notes match." : "No notes yet."}</p>
        )}
      </aside>

      <section className="min-w-0">
        {active ? (
          <NoteEditor
            key={active.id}
            note={active}
            onSaved={(n) => setB((x) => ({ ...x, notes: x.notes.map((o) => (o.id === n.id ? n : o)) }))}
            onDelete={async () => {
              if (!(await confirm({ title: `Delete "${active.title}"?`, danger: true, confirmLabel: "Delete note" }))) return;
              try {
                await api(`/api/admin/pm/notes/${active.id}`, { method: "DELETE" });
                setB((x) => ({ ...x, notes: x.notes.filter((o) => o.id !== active.id) }));
                setActiveId(b.notes.find((o) => o.id !== active.id)?.id ?? null);
                toast.success("Note deleted");
              } catch (e) {
                toast.error("Could not delete", errMsg(e));
              }
            }}
            onTaskCreated={async () => {
              await reload();
              emitChanged({ kind: "task", projectId: b.project.id });
            }}
          />
        ) : (
          <EmptyState icon={NotebookPen} title="Notes for this project" body="Meeting notes, specs and decisions live here. Checklist items in a note turn into tasks in one click." />
        )}
      </section>
    </div>
  );
}

function NoteEditor({ note, onSaved, onDelete, onTaskCreated }: { note: NoteDTO; onSaved: (n: NoteDTO) => void; onDelete: () => void; onTaskCreated: () => Promise<void> }) {
  const toast = useToast();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.bodyMd);
  const [mode, setMode] = useState<"read" | "edit">(note.bodyMd.trim() ? "read" : "edit");
  const [state, setState] = useState<SaveState>("saved");
  const [busyLine, setBusyLine] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, body });
  latest.current = { title, body };

  const save = async (patch: Record<string, unknown>) => {
    setState("saving");
    try {
      const r = await api<{ note: NoteDTO }>(`/api/admin/pm/notes/${note.id}`, { method: "PATCH", body: patch });
      onSaved(r.note);
      setState("saved");
      return r.note;
    } catch (e) {
      setState("error");
      toast.error("Could not save the note", errMsg(e));
      return null;
    }
  };
  // Autosave 800 ms after typing stops; flush on unmount.
  const schedule = (t: string, bdy: string) => {
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save({ title: t.trim() || "Untitled", bodyMd: bdy }), 800);
  };
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        const { title: t, body: bdy } = latest.current;
        void fetch(`/api/admin/pm/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t.trim() || "Untitled", bodyMd: bdy }), keepalive: true });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const actionItem = async (line: number) => {
    if (state !== "saved") {
      if (timer.current) clearTimeout(timer.current);
      await save({ title: title.trim() || "Untitled", bodyMd: body });
    }
    setBusyLine(line);
    try {
      const r = await api<{ task: { title: string; dueKey: string | null }; note: NoteDTO }>(`/api/admin/pm/notes/${note.id}/action-item`, { body: { line, today: localTodayKey() } });
      setBody(r.note.bodyMd);
      onSaved(r.note);
      toast.success("Task created", r.task.dueKey ? `${r.task.title}, due ${r.task.dueKey}` : r.task.title);
      await onTaskCreated();
    } catch (e) {
      toast.error("Could not create the task", errMsg(e));
    } finally {
      setBusyLine(null);
    }
  };

  return (
    <article className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--a-border)] px-5 py-3">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            schedule(e.target.value, body);
          }}
          aria-label="Note title"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 font-syne text-[19px] font-bold text-[var(--a-ink)] hover:border-[var(--a-border)] focus:border-[var(--a-blue)] focus:outline-none"
        />
        <span className={cn("font-dm text-[12px]", state === "error" ? "text-[var(--a-danger)]" : "text-[var(--a-ink-3)]")} aria-live="polite">
          {state === "saving" ? "Saving" : state === "dirty" ? "Unsaved" : state === "error" ? "Not saved" : "Saved"}
        </span>
      </header>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--a-border)] px-5 py-2">
        <SelectInput value={note.kind} onChange={(e) => void save({ kind: e.target.value })} aria-label="Note type" className="h-8 w-auto">
          {NOTE_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </SelectInput>
        <Button size="sm" variant="ghost" icon={note.pinned ? PinOff : Pin} onClick={() => void save({ pinned: !note.pinned })}>
          {note.pinned ? "Unpin" : "Pin"}
        </Button>
        <Button size="sm" variant={mode === "edit" ? "primary" : "secondary"} onClick={() => setMode(mode === "edit" ? "read" : "edit")}>
          {mode === "edit" ? "Done editing" : "Edit"}
        </Button>
        <span className="ml-auto font-dm text-[12px] text-[var(--a-ink-3)]">by {note.createdByName}</span>
        <Button size="sm" variant="ghost" icon={Trash2} onClick={onDelete} aria-label="Delete note" />
      </div>
      <div className="px-5 py-4">
        {mode === "edit" ? (
          <MarkdownEditor
            value={body}
            onChange={(v) => {
              setBody(v);
              schedule(title, v);
            }}
            ariaLabel="Note body"
            placeholder={"## Heading\n- [ ] Action item @name fri\nLinks, `code`, **bold**"}
            minRows={16}
          />
        ) : (
          <>
            {note.kind === "meeting" || /- \[ \]/.test(body) ? (
              <p className="mb-3 rounded-[10px] bg-[var(--a-info-bg)] px-3 py-2 font-dm text-[12.5px] text-[#1b3a6b]">
                Open checklist items can become tasks: use <b>Make task</b>. A date (fri, oct 12) and @name in the line set the due date and assignee.
              </p>
            ) : null}
            <Markdown
              source={body}
              busyLine={busyLine}
              onActionItem={(line) => void actionItem(line)}
              onToggle={(line) => {
                const next = toggleChecklistLine(body, line);
                setBody(next);
                void save({ bodyMd: next });
              }}
            />
          </>
        )}
      </div>
      {note.kind === "meeting" ? (
        <footer className="border-t border-[var(--a-border)] px-5 py-2">
          <Badge tone="info">Meeting notes</Badge>
        </footer>
      ) : null}
    </article>
  );
}
