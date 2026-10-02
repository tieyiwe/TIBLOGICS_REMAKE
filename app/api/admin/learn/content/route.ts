import { NextRequest, NextResponse, after } from "next/server";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/require-admin";
import { ContentError, Op, runOp } from "@/lib/learn/admin/content";
import { requeueChanged } from "@/lib/learn/video/queue";

// The Learning Box editor's single write endpoint: { op: "lesson.update", ... }.
// Staff only; every operation is validated in lib/learn/admin/content.ts.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;

  const parsed = Op.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.filter((p) => typeof p === "string" && p !== "data").join(".");
    return NextResponse.json({ error: `${field ? `${field}: ` : ""}${issue?.message ?? "Invalid request"}` }, { status: 400 });
  }
  try {
    const result = await runOp(parsed.data);
    // A lesson whose text changed gets its narrated video made again (cheap check, after the response).
    if (parsed.data.op === "lesson.update") after(() => requeueChanged().catch((err) => console.error("[video] requeue", err)));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof ContentError) {
      return NextResponse.json({ error: err.message, needsConfirm: err.needsConfirm }, { status: err.status });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "That item no longer exists. Refresh the page." }, { status: 404 });
    }
    console.error("[admin/learn/content]", err);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }
}
