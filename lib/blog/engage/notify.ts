// What happens after a comment is saved or goes up: the reply email to the
// comment it answers, and the owner's alert. Fire and forget: a mail problem
// never fails the comment.
import prisma from "@/lib/prisma";
import { replyRecipient } from "./db";
import { sendCommentAlert, sendReplyEmail } from "./emails";

const log = (what: string) => (err: unknown) => console.error(`[engage] ${what}`, err instanceof Error ? err.message : "failed");

interface Saved {
  id: string;
  postSlug: string;
  parentId: string | null;
  authorKind: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  heldReason: string | null;
}

export function afterSaved(c: Saved, postTitle: string, opts: { alertOwner: boolean }): void {
  if (opts.alertOwner && c.authorKind !== "staff" && (c.status === "published" || c.status === "pending")) {
    void sendCommentAlert({ name: c.authorName, kind: c.authorKind, body: c.body, postTitle, slug: c.postSlug, id: c.id, status: c.status, heldReason: c.heldReason }).catch(log("owner alert"));
  }
  if (c.status === "published" && c.parentId) void notifyReply(c, postTitle).catch(log("reply email"));
}

async function notifyReply(c: Saved, postTitle: string): Promise<void> {
  const to = await replyRecipient(c.parentId!);
  if (!to?.authorEmail || to.authorEmail === c.authorEmail) return;
  await sendReplyEmail({
    to: to.authorEmail,
    name: to.authorName,
    locale: to.locale,
    replier: c.authorName,
    body: c.body,
    postTitle,
    slug: c.postSlug,
    replyId: c.id,
  });
}

/** A confirmed reader asked for the AI Times newsletter while commenting. */
export async function subscribeFromComment(email: string, name: string): Promise<void> {
  const first = name.split(/\s+/)[0]?.slice(0, 100) || null;
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, firstName: first, source: "comment", active: true },
    update: { active: true, unsubscribedAt: null },
  });
}
