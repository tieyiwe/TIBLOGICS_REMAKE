import { NextRequest, NextResponse } from "next/server";
import { liveFail, liveGuard } from "@/lib/learn/live/api";
import { limited, str } from "@/lib/learn/community/api";
import { postingBlock } from "@/lib/learn/community/discussion";
import { addQuestion, deleteQuestion, getQuestion, getSession, listQuestions, myQuestionCount, toggleQuestionVote } from "@/lib/learn/live/sessions";
import { LIVE_LIMITS, questionsOpen, rsvpOpen } from "@/lib/learn/live/shared";

type Ctx = { params: Promise<{ id: string }> };

// Questions for the expert, asked before the session. Visible to learners
// who may attend (the guard), most upvoted first. The community's
// moderation applies: a suspended learner cannot post, a brand new account
// cannot post links, and the same per-hour limits style.

export async function GET(_req: NextRequest, { params }: Ctx) {
  const g = await liveGuard();
  if (g.error) return g.error;
  const id = (await params).id;
  if (!(await getSession(id))) return liveFail(g.t, "live.err.notFound", 404);
  return NextResponse.json({ questions: await listQuestions(id, g.student.id) });
}

// POST { action: "ask", body } | { action: "vote", questionId } | { action: "delete", questionId }
export async function POST(req: NextRequest, { params }: Ctx) {
  const g = await liveGuard();
  if (g.error) return g.error;
  const { t, student } = g;
  const id = (await params).id;
  const session = await getSession(id);
  if (!session) return liveFail(t, "live.err.notFound", 404);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (b.action === "ask") {
    if (!questionsOpen(session)) return liveFail(t, "live.err.questionsClosed", 409);
    const body = str(b.body, LIVE_LIMITS.questionMax + 1);
    if (body.length < LIVE_LIMITS.questionMin) return liveFail(t, "live.err.questionShort", 400, { n: LIVE_LIMITS.questionMin });
    if (body.length > LIVE_LIMITS.questionMax) return liveFail(t, "live.err.questionLong", 400, { n: LIVE_LIMITS.questionMax });
    const block = await postingBlock(student.id, body);
    if (block) return liveFail(t, block, 403);
    if ((await myQuestionCount(id, student.id)) >= LIVE_LIMITS.questionsPerSession) {
      return liveFail(t, "live.err.questionCap", 429, { n: LIVE_LIMITS.questionsPerSession });
    }
    if (await limited("live-question", student.id, LIVE_LIMITS.questionsPerHour, 3_600_000)) return liveFail(t, "live.err.slowDown", 429);
    return NextResponse.json({ ok: true, id: await addQuestion(id, student.id, body) });
  }

  const questionId = str(b.questionId, 64);
  const q = questionId ? await getQuestion(questionId) : null;
  if (!q || q.sessionId !== id || q.deletedAt) return liveFail(t, "live.err.notFound", 404);

  if (b.action === "vote") {
    if (!rsvpOpen(session)) return liveFail(t, "live.err.questionsClosed", 409);
    if (await limited("vote", student.id, LIVE_LIMITS.votesPerHour, 3_600_000)) return liveFail(t, "live.err.slowDown", 429);
    const r = await toggleQuestionVote(student.id, questionId);
    if (!r) return liveFail(t, "live.err.ownVote", 403);
    return NextResponse.json({ ok: true, ...r });
  }
  if (b.action === "delete") {
    if (!(await deleteQuestion(questionId, student.id))) return liveFail(t, "live.err.notFound", 404);
    return NextResponse.json({ ok: true });
  }
  return liveFail(t, "live.err.invalid");
}
