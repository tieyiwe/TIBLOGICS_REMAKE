import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { PROJECT_ID_RE, forgeGuard, storeDown } from "@/lib/learn/game-forge/guard";
import { MAX_ACTIVE_SHARES, SHARE_TOKEN_RE, countActiveShares, createShare, getProject, listShares, revokeShare } from "@/lib/learn/game-forge/db";
import { parseConfig } from "@/lib/learn/game-forge/schema";

// Game Forge "Share with family": a playable link /play/[token] to a frozen
// copy of the game (the saved working config), with no name or account
// details. GET lists the learner's links, POST makes one, DELETE turns one
// off. A minor's links need the youth gate passed (lib/learn/game-forge/
// guard.ts: under 13, the parent's consent). Parents can turn links off from
// their dashboard (/api/parent/[token], action "revokeGame").
const Post = z.object({ projectId: z.string().regex(PROJECT_ID_RE) }).strict();
const Del = z.object({ token: z.string().regex(SHARE_TOKEN_RE) }).strict();

export async function GET(req: NextRequest) {
  const { error, studentId, t } = await forgeGuard(req, { write: false });
  if (error) return error;
  if (!(await checkRateLimit(`gf-read:${studentId}`, 600, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  try {
    return NextResponse.json({ shares: await listShares(studentId) });
  } catch (err) {
    return storeDown(t, err, "shares");
  }
}

export async function POST(req: NextRequest) {
  const { error, studentId, t } = await forgeGuard(req, { write: true });
  if (error) return error;
  if (!(await checkRateLimit(`gf-share:${studentId}`, 10, 86_400_000))) {
    return NextResponse.json({ error: t("studio.game-forge.api.shareLimit"), code: "rate" }, { status: 429 });
  }
  const body = Post.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  try {
    const project = await getProject(studentId, body.data.projectId);
    if (!project) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
    // Checked again: the stored game must still pass today's rules.
    const parsed = parseConfig(project.config);
    if (!parsed.ok) return NextResponse.json({ error: t("studio.game-forge.api.invalid"), issues: parsed.issues }, { status: 422 });
    if ((await countActiveShares(studentId)) >= MAX_ACTIVE_SHARES) {
      return NextResponse.json({ error: t("studio.game-forge.api.tooManyLinks", { n: MAX_ACTIVE_SHARES }), code: "max_links" }, { status: 409 });
    }
    const share = await createShare(studentId, { ...project, config: parsed.config });
    return NextResponse.json({ share, path: `/play/${share.token}` });
  } catch (err) {
    return storeDown(t, err, "share");
  }
}

export async function DELETE(req: NextRequest) {
  const { error, studentId, t } = await forgeGuard(req, { write: true });
  if (error) return error;
  if (!(await checkRateLimit(`gf-save:${studentId}`, 240, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const body = Del.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  try {
    const ok = await revokeShare(studentId, body.data.token, "kid");
    if (!ok) return NextResponse.json({ error: t("studio.game-forge.api.notFound") }, { status: 404 });
    return NextResponse.json({ ok: true, shares: await listShares(studentId) });
  } catch (err) {
    return storeDown(t, err, "revoke");
  }
}
