import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { AccountFields, FIELD_ERROR, createLearnerAccount } from "@/lib/learn/signup";
import { ChoiceSchema, savePendingChoice } from "@/lib/learn/join/pending";
import { cleanPromoCode, joinPath } from "@/lib/learn/join/choice";

// One-page join flow (/learning-box/join), step "Your account": creates the
// account with the plan already chosen. The client then signs in
// (next-auth, redirect: false) and starts the existing checkout route, so
// prices are only ever computed there, on the server.
//
// With a choice, the plain welcome email is NOT sent now: the payment
// confirmation sends the purchase-aware welcome, or the cart-reminders cron
// sends the "finish your enrolment" welcome after about an hour without a
// payment (lib/learn/join/pending.ts).
const Body = z.object({
  ...AccountFields,
  choice: ChoiceSchema.nullish(),
  promoCode: z.string().max(40).nullish(),
});

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Same bucket as the sign-up form: one budget per address, whichever page.
  if (!(await checkRateLimit(`learn-signup:${ip}`, 5, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyShort") }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: t(FIELD_ERROR[field] ?? "learn.api.invalidInput") }, { status: 400 });
  }
  const { choice } = parsed.data;
  const promoCode = cleanPromoCode(parsed.data.promoCode);

  try {
    const r = await createLearnerAccount(parsed.data, {
      t,
      cookieHeader: req.headers.get("cookie"),
      referer: req.headers.get("referer"),
      source: {
        track: choice?.kind === "track" ? choice.slug : choice?.kind === "monthly" ? choice.track ?? null : null,
        next: joinPath(choice ?? null),
      },
      welcome: !choice,
    });
    if (!r.ok) return NextResponse.json({ error: r.error, code: r.code }, { status: r.status });
    if (choice) await savePendingChoice(r.student.id, choice, { deferWelcome: true, promoCode });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/learn/join/account]", err);
    return NextResponse.json({ error: t("learn.api.createFailed") }, { status: 500 });
  }
}
