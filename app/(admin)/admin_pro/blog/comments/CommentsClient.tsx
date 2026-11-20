"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, ExternalLink, EyeOff, Pin, PinOff, Trash2, Undo2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader, useToast } from "@/components/admin/ui";
import { postJson } from "../../learn/learners/_components/fields";
import type { AdminComment } from "@/lib/blog/engage/types";
import type { AdminAction, AdminTab } from "@/lib/blog/engage/db";

// AI Times comments. Held comments (links, phone numbers, filtered words,
// or three reader reports) wait in "To review". Staff approve, hide, pin,
// delete or block; nobody edits a reader's words. Staff can also reply and
// moderate right on the article page.

const HELD: Record<string, string> = {
  links: "Has a link",
  phone: "Has a phone number",
  words: "Filtered word",
  reports: "Reported by readers",
};

const KIND: Record<string, string> = { guest: "Guest (email confirmed)", learner: "ARFA learner", staff: "TIBLOGICS" };

const DONE: Record<AdminAction, string> = {
  approve: "Approved: it is on the article",
  hide: "Hidden from the article",
  pin: "Pinned to the top of the discussion",
  unpin: "Unpinned",
  delete: "Deleted for good",
  block: "Blocked: their comments are hidden and they cannot comment again",
  unblock: "Unblocked: they can comment again",
};

export default function CommentsClient({
  tab,
  comments,
  counts,
  canManage,
}: {
  tab: AdminTab;
  comments: AdminComment[];
  counts: Record<AdminTab, number>;
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(c: AdminComment, action: AdminAction) {
    if (action === "delete" && !window.confirm("Delete this comment and its replies for good?")) return;
    if (action === "block" && !window.confirm(`Block ${c.name}? Everything they posted is hidden and they cannot comment again.`)) return;
    setBusy(`${c.id}:${action}`);
    try {
      await postJson(`/api/admin/blog/comments/${c.id}`, { action });
      toast.success(DONE[action]);
      router.refresh();
    } catch (err) {
      toast.error("Could not update", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const tabs: Array<{ key: AdminTab; label: string }> = [
    { key: "review", label: "To review" },
    { key: "reported", label: "Reported" },
    { key: "published", label: "Published" },
    { key: "hidden", label: "Hidden" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comments"
        subtitle="Reader comments under AI Times articles. Most go up straight away; comments with links, phone numbers or filtered words, and comments reported by three readers, wait here. Replies to readers can be posted right on the article while signed in."
        breadcrumb={[{ label: "Content" }, { label: "AI Times", href: "/admin_pro/blog" }, { label: "Comments" }]}
        tabs={tabs.map((t) => ({ label: t.label, count: counts[t.key], href: `/admin_pro/blog/comments?tab=${t.key}` }))}
        activeTab={`/admin_pro/blog/comments?tab=${tab}`}
      />

      <section aria-label={`${tab} comments`} data-testid={`comments-list-${tab}`}>
        {comments.length === 0 ? (
          <EmptyState
            title={tab === "review" ? "Nothing waiting" : tab === "reported" ? "No reported comments" : tab === "hidden" ? "No hidden comments" : "No comments yet"}
            body={tab === "review" ? "Held comments appear here for a quick look." : "Comments move between these tabs as you act on them."}
          />
        ) : (
          <ul className="grid gap-4">
            {comments.map((c) => (
              <li key={c.id} data-testid="admin-comment" data-id={c.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{c.name}</span>
                    <Badge tone={c.kind === "staff" ? "orange" : c.kind === "learner" ? "info" : "neutral"}>{KIND[c.kind] ?? c.kind}</Badge>
                    {c.parentId && <Badge tone="neutral">Reply</Badge>}
                    {c.heldReason && c.status === "pending" && <Badge tone="warn">{HELD[c.heldReason] ?? c.heldReason}</Badge>}
                    {c.reports > 0 && <Badge tone="danger">{c.reports} report{c.reports === 1 ? "" : "s"}</Badge>}
                    {c.pinned && <Badge tone="orange">Pinned</Badge>}
                    {c.blocked && <Badge tone="danger">Blocked</Badge>}
                    <Badge tone="neutral">{c.locale.toUpperCase()}</Badge>
                  </div>
                  <p lang={c.locale} className="mt-3 whitespace-pre-line break-words font-dm text-[14.5px] leading-relaxed text-[var(--a-ink)]" data-testid="admin-comment-text">
                    {c.body}
                  </p>
                  <p className="mt-3 font-dm text-[12px] text-[var(--a-ink-3)]">
                    {c.email ? `${c.email} · ` : ""}
                    {c.createdAt.slice(0, 16).replace("T", " ")} UTC · {c.helpful} helpful ·{" "}
                    <a href={`/ai-times/${c.postSlug}#comment-${c.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--a-blue)] hover:underline">
                      {c.postTitle ?? c.postSlug} <ExternalLink size={11} />
                    </a>
                  </p>
                  {canManage && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.status !== "published" && !c.blocked && (
                        <Button size="sm" variant="primary" icon={Check} disabled={!!busy} loading={busy === `${c.id}:approve`} onClick={() => act(c, "approve")} data-testid="comment-approve">
                          {c.status === "hidden" ? "Show again" : "Approve"}
                        </Button>
                      )}
                      {c.status === "published" && !c.parentId && (
                        <Button size="sm" icon={c.pinned ? PinOff : Pin} disabled={!!busy} loading={busy === `${c.id}:${c.pinned ? "unpin" : "pin"}`} onClick={() => act(c, c.pinned ? "unpin" : "pin")}>
                          {c.pinned ? "Unpin" : "Pin"}
                        </Button>
                      )}
                      {c.status !== "hidden" && (
                        <Button size="sm" variant="ghost" icon={EyeOff} disabled={!!busy} loading={busy === `${c.id}:hide`} onClick={() => act(c, "hide")} data-testid="comment-admin-hide">
                          Hide
                        </Button>
                      )}
                      {c.email && c.kind !== "staff" && (
                        <Button size="sm" variant="ghost" icon={c.blocked ? Undo2 : Ban} disabled={!!busy} loading={busy === `${c.id}:${c.blocked ? "unblock" : "block"}`} onClick={() => act(c, c.blocked ? "unblock" : "block")} data-testid="comment-block">
                          {c.blocked ? "Unblock person" : "Block person"}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon={Trash2} disabled={!!busy} loading={busy === `${c.id}:delete`} onClick={() => act(c, "delete")} data-testid="comment-admin-delete">
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
