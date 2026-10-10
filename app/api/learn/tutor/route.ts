import { NextRequest, NextResponse } from "next/server";
import { tutorGuard } from "@/lib/learn/tutor/guard";
import { getProfile, openThread, restoreMessages, tutorDailyLimit, tutorRemaining } from "@/lib/learn/tutor/server";

// Tutor panel state for one page: the open conversation (restored when the
// learner comes back), their profile and today's remaining messages.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const g = await tutorGuard(sp.get("kind"), sp.get("ref"));
  if (g.error) return g.error;
  const { student, page } = g;
  const [thread, profile, remaining] = await Promise.all([
    openThread(student.id, page.contextKey),
    getProfile(student.id),
    tutorRemaining(student.id),
  ]);
  return NextResponse.json({
    messages: thread ? await restoreMessages(thread.id) : [],
    profile,
    remaining,
    limit: tutorDailyLimit(),
    available: !!process.env.ANTHROPIC_API_KEY,
    hasTryItNow: !!page.tryItNow,
  });
}
