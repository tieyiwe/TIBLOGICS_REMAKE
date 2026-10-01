"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Badge, Button, Drawer, EmptyState, Segmented, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { MERGE_FIELDS, plainPreview } from "@/lib/learn/inbox/markdown";
import { Dialog } from "../../learn/learners/_components/Dialog";
import { TextArea, TextField, postJson } from "../../learn/learners/_components/fields";
import { ago } from "../../learn/learners/_components/format";

// Saved messages with merge fields ({firstName}, {trackTitle}, {progress},
// {loginLink}). "Use" opens the composer with the template loaded.

export interface TemplateRow {
  id: string;
  name: string;
  kind: string;
  subject: string;
  body: string;
  subjectFr: string | null;
  bodyFr: string | null;
  createdBy: string | null;
  updatedAt: string;
}

type Draft = Omit<TemplateRow, "id" | "createdBy" | "updatedAt"> & { id?: string };

const EMPTY: Draft = { name: "", kind: "service", subject: "", body: "", subjectFr: "", bodyFr: "" };

export function TemplatesPanel({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<TemplateRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      const body = { name: draft.name, kind: draft.kind, subject: draft.subject, body: draft.body, subjectFr: draft.subjectFr || null, bodyFr: draft.bodyFr || null };
      if (draft.id) await postJson(`/api/admin/communications/templates/${draft.id}`, body, "PATCH");
      else await postJson("/api/admin/communications/templates", body);
      toast.success(draft.id ? "Template updated" : "Template created");
      setDraft(null);
      router.refresh();
    } catch (err) {
      toast.error("Template not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/communications/templates/${del.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      toast.success("Template deleted");
      setDel(null);
      router.refresh();
    } catch (err) {
      toast.error("Template not deleted", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-dm text-[13px] text-[var(--a-ink-3)]">
          Merge fields: {MERGE_FIELDS.map((f) => <code key={f} className="mr-1 rounded bg-[var(--a-surface-2)] px-1 py-0.5 font-mono text-[12px]">{`{${f}}`}</code>)}
        </p>
        <Button variant="secondary" icon={Plus} onClick={() => setDraft({ ...EMPTY })}>New template</Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
          <EmptyState
            icon={FileText}
            title="No templates yet"
            body="Save messages you send often: welcome back, payment problem, new track, certificate ready."
            action={<Button variant="primary" icon={Plus} onClick={() => setDraft({ ...EMPTY })}>Create a template</Button>}
          />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-col rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 truncate font-dm text-[14.5px] font-semibold text-[var(--a-ink)]">{t.name}</h3>
                <Badge tone={t.kind === "marketing" ? "orange" : "info"}>{t.kind === "marketing" ? "Marketing" : "Service"}</Badge>
              </div>
              <p className="mt-2 truncate font-dm text-[13px] font-medium text-[var(--a-ink-2)]">{t.subject}</p>
              <p className="mt-1 line-clamp-3 font-dm text-[12.5px] leading-relaxed text-[var(--a-ink-3)]">{plainPreview(t.body, 220)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 font-dm text-[11.5px] text-[var(--a-ink-3)]">
                <span>EN</span>
                {t.bodyFr ? <span>· FR</span> : null}
                <span>· edited {ago(t.updatedAt)}</span>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button size="sm" variant="primary" icon={Send} href={`/admin_pro/communications/new?template=${t.id}`}>Use</Button>
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setDraft({ ...t, subjectFr: t.subjectFr ?? "", bodyFr: t.bodyFr ?? "" })}>Edit</Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDel(t)} aria-label={`Delete ${t.name}`} className="ml-auto text-[var(--a-danger)]">Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit template" : "New template"}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={!draft?.name.trim() || !draft?.subject.trim() || !draft?.body.trim()} onClick={save}>
              Save template
            </Button>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4 p-5">
            <TextField label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={120} placeholder="Welcome back" />
            <div>
              <p className="mb-1.5 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Type</p>
              <Segmented ariaLabel="Type" value={draft.kind} onChange={(v) => setDraft({ ...draft, kind: v })} options={[{ value: "service", label: "Service" }, { value: "marketing", label: "Marketing" }]} />
            </div>
            <TextField label="Subject (English)" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} maxLength={200} />
            <TextArea label="Message (English)" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={8} maxLength={20000} />
            <div className={cn("rounded-[12px] border border-dashed border-[var(--a-border-strong)] p-3")}>
              <p className="mb-3 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">French version <span className="font-medium text-[var(--a-ink-3)]">optional</span></p>
              <div className="space-y-3">
                <TextField label="Subject (French)" value={draft.subjectFr ?? ""} onChange={(e) => setDraft({ ...draft, subjectFr: e.target.value })} maxLength={200} />
                <TextArea label="Message (French)" value={draft.bodyFr ?? ""} onChange={(e) => setDraft({ ...draft, bodyFr: e.target.value })} rows={6} maxLength={20000} />
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Dialog
        open={!!del}
        onClose={() => setDel(null)}
        title={`Delete “${del?.name ?? ""}”?`}
        icon={Trash2}
        tone="danger"
        description="Messages already sent with it are not affected."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={remove}>Delete template</Button>
          </>
        }
      />
    </div>
  );
}
