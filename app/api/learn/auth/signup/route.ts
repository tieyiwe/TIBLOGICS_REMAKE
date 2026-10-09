import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";
import { AccountFields, FIELD_ERROR, createLearnerAccount } from "@/lib/learn/signup";
import { isYouthSlug } from "@/lib/learn/youth";

// The plain sign-up form (/learn/signup): the account, then the plan step.
// The one-page join flow (/learning-box/join) uses app/api/learn/join/account,
// which shares createLearnerAccount() but defers the welcome email.
const SignupSchema = z.object({
  ...AccountFields,
  // Where the learner came from, for the owner's sign-up email only.
  track: z.string().max(200).nullish(),
  next: z.string().max(500).nullish(),
});

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Short burst limit plus an hourly cap, so one address can't mass-create accounts.
  if (!(await checkRateLimit(`learn-signup:${ip}`, 5, 60_000)) || !(await checkRateLimit(`learn-signup-h:${ip}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyShort") }, { status: 429 });
  }

  const parsed = SignupSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: t(FIELD_ERROR[field] ?? "learn.api.invalidInput") }, { status: 400 });
  }

  try {
    const r = await createLearnerAccount(parsed.data, {
      t,
      cookieHeader: req.headers.get("cookie"),
      headers: req.headers,
      referer: req.headers.get("referer"),
      source: parsed.data,
      // A young person's sign-up gets no generic welcome before their age is
      // known: the youth set-up (/learn/youth) handles the emails, and under
      // 13 nothing is sent to the child before the parent's OK.
      welcome: !isYouthSlug(parsed.data.track) && !/youth|ai-empowered/i.test(parsed.data.next ?? ""),
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error, ...(r.code === "blocked" ? { code: "blocked" } : {}) }, { status: r.status });
    }
    return NextResponse.json({ ok: true, student: { id: r.student.id, email: r.student.email, name: r.student.name } });
  } catch (err) {
    console.error("[POST /api/learn/auth/signup]", err);
    return NextResponse.json({ error: t("learn.api.createFailed") }, { status: 500 });
  }
}
