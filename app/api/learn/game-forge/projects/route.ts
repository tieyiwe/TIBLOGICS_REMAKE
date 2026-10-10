import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { forgeGuard, storeDown } from "@/lib/learn/game-forge/guard";
import { MAX_PROJECTS, countProjects, createProject, listProjects, listShares } from "@/lib/learn/game-forge/db";
import { TEMPLATES } from "@/lib/learn/game-forge/schema";
import { starterConfig } from "@/lib/learn/game-forge/templates";

// Game Forge: the learner's games (GET) and a new game from a template (POST).
// Always the signed-in learner's own (lib/learn/game-forge/guard.ts).
const Body = z.object({ template: z.enum(TEMPLATES) }).strict();

export async function GET(req: NextRequest) {
  const { error, studentId, t } = await forgeGuard(req, { write: false });
  if (error) return error;
  if (!(await checkRateLimit(`gf-read:${studentId}`, 600, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  try {
    const [projects, shares] = await Promise.all([listProjects(studentId), listShares(studentId)]);
    return NextResponse.json({ projects, shares });
  } catch (err) {
    return storeDown(t, err, "list");
  }
}

export async function POST(req: NextRequest) {
  const { error, studentId, t } = await forgeGuard(req, { write: true });
  if (error) return error;
  if (!(await checkRateLimit(`gf-new:${studentId}`, 30, 86_400_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  try {
    if ((await countProjects(studentId)) >= MAX_PROJECTS) {
      return NextResponse.json({ error: t("studio.game-forge.api.tooMany", { n: MAX_PROJECTS }), code: "max_projects" }, { status: 409 });
    }
    const project = await createProject(studentId, starterConfig(parsed.data.template));
    return NextResponse.json({ project, versions: [{ n: 1, source: "start", note: null, createdAt: project.updatedAt }] });
  } catch (err) {
    return storeDown(t, err, "create");
  }
}
