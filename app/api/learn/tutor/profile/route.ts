import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { tutorTablesReady } from "@/lib/learn/tutor/db";
import { redactSecrets, TUTOR_LEVELS } from "@/lib/learn/tutor/shared";

// "Tell Tutor about you": role or field, goal and level, saved once and sent
// with every Tutor conversation so examples fit the learner's work.
const Body = z.object({
  role: z.string().trim().max(80).default(""),
  goal: z.string().trim().max(200).default(""),
  level: z.enum(["", ...TUTOR_LEVELS]).default(""),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("tutor.api.badRequest") }, { status: 400 });
  if (!(await tutorTablesReady())) return NextResponse.json({ error: t("tutor.api.unavailable") }, { status: 503 });
  const role = redactSecrets(parsed.data.role).text;
  const goal = redactSecrets(parsed.data.goal).text;
  const level = parsed.data.level;
  await prisma.tutorProfile.upsert({
    where: { studentId: student.id },
    create: { studentId: student.id, role, goal, level },
    update: { role, goal, level },
  });
  return NextResponse.json({ ok: true, profile: { role, goal, level } });
}
