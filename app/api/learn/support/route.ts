import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { buildContext } from "@/lib/learn/support/context";
import { createLearnerTicket, createVisitorTicket } from "@/lib/learn/support/tickets";
import { SUPPORT_LINK_MAX, SUPPORT_MSG_MAX, SUPPORT_MSG_MIN, SUPPORT_NAME_MAX, SUPPORT_TOPICS } from "@/lib/learn/support/shared";
import { headerSafeEmail } from "@/lib/learn/support/email";

export const dynamic = "force-dynamic";

// "Need help?" on every learner page (components/learn/support/HelpWidget).
//
//   GET   who is asking: a signed-in learner (name and email prefilled), or a
//         visitor who must give a name and an email.
//   POST  creates a support ticket. Signed in: a thread in the learner's
//         Inbox. Signed out: a visitor ticket (no account data involved).
//
// Limits: learner 10 an hour; visitor 3 an hour per IP and 3 per email.
// A filled honeypot field gets a normal-looking success and nothing is saved.
// Context (page, lesson or track, browser, plan, language) is built on the
// server from the page path; the learner can untick it.

const Body = z.object({
  topic: z.enum(SUPPORT_TOPICS),
  message: z.string().max(SUPPORT_MSG_MAX * 2),
  link: z.string().trim().max(SUPPORT_LINK_MAX).optional().nullable(),
  includeContext: z.boolean().optional().default(true),
  path: z.string().max(600).optional().nullable(),
  viewport: z.string().max(20).optional().nullable(),
  name: z.string().trim().max(SUPPORT_NAME_MAX).optional().nullable(),
  email: z.string().trim().max(254).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
});

function ipOf(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

function cleanLink(raw: string | null | undefined): string | null | "bad" {
  const v = (raw ?? "").trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if ((u.protocol !== "https:" && u.protocol !== "http:") || /[\s"'<>]/.test(v)) return "bad";
    return u.toString();
  } catch {
    return "bad";
  }
}

export async function GET() {
  const student = await getStudent();
  return NextResponse.json(
    student ? { signedIn: true, name: student.name, email: student.email } : { signedIn: false },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const t = await getT();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("support.err.invalid") }, { status: 400 });
  const d = parsed.data;

  // Honeypot (hidden field a person never fills).
  if (d.website && d.website.trim()) return NextResponse.json({ ok: true, ticketId: null });

  const message = d.message.replace(/\r\n?/g, "\n").trim();
  if (message.length < SUPPORT_MSG_MIN) return NextResponse.json({ error: t("support.err.short") }, { status: 400 });
  if (message.length > SUPPORT_MSG_MAX) return NextResponse.json({ error: t("support.err.long") }, { status: 400 });
  const link = cleanLink(d.link);
  if (link === "bad") return NextResponse.json({ error: t("support.err.link") }, { status: 400 });

  const student = await getStudent();
  const locale = student ? (student.locale === "fr" ? "fr" : "en") : (await getLocale()) === "fr" ? "fr" : "en";
  const context = d.includeContext
    ? await buildContext({ studentId: student?.id ?? null, path: d.path, viewport: d.viewport, userAgent: req.headers.get("user-agent"), locale }).catch(() => null)
    : null;

  try {
    if (student) {
      if (!(await checkRateLimit(`support:learner:${student.id}`, 10, 3_600_000))) {
        return NextResponse.json({ error: t("support.err.tooMany") }, { status: 429 });
      }
      const r = await createLearnerTicket({
        student: { id: student.id, name: student.name, email: student.email, locale },
        topic: d.topic,
        message,
        link,
        context,
      });
      return NextResponse.json({ ok: true, ticketId: r.ticketId, threadId: r.threadId });
    }

    const name = (d.name ?? "").replace(/[\r\n\t]+/g, " ").trim();
    const email = headerSafeEmail((d.email ?? "").toLowerCase());
    if (name.length < 2) return NextResponse.json({ error: t("support.err.name") }, { status: 400 });
    if (!email || !z.string().email().safeParse(email).success) return NextResponse.json({ error: t("support.err.email") }, { status: 400 });
    const ipOk = await checkRateLimit(`support:visitor:${ipOf(req)}`, 3, 3_600_000);
    const emailOk = ipOk && (await checkRateLimit(`support:visitor-email:${email}`, 3, 3_600_000));
    if (!ipOk || !emailOk) return NextResponse.json({ error: t("support.err.tooMany") }, { status: 429 });
    const r = await createVisitorTicket({ name, email, locale, topic: d.topic, message, link, context });
    // Nothing about the ticket or any account is returned to a visitor.
    return NextResponse.json({ ok: true, ticketId: null, visitor: Boolean(r.ticketId) });
  } catch (err) {
    console.error("[learn/support]", err);
    return NextResponse.json({ error: t("support.err.server") }, { status: 500 });
  }
}
