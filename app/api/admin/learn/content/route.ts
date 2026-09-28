import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { ContentError, Op, runOp } from "@/lib/learn/admin/content";

// The Learning Box editor's single write endpoint: { op: "lesson.update", ... }.
// Staff only; every operation is validated in lib/learn/admin/content.ts.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = Op.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.filter((p) => typeof p === "string" && p !== "data").join(".");
    return NextResponse.json({ error: `${field ? `${field}: ` : ""}${issue?.message ?? "Invalid request"}` }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await runOp(parsed.data)) });
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
