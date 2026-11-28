import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { clientIp } from "@/lib/growth/acquire/security";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { isValidEmail } from "@/lib/require-admin";
import prisma from "@/lib/prisma";
import { commenterState, createComment, publishedPost, threadRoot, touchCommenter } from "@/lib/blog/engage/db";
import { keyedHash, viewerOf } from "@/lib/blog/engage/identity";
import { cleanCommentBody, cleanName } from "@/lib/blog/engage/text";
import { sendConfirmEmail } from "@/lib/blog/engage/emails";
import { afterSaved, subscribeFromComment } from "@/lib/blog/engage/notify";
import { BODY_MAX, BODY_MIN, NAME_MAX } from "@/lib/blog/engage/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  body: z.string().max(BODY_MAX * 2),
  parentId: z.string().uuid().optional().nullable(),
  name: z.string().max(NAME_MAX * 3).optional().nullable(),
  email: z.string().max(254).optional().nullable(),
  notify: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  locale: z.enum(["en", "fr", "sw"]).optional(),
  /** Honeypot: a hidden field people never fill in. */
  website: z.string().max(200).optional().nullable(),
  /** When the form was opened (ms): a submit within 3 s is a bot. */
  ts: z.number().int().optional().nullable(),
});

// A comment under an article. JSON from this site only, rate limited per
// network and per person. Staff with AI Times manage access post as
// TIBLOGICS; signed-in learners under their account; a guest's first comment
// waits for the link emailed to them (lib/blog/engage/identity.ts). Text
// rules in lib/blog/engage/text.ts: some comments wait for staff.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { slug } = await params;
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const locale: Locale = isLocale(raw?.locale) ? (raw!.locale as Locale) : "en";
  const t = translatorFor(locale);
  const ip = clientIp(req);
  if (!(await checkRateLimit(`comment-post:${ip}`, 12, 3_600_000))) {
    return NextResponse.json({ error: t("pages.article.talk.err.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(raw ?? {});
  if (!parsed.success) return NextResponse.json({ error: t("pages.article.talk.err.generic") }, { status: 400 });
  const b = parsed.data;
  const post = await publishedPost(slug).catch(() => null);
  if (!post) return NextResponse.json({ error: t("pages.article.talk.err.gone") }, { status: 404 });
  if (b.website || (b.ts && Date.now() - b.ts < 3000)) {
    // Looks automated: answer like a guest's success, store nothing.
    return NextResponse.json({ ok: true, status: "unconfirmed" });
  }

  const text = cleanCommentBody(b.body);
  if (!text.ok) {
    const error =
      text.problem === "short" ? t("pages.article.talk.err.short", { min: BODY_MIN })
      : text.problem === "long" ? t("pages.article.talk.err.long", { max: BODY_MAX })
      : t("pages.article.talk.err.contact");
    return NextResponse.json({ error, field: "body" }, { status: 400 });
  }

  let parentId: string | null = null;
  if (b.parentId) {
    parentId = await threadRoot(slug, b.parentId).catch(() => null);
    if (!parentId) return NextResponse.json({ error: t("pages.article.talk.err.parentGone") }, { status: 404 });
  }

  const viewer = await viewerOf(req);
  if (viewer.kind === "staff" && !viewer.canModerate) {
    return NextResponse.json({ error: t("pages.article.talk.err.staff") }, { status: 403 });
  }

  // Who is writing.
  let name: string;
  let email: string | null = null;
  if (viewer.kind === "staff") {
    name = viewer.name;
  } else if (viewer.kind === "learner" || viewer.kind === "verified") {
    name = viewer.name;
    email = viewer.email;
  } else {
    const n = cleanName(b.name ?? "");
    if (!n) return NextResponse.json({ error: t("pages.article.talk.err.name"), field: "name" }, { status: 400 });
    if (!isValidEmail(b.email ?? "")) return NextResponse.json({ error: t("pages.article.talk.err.email"), field: "email" }, { status: 400 });
    name = n;
    email = b.email!.trim().toLowerCase();
  }
  const who = viewer.kind === "staff" ? `staff:${viewer.staffId}` : email!;
  if (!(await checkRateLimit(`comment-author:${who}`, 6, 600_000))) {
    return NextResponse.json({ error: t("pages.article.talk.err.tooMany") }, { status: 429 });
  }
  if (email) {
    const known = await commenterState(email).catch(() => null);
    if (known?.blocked) return NextResponse.json({ error: t("pages.article.talk.err.blocked") }, { status: 403 });
  }

  const status = viewer.kind === "anon" ? "unconfirmed" : viewer.kind === "staff" || !text.hold ? "published" : "pending";
  const notify = viewer.kind !== "staff" && b.notify !== false;
  let saved;
  try {
    saved = await createComment({
      postSlug: slug,
      parentId,
      authorKind: viewer.kind === "staff" ? "staff" : viewer.kind === "learner" ? "learner" : "guest",
      authorName: name,
      authorEmail: email,
      studentId: viewer.kind === "learner" ? viewer.studentId : null,
      staffId: viewer.kind === "staff" ? viewer.staffId : null,
      body: text.body,
      locale,
      status,
      heldReason: viewer.kind === "staff" ? null : text.hold,
      notifyReplies: notify,
      ipHash: keyedHash("ip", ip),
    });
  } catch (err) {
    console.error("[POST comment]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("pages.article.talk.err.generic") }, { status: 500 });
  }

  if (viewer.kind === "anon") {
    // One confirmation email per address per hour or so: no inbox flooding.
    const mailOk = await checkRateLimit(`comment-confirm-mail:${email}`, 3, 3_600_000);
    try {
      if (!mailOk) throw new Error("mail limit");
      await sendConfirmEmail({ to: email!, name, locale, commentId: saved.id, body: text.body, postTitle: post.title, slug, newsletter: !!b.newsletter });
    } catch (err) {
      console.error("[POST comment] confirmation email", err instanceof Error ? err.message : "failed");
      await prisma.articleComment.delete({ where: { id: saved.id } }).catch(() => {});
      return NextResponse.json({ error: t(mailOk ? "pages.article.talk.err.mail" : "pages.article.talk.err.tooMany") }, { status: mailOk ? 502 : 429 });
    }
    return NextResponse.json({ ok: true, status: "unconfirmed" });
  }

  if (email) {
    await touchCommenter(email, name, notify).catch(() => {});
    if (b.newsletter) await subscribeFromComment(email, name).catch(() => {});
  }
  afterSaved(saved, post.title, { alertOwner: true });
  return NextResponse.json({ ok: true, status: saved.status, id: saved.id });
}
