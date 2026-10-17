import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { PROJECT_ID_RE, forgeGuard, storeDown } from "@/lib/learn/game-forge/guard";
import { deleteProject, getProject, listVersions, saveProject } from "@/lib/learn/game-forge/db";
import { parseConfig } from "@/lib/learn/game-forge/schema";
import { gameTextProblem, tidyGameText } from "@/lib/learn/game-forge/filter";

// Game Forge: one game. GET the game and its versions, PUT the working config
// (optionally as a new numbered version), DELETE the game and its links.
// Every query is scoped to the signed-in learner's id: another learner's
// project id answers 404, exactly like one that does not exist.
const Put = z
  .object({
    config: z.unknown(),
    snapshot: z
      .object({ source: z.enum(["ai", "quick", "manual", "restore", "character"]), note: z.string().max(200).nullable() })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { error, studentId, t } = await forgeGuard(req, { write: false });
  if (error) return error;
  const { id } = await params;
  if (!PROJECT_ID_RE.test(id)) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
  if (!(await checkRateLimit(`gf-read:${studentId}`, 600, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  try {
    const project = await getProject(studentId, id);
    if (!project) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
    return NextResponse.json({ project, versions: await listVersions(studentId, id) });
  } catch (err) {
    return storeDown(t, err, "get");
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error, studentId, t } = await forgeGuard(req, { write: true });
  if (error) return error;
  const { id } = await params;
  if (!PROJECT_ID_RE.test(id)) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
  if (!(await checkRateLimit(`gf-save:${studentId}`, 240, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const body = Put.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const parsed = parseConfig(body.data.config);
  if (!parsed.ok) return NextResponse.json({ error: t("studio.game-forge.api.invalid"), issues: parsed.issues }, { status: 422 });
  const snap = body.data.snapshot ?? null;
  const note = snap?.note ? tidyGameText(snap.note, 200) : null;
  try {
    const saved = await saveProject(studentId, id, parsed.config, snap ? { source: snap.source, note: note && !gameTextProblem(note) ? note : null } : null);
    if (!saved) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
    return NextResponse.json({ project: saved, versions: snap ? await listVersions(studentId, id) : undefined });
  } catch (err) {
    return storeDown(t, err, "save");
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { error, studentId, t } = await forgeGuard(req, { write: true });
  if (error) return error;
  const { id } = await params;
  if (!PROJECT_ID_RE.test(id)) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
  if (!(await checkRateLimit(`gf-save:${studentId}`, 240, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  try {
    const ok = await deleteProject(studentId, id);
    if (!ok) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return storeDown(t, err, "delete");
  }
}
