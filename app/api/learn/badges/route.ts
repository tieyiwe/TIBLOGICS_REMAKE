import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { ensureSkillBadgeTables } from "@/lib/learn/skill-badges/db";
import { getT } from "@/lib/i18n/server";

// A learner shows or hides one of their skill badges. A private badge's
// verify page, image and credential are not served to anyone.
const Body = z.object({ id: z.string().min(8).max(40), isPublic: z.boolean() });

export async function PATCH(req: NextRequest) {
  const student = await getStudent();
  const t = await getT();
  if (!student) return NextResponse.json({ error: t("badges.api.signIn") }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("badges.api.invalid") }, { status: 400 });
  await ensureSkillBadgeTables();
  const res = await prisma.skillBadgeAward.updateMany({
    where: { id: parsed.data.id, studentId: student.id },
    data: { isPublic: parsed.data.isPublic },
  });
  if (res.count === 0) return NextResponse.json({ error: t("badges.api.notFound") }, { status: 404 });
  return NextResponse.json({ ok: true, isPublic: parsed.data.isPublic });
}
