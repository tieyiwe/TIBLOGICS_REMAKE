"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";
import { Badge, Button, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { renderMarkdownLite } from "@/lib/learn/inbox/markdown";
import { inputCls, postJson } from "../../learn/learners/_components/fields";
import { dt, initials } from "../../learn/learners/_components/format";

// One Inbox conversation as the ARFA team sees it, with the reply box.

export interface ConvMessage {
  id: string;
  sender: string;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  createdAt: string;
}

export function Conversation({
  threadId,
  status,
  messages,
  learnerName,
  canManage,
  compact,
}: {
  threadId: string;
  status: string;
  messages: ConvMessage[];
  learnerName: string;
  canManage: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [email, setEmail] = useState(true);
  const [busy, setBusy] = useState<null | "reply" | "status">(null);

  async function reply() {
    setBusy("reply");
    try {
      const r = await postJson<{ emailed: boolean }>(`/api/admin/communications/threads/${threadId}`, { action: "reply", body, email });
      setBody("");
      toast.success("Reply sent", r.emailed ? `Also emailed to ${learnerName}` : "In-app only");
      router.refresh();
    } catch (err) {
      toast.error("Reply not sent", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(action: "close" | "reopen") {
    setBusy("status");
    try {
      await postJson(`/api/admin/communications/threads/${threadId}`, { action });
      toast.success(action === "close" ? "Conversation closed" : "Conversation reopened");
      router.refresh();
    } catch (err) {
      toast.error("Not changed", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <ol className="space-y-3">
        {messages.map((m) => {
          const learner = m.sender === "learner";
          return (
            <li key={m.id} className={cn("flex gap-3", learner ? "" : "flex-row-reverse")}>
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-dm text-[11px] font-bold",
                  learner ? "bg-[var(--a-surface-2)] text-[var(--a-ink-2)] ring-1 ring-inset ring-[var(--a-border)]" : "bg-[var(--a-navy)] text-white",
                )}
              >
                {initials(learner ? learnerName : m.authorName || "ARFA")}
              </span>
              <div
                className={cn(
                  "min-w-0 max-w-[85%] rounded-[14px] border px-4 py-3",
                  learner ? "border-[var(--a-border)] bg-[var(--a-surface)]" : "border-[#d3def3] bg-[var(--a-info-bg)]",
                )}
              >
                <p className="flex flex-wrap items-baseline gap-x-2 font-dm text-[12.5px]">
                  <span className="font-semibold text-[var(--a-ink)]">{learner ? learnerName : m.authorName || "ARFA team"}</span>
                  {!learner && m.authorEmail ? <span className="text-[var(--a-ink-3)]">{m.authorEmail}</span> : null}
                  <span className="text-[var(--a-ink-3)]">{dt(m.createdAt)}</span>
                </p>
                <div
                  className="mt-1.5 break-words font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)] [&_a]:font-semibold [&_a]:text-[var(--a-blue)] [&_a]:underline [&_p+p]:mt-2 [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownLite(m.body) }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      {canManage ? (
        <div className={cn("mt-5 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-3", compact && "mt-4")}>
          <label htmlFor={`reply-${threadId}`} className="sr-only">Reply</label>
          <textarea
            id={`reply-${threadId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={compact ? 3 : 4}
            maxLength={10000}
            placeholder={`Reply to ${learnerName}`}
            className={cn(inputCls, "resize-y py-2 leading-relaxed")}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) reply();
            }}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 font-dm text-[12.5px] text-[var(--a-ink-2)]">
                <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="h-4 w-4 accent-[var(--a-blue)]" />
                Also send by email
              </label>
              {status === "closed" ? <Badge tone="neutral">Closed</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {status === "closed" ? (
                <Button size="sm" variant="ghost" icon={RotateCcw} loading={busy === "status"} onClick={() => setStatus("reopen")}>Reopen</Button>
              ) : (
                <Button size="sm" variant="ghost" icon={CheckCircle2} loading={busy === "status"} onClick={() => setStatus("close")}>Mark resolved</Button>
              )}
              <Button size="sm" variant="primary" icon={Send} loading={busy === "reply"} disabled={!body.trim()} onClick={reply} data-testid="admin-reply-send">
                Send reply
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
