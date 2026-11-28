"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageSquareQuote, Plus, Trash2 } from "lucide-react";
import { Button, Card, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { inputCls, postJson, TextField } from "../../learn/learners/_components/fields";

export interface CannedLite {
  id: string;
  title: string;
  body: string;
  bodyFr: string | null;
}

// Saved support replies: list, add, delete. Used from the reply box of a
// support request ("Insert a canned reply").
export function CannedPanel({ items }: { items: CannedLite[] }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bodyFr, setBodyFr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function add() {
    setBusy("add");
    try {
      await postJson("/api/admin/communications/support/canned", { title, body, bodyFr: bodyFr.trim() || null });
      setTitle("");
      setBody("");
      setBodyFr("");
      toast.success("Canned reply saved");
      router.refresh();
    } catch (err) {
      toast.error("Not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await postJson(`/api/admin/communications/support/canned?id=${encodeURIComponent(id)}`, {}, "DELETE");
      toast.success("Canned reply deleted");
      router.refresh();
    } catch (err) {
      toast.error("Not deleted", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title="Canned replies">
      <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Saved answers you can insert in a reply and edit before sending. Add a French version for French-speaking learners.</p>
      {items.length ? (
        <ul className="mt-3 divide-y divide-[var(--a-border)] rounded-[12px] border border-[var(--a-border)]">
          {items.map((c) => (
            <li key={c.id} className="flex items-start gap-3 px-3 py-2.5">
              <MessageSquareQuote size={16} className="mt-0.5 shrink-0 text-[var(--a-ink-3)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">
                  {c.title} {c.bodyFr ? <span className="ml-1 text-[11.5px] font-medium text-[var(--a-ink-3)]">EN + FR</span> : null}
                </p>
                <p className="line-clamp-2 whitespace-pre-line font-dm text-[12.5px] text-[var(--a-ink-3)]">{c.body}</p>
              </div>
              <Button size="sm" variant="ghost" icon={Trash2} loading={busy === c.id} onClick={() => remove(c.id)} aria-label={`Delete ${c.title}`}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="For example: Reset your password" />
        <div className="hidden md:block" />
        <label className="block">
          <span className="mb-1.5 block font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Reply (English)</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={5000} className={cn(inputCls, "resize-y py-2")} />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Reply (French, optional)</span>
          <textarea value={bodyFr} onChange={(e) => setBodyFr(e.target.value)} rows={4} maxLength={5000} className={cn(inputCls, "resize-y py-2")} />
        </label>
      </div>
      <div className="mt-3">
        <Button size="sm" variant="secondary" icon={Plus} loading={busy === "add"} disabled={!title.trim() || !body.trim()} onClick={add}>
          Add canned reply
        </Button>
      </div>
    </Card>
  );
}
