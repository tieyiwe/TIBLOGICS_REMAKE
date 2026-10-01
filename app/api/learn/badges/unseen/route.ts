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
    const rows = await prisma.skillBadgeAward.findMany({
      where: { studentId: student.id, notifiedAt: null },
      orderBy: { issuedAt: "asc" },
      select: { id: true, badgeKey: true, name: true, family: true },
      take: 10,
    });
    if (rows.length) {
      await prisma.skillBadgeAward.updateMany({
        where: { id: { in: rows.map((r) => r.id) }, notifiedAt: null },
        data: { notifiedAt: new Date() },
      });
    }
    return NextResponse.json({ badges: rows.map((r) => ({ id: r.id, key: r.badgeKey, name: r.name, family: r.family })) });
  } catch (err) {
    console.error("[learn/badges/unseen]", err);
    return NextResponse.json({ badges: [] });
  }
}
