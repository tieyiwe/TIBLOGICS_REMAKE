import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { awardPoints, getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp } from "@/lib/learn/milestones";
import { gameDelta, gameSnapshot } from "@/lib/learn/badges";
import { isValidChallenge, previousChallenge } from "@/lib/learn/studio/catalog";
import prisma from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";

// A Learning Studio challenge was completed in the browser. The tools run
// client-side with no AI, so the result is self-reported; it only earns
// points, once per challenge (plus a one-time 3-star bonus), never
// certificates. Unknown tools or challenges are refused.

const Body = z.object({
  toolId: z.string().min(1).max(60),
  challengeId: z.string().min(1).max(80),
  stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`studio:${student.id}`, 120, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !isValidChallenge(parsed.data.toolId, parsed.data.challengeId)) {
    return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  }
  const { toolId, challengeId, stars } = parsed.data;
  const ref = `${toolId}:${challengeId}`;

  // Challenges unlock in order: the previous one must already be done.
  const prev = previousChallenge(toolId, challengeId);
  if (prev) {
    const done = await prisma.pointsLedger.count({ where: { studentId: student.id, source: "studio_challenge", refId: `${toolId}:${prev}` } });
    if (done === 0) return NextResponse.json({ error: t("studio.lockedApi"), locked: true }, { status: 409 });
  }

  const [totalBefore, snapBefore] = await Promise.all([getTotalPoints(student.id), gameSnapshot(student.id)]);
  let points = await awardPoints(student.id, "studio_challenge", ref);
  if (stars === 3) points += await awardPoints(student.id, "studio_perfect", ref);
  if (points === 0) return NextResponse.json({ ok: true, pointsAwarded: 0, newBadges: [], levelUp: null });

  const total = totalBefore + points;
  checkLevelUp(student.id, totalBefore, total);
  const game = gameDelta(snapBefore, await gameSnapshot(student.id));
  return NextResponse.json({ ok: true, pointsAwarded: points, newBadges: game.newBadges, levelUp: game.levelUp });
}
