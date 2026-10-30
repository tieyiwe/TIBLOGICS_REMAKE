import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import {
  YouthProfileError,
  inProgramRange,
  laneForBirthYear,
  needsParentConsent,
  setYouthProfile,
  youthGate,
} from "@/lib/learn/youth-account";
import { sendParentEmail } from "@/lib/learn/youth-emails";

// AI-Empowered Youth onboarding (/learn/youth): the learner's birth year and
// their parent or guardian's email. Under 13 the parent must confirm by the
// emailed link before any lesson opens; 13 to 17 the parent gets an
// information email with the dashboard link. Always the signed-in learner's
// own account (no id in the body).
const Body = z.object({
  birthYear: z.number().int().min(1900).max(2100),
  parentEmail: z.string().trim().toLowerCase().email().max(254),
});

const ERRORS: Record<YouthProfileError["code"], string> = {
  range: "learn.youth.err.range",
  birth_locked: "learn.youth.err.birthLocked",
  parent_same: "learn.youth.err.parentSame",
  parent_locked: "learn.youth.err.parentLocked",
  not_found: "learn.api.invalidRequest",
};

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const t = await getT();
  const { error, student } = await requireStudent();
  if (error) return error;
  if (!(await checkRateLimit(`youth-profile:${student.id}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: t(field === "parentEmail" ? "learn.youth.err.parentEmail" : "learn.youth.err.birthYear") }, { status: 400 });
  }
  if (!inProgramRange(parsed.data.birthYear)) {
    return NextResponse.json({ error: t("learn.youth.err.range"), code: "range" }, { status: 422 });
  }
  try {
    const { profile, notifyParent } = await setYouthProfile(student.id, parsed.data);
    let emailed = false;
    // One parent inbox gets at most 10 of these a day, from any account.
    if (notifyParent && (await checkRateLimit(`youth-parent-mail:${profile.parentEmail}`, 10, 86_400_000))) {
      try {
        await sendParentEmail(profile);
        emailed = true;
      } catch (err) {
        console.error("[youth/profile] parent email", err instanceof Error ? err.message : err);
      }
    }
    return NextResponse.json({
      ok: true,
      lane: laneForBirthYear(profile.birthYear!),
      gate: youthGate(profile),
      consentNeeded: needsParentConsent(profile),
      emailed,
    });
  } catch (err) {
    if (err instanceof YouthProfileError) {
      return NextResponse.json({ error: t(ERRORS[err.code]), code: err.code }, { status: err.code === "not_found" ? 404 : 409 });
    }
    console.error("[POST /api/learn/youth/profile]", err);
    return NextResponse.json({ error: t("learn.api.saveFailed") }, { status: 500 });
  }
}
