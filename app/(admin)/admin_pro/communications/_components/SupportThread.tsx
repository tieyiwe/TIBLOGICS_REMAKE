"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Lock, NotebookPen, RotateCcw, Send } from "lucide-react";
import { Badge, Button, Select, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { inputCls, postJson } from "../../learn/learners/_components/fields";
import { dt, initials } from "../../learn/learners/_components/format";
import type { CannedLite } from "./CannedPanel";

// One support request as the team sees it: the conversation with internal
// notes in line, the reply / note composer (canned replies), and the status,
// priority and assignee controls.

export interface SupportItem {
  id: string;
  kind: "learner" | "visitor" | "staff" | "note";
  authorName: string | null;
  authorEmail: string | null;
  /** Rendered by renderMarkdownLite on the server (escaped first). */
  html: string;
  createdAt: string;
}

export function SupportThread({
  ticket,
  items,
  staff,
  canned,
  canManage,
}: {
  ticket: { id: string; kind: "learner" | "visitor"; status: string; priority: string; assignee: string | null; locale: string; name: string };
  items: SupportItem[];
  staff: Array<{ email: string; name: string }>;
  canned: CannedLite[];
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState(true);
  const [busy, setBusy] = useState<null | string>(null);

  async function act(action: string, extra: Record<string, unknown> = {}, ok?: string) {
    setBusy(action);
    try {
      const r = await postJson<{ emailed?: boolean }>(`/api/admin/communications/support/${ticket.id}`, { action, ...extra });
      if (action === "reply") {
        setBody("");
        toast.success("Reply sent", r.emailed ? `Emailed to ${ticket.name}` : ticket.kind === "learner" ? "In-app only" : "Email not sent, check the mail settings");
      } else if (action === "note") {
        setBody("");
        toast.success("Note added", "Only the team can see it");
      } else if (ok) toast.success(ok);
      router.refresh();
    } catch (err) {
      toast.error("Not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  function insertCanned(id: string) {
    const c = canned.find((x) => x.id === id);
    if (!c) return;
    const text = ticket.locale === "fr" && c.bodyFr ? c.bodyFr : c.body;
    setBody((b) => (b.trim() ? `${b.trimEnd()}\n\n${text}` : text));
    setMode("reply");
  }

  return (
    <div>
      <ol className="space-y-3" data-testid="support-timeline">
        {items.map((m) => {
          if (m.kind === "note") {
            return (
              <li key={m.id} className="rounded-[12px] border border-[#f1d58a] bg-[#FFF9E6] px-4 py-3" data-testid="support-note">
                <p className="flex flex-wrap items-center gap-x-2 font-dm text-[12.5px]">
                  <Lock size={13} className="text-[#9a6b00]" aria-hidden />
                  <span className="font-semibold text-[#7a5600]">Internal note · not visible to the learner</span>
                  <span className="text-[var(--a-ink-3)]">{m.authorName || m.authorEmail} · {dt(m.createdAt)}</span>
                </p>
                <div className="mt-1.5 break-words font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)] [&_a]:underline [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: m.html }} />
              </li>
            );
          }
          const fromLearner = m.kind === "learner" || m.kind === "visitor";
          const who = fromLearner ? ticket.name : m.authorName || "ARFA team";
          return (
            <li key={m.id} className={cn("flex gap-3", fromLearner ? "" : "flex-row-reverse")}>
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-dm text-[11px] font-bold",
                  fromLearner ? "bg-[var(--a-surface-2)] text-[var(--a-ink-2)] ring-1 ring-inset ring-[var(--a-border)]" : "bg-[var(--a-navy)] text-white",
                )}
              >
                {initials(who)}
              </span>
              <div className={cn("min-w-0 max-w-[85%] rounded-[14px] border px-4 py-3", fromLearner ? "border-[var(--a-border)] bg-[var(--a-surface)]" : "border-[#d3def3] bg-[var(--a-info-bg)]")}>
                <p className="flex flex-wrap items-baseline gap-x-2 font-dm text-[12.5px]">
                  <span className="font-semibold text-[var(--a-ink)]">{who}</span>
                  {!fromLearner && m.authorEmail ? <span className="text-[var(--a-ink-3)]">{m.authorEmail}</span> : null}
                  <span className="text-[var(--a-ink-3)]">{dt(m.createdAt)}</span>
                </p>
                <div
                  className="mt-1.5 break-words font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)] [&_a]:font-semibold [&_a]:text-[var(--a-blue)] [&_a]:underline [&_p+p]:mt-2 [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5"
                  data-testid="support-message"
                  dangerouslySetInnerHTML={{ __html: m.html }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      {canManage ? (
        <div className="mt-5 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div role="tablist" aria-label="Composer" className="flex gap-1">
              {(["reply", "note"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  data-testid={`composer-${m}`}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-dm text-[13px] font-semibold",
                    mode === m ? (m === "note" ? "bg-[#FFF3CC] text-[#7a5600]" : "bg-[var(--a-navy)] text-white") : "text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]",
                  )}
                >
                  {m === "reply" ? <Send size={13} aria-hidden /> : <NotebookPen size={13} aria-hidden />}
                  {m === "reply" ? `Reply to ${ticket.kind === "visitor" ? "visitor" : "learner"}` : "Internal note"}
                </button>
              ))}
            </div>
            {canned.length ? (
              <Select label="Insert a canned reply" value="" onChange={(e) => insertCanned(e.target.value)} className="h-10 max-w-[240px] text-[13px] sm:h-8" data-testid="canned-select">
                <option value="">Insert a canned reply</option>
                {canned.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            ) : null}
          </div>
          <label htmlFor={`support-body-${ticket.id}`} className="sr-only">{mode === "reply" ? "Reply" : "Internal note"}</label>
          <textarea
            id={`support-body-${ticket.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={10000}
            placeholder={mode === "reply" ? `Reply to ${ticket.name} (${ticket.locale.toUpperCase()})` : "Only the team sees notes"}
            className={cn(inputCls, "resize-y py-2 leading-relaxed", mode === "note" && "bg-[#FFFDF5]")}
            data-testid="support-body"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) void act(mode, mode === "reply" ? { body, email } : { body });
            }}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="font-dm text-[12.5px] text-[var(--a-ink-2)]">
              {mode === "reply" ? (
                ticket.kind === "learner" ? (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="h-4 w-4 accent-[var(--a-blue)]" />
                    Also send by email ({ticket.locale.toUpperCase()})
                  </label>
                ) : (
                  <span>Sent by email (visitors have no Inbox).</span>
                )
              ) : (
                <span className="flex items-center gap-1.5"><Lock size={13} aria-hidden /> Not visible to the learner</span>
              )}
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={mode === "reply" ? Send : NotebookPen}
              loading={busy === mode}
              disabled={!body.trim()}
              onClick={() => act(mode, mode === "reply" ? { body, email } : { body })}
              data-testid={mode === "reply" ? "support-send" : "support-note-send"}
            >
              {mode === "reply" ? "Send reply" : "Add note"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 font-dm text-[12.5px] text-[var(--a-ink-3)]">You can read requests. Replies, notes and status changes need the owner or an admin.</p>
      )}
    </div>
  );
}

export function SupportControls({
  ticket,
  staff,
  canManage,
}: {
  ticket: { id: string; status: string; priority: string; assignee: string | null };
  staff: Array<{ email: string; name: string }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: string, extra: Record<string, unknown>, ok: string) {
    setBusy(action);
    try {
      await postJson(`/api/admin/communications/support/${ticket.id}`, { action, ...extra });
      toast.success(ok);
      router.refresh();
    } catch (err) {
      toast.error("Not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Status</span>
        <Badge tone={ticket.status === "open" ? "orange" : ticket.status === "answered" ? "success" : "neutral"} dot>
          {ticket.status === "open" ? "Open" : ticket.status === "answered" ? "Answered" : "Closed"}
        </Badge>
      </div>
      <Select
        label="Priority"
        value={ticket.priority}
        disabled={!canManage || !!busy}
        onChange={(e) => act("update", { priority: e.target.value }, "Priority changed")}
        className="w-full"
        data-testid="support-priority"
      >
        <option value="low">Priority: Low</option>
        <option value="normal">Priority: Normal</option>
        <option value="high">Priority: High</option>
        <option value="urgent">Priority: Urgent</option>
      </Select>
      <Select
        label="Assignee"
        value={ticket.assignee ?? ""}
        disabled={!canManage || !!busy}
        onChange={(e) => act("update", { assignee: e.target.value || null }, "Assignee changed")}
        className="w-full"
        data-testid="support-assignee"
      >
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.email} value={s.email}>{s.name} ({s.email})</option>
        ))}
      </Select>
      {canManage ? (
        ticket.status === "closed" ? (
          <Button size="sm" variant="secondary" icon={RotateCcw} loading={busy === "reopen"} onClick={() => act("reopen", {}, "Request reopened")} className="w-full" data-testid="support-reopen">
            Reopen
          </Button>
        ) : (
          <Button size="sm" variant="secondary" icon={CheckCircle2} loading={busy === "close"} onClick={() => act("close", {}, "Request closed")} className="w-full" data-testid="support-close">
            Close request
          </Button>
        )
      ) : null}
    </div>
  );
}
