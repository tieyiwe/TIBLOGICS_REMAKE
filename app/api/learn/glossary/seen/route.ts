import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { isGlossaryTerm, recordSeen } from "@/lib/learn/glossary/review";

// A learner opened a glossary pop-up in a lesson (components/learn/glossary/
// GlossaryContext.tsx): the term joins their Daily Review as a glossary card.
// Only ids from the glossary list are stored.
const Body = z.object({ termId: z.string().regex(/^[a-z0-9-]{1,64}$/) });

export async function POST(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`glossary-seen:${student.id}`, 120, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !isGlossaryTerm(parsed.data.termId)) {
    return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  }
  try {
    await recordSeen(student.id, parsed.data.termId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/learn/glossary/seen]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
