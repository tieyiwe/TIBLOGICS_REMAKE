import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

const Body = z.object({
  accessibilityMode: z.boolean().optional(),
  leaderboardOptIn: z.boolean().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  locale: z.enum(["en", "fr", "sw"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: t("learn.api.nothingToUpdate") }, { status: 400 });
  }

  try {
    await prisma.student.update({ where: { id: student.id }, data });
    const res = NextResponse.json({ ok: true });
    // Keep this browser's language in step with the account's.
    if (data.locale) res.cookies.set(LOCALE_COOKIE, data.locale, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
    return res;
  } catch (err) {
    console.error("[PATCH /api/learn/account]", err);
    return NextResponse.json({ error: t("learn.api.saveFailed") }, { status: 500 });
  }
}
