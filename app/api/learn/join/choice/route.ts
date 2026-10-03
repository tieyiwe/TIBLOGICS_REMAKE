import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";
import { requireStudent } from "@/lib/learn/session";
import { csrfGuard, sameOrigin } from "@/lib/learn/account-status/admin-auth";
import { ChoiceSchema, dismissPendingChoice, savePendingChoice } from "@/lib/learn/join/pending";
import { cleanPromoCode } from "@/lib/learn/join/choice";

// One-page join flow, signed in: remembers the plan chosen just before
// checkout, so an unfinished payment shows a "Finish your enrolment" card
// (and one reminder email). DELETE closes it ("not now" on the card).
const Body = z.object({ choice: ChoiceSchema, promoCode: z.string().max(40).nullish() });

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const { error, student } = await requireStudent();
  if (error) return error;
  if (!(await checkRateLimit(`learn-join-choice:${student.id}`, 30, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidPlan") }, { status: 400 });
  await savePendingChoice(student.id, parsed.data.choice, { promoCode: cleanPromoCode(parsed.data.promoCode) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  }
  const { error, student } = await requireStudent();
  if (error) return error;
  await dismissPendingChoice(student.id);
  return NextResponse.json({ ok: true });
}
