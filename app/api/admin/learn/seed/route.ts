import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { seedAll } from "@/lib/learn/seed";

// Idempotent. Re-running updates content in place and never duplicates —
// learner progress, attempts, points and certificates are untouched.
export const maxDuration = 300;

export async function POST() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    const reports = await seedAll();
    const totals = reports.reduce(
      (acc, r) => ({
        modules: acc.modules + r.modules,
        lessons: acc.lessons + r.lessons,
        questions: acc.questions + r.microQuestions + r.quizQuestions + r.examQuestions,
        minutes: acc.minutes + r.minutes,
      }),
      { modules: 0, lessons: 0, questions: 0, minutes: 0 },
    );

    return NextResponse.json({ ok: true, reports, totals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/admin/learn/seed]", msg);
    // A validation failure in the seed data surfaces here with its message
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
