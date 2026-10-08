import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT, getLocale } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { arfaMailer } from "@/lib/resend";
import { learnEmailP as p, learnEmailShell as shell } from "@/lib/learn/emails";
import { translator } from "@/lib/learn/i18n";
import { childrenFor, createLoginLink, normEmail } from "@/lib/learn/youth-portal";

// Parent & Sponsor Portal sign-in: emails a one-time link (1 hour) when the
// address follows at least one learner. The answer is the same either way,
// so the form never reveals who is a parent or sponsor.
const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`portal-login:${ip}`, 10, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.portal.err.email") }, { status: 400 });
  const email = normEmail(parsed.data.email);
  try {
    if ((await checkRateLimit(`portal-login-mail:${email}`, 5, 3_600_000)) && (await childrenFor(email)).length > 0) {
      const link = await createLoginLink(email, "/portal");
      const tt = translator(locale);
      await arfaMailer.emails.send({
        to: email,
        subject: tt("learn.email.youth.login.subject"),
        html: shell(tt, tt("learn.email.youth.login.title"), p(tt("learn.email.youth.login.p1")) + p(tt("learn.email.youth.login.p2")), { href: link, label: `${tt("learn.email.youth.login.cta")} →` }),
      });
    }
  } catch (err) {
    console.error("[POST /api/portal/login]", err instanceof Error ? err.message : err);
  }
  return NextResponse.json({ ok: true, message: t("learn.portal.login.sent") });
}
