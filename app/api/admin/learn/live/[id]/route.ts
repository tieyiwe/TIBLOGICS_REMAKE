import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import {
  deleteQuestion,
  deleteSession,
  getSession,
  removeAttendee,
  setQuestionAnswered,
  setQuestionHidden,
  updateSession,
} from "@/lib/learn/live/sessions";
import { parseSessionInput } from "@/lib/learn/live/admin-input";
import { mailPromoted } from "@/lib/learn/live/notify";

type Ctx = { params: Promise<{ id: string }> };

/** Edit the session. A raised capacity moves learners up from the waitlist. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const authErr = await requirePermission("events");
  if (authErr) return authErr;
  const id = (await params).id;
  if (!(await getSession(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = parseSessionInput(await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const promoted = await updateSession(id, parsed.value);
  const fresh = await getSession(id);
  if (fresh && promoted.length) await mailPromoted(promoted, fresh);
  return NextResponse.json({ ok: true, promoted: promoted.length });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const authErr = await requirePermission("events");
  if (authErr) return authErr;
  await deleteSession((await params).id);
  return NextResponse.json({ ok: true });
}

// POST { action: "answered" | "unanswered" | "hide" | "unhide" | "deleteQuestion", questionId }
//    | { action: "removeAttendee", studentId }
export async function POST(req: NextRequest, { params }: Ctx) {
  const authErr = await requirePermission("events");
  if (authErr) return authErr;
  const id = (await params).id;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const qid = typeof b.questionId === "string" ? b.questionId.slice(0, 64) : "";
  switch (b.action) {
    case "answered":
    case "unanswered":
      await setQuestionAnswered(qid, b.action === "answered");
      return NextResponse.json({ ok: true });
    case "hide":
    case "unhide":
      await setQuestionHidden(qid, b.action === "hide");
      return NextResponse.json({ ok: true });
    case "deleteQuestion":
      await deleteQuestion(qid, null);
      return NextResponse.json({ ok: true });
    case "removeAttendee": {
      const promoted = await removeAttendee(id, typeof b.studentId === "string" ? b.studentId.slice(0, 64) : "");
      await mailPromoted(promoted, session);
      return NextResponse.json({ ok: true, promoted: promoted.length });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
