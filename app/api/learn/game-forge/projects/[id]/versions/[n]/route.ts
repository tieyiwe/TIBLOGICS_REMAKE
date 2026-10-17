import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { PROJECT_ID_RE, forgeGuard, storeDown } from "@/lib/learn/game-forge/guard";
import { getVersion } from "@/lib/learn/game-forge/db";

// Game Forge: one saved version of a game (to preview before restoring).
// Scoped to the signed-in learner's own projects.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { error, studentId, t } = await forgeGuard(req, { write: false });
  if (error) return error;
  const { id, n } = await params;
  if (!PROJECT_ID_RE.test(id) || !/^\d{1,6}$/.test(n)) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
  if (!(await checkRateLimit(`gf-read:${studentId}`, 600, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  try {
    const config = await getVersion(studentId, id, Number(n));
    if (!config) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
    return NextResponse.json({ config });
  } catch (err) {
    return storeDown(t, err, "version");
  }
}
