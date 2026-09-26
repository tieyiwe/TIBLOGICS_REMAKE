import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/learn/session";

const Body = z.object({
  accessibilityMode: z.boolean().optional(),
  leaderboardOptIn: z.boolean().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  locale: z.enum(["en", "fr"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await prisma.student.update({ where: { id: student.id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/learn/account]", err);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
