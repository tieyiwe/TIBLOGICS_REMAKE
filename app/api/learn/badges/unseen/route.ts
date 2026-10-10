import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { ensureSkillBadgeTables } from "@/lib/learn/skill-badges/db";

// Skill badges awarded since the learner was last told, for the celebration
// toasts (components/learn/game/GameCelebrations.tsx). Marks them as told.
export async function POST() {
  const student = await getStudent();
  if (!student) return NextResponse.json({ badges: [] }, { status: 401 });
  try {
    await ensureSkillBadgeTables();
    // One atomic claim, so two tabs (or a double effect) never both toast.
    const rows = await prisma.$queryRaw<Array<{ id: string; badgeKey: string; name: string; family: string }>>`
      UPDATE "SkillBadgeAward" SET "notifiedAt" = NOW()
      WHERE "id" IN (
        SELECT "id" FROM "SkillBadgeAward"
        WHERE "studentId" = ${student.id} AND "notifiedAt" IS NULL
        ORDER BY "issuedAt" ASC LIMIT 10
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "badgeKey", "name", "family"`;
    return NextResponse.json({ badges: rows.map((r) => ({ id: r.id, key: r.badgeKey, name: r.name, family: r.family })) });
  } catch (err) {
    console.error("[learn/badges/unseen]", err);
    return NextResponse.json({ badges: [] });
  }
}
