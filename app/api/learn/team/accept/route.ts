import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { teamRateLimit } from "@/lib/learn/team/guard";
import { acceptInvite } from "@/lib/learn/team/service";

const Body = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/) });

const STATUS: Record<string, number> = { invalid: 404, expired: 410, wrongEmail: 403, otherTeam: 409, inactive: 402 };

/** Accept an invitation with the signed-in account (its email must be the invited one). */
export async function POST(req: NextRequest) {
  const limited = await teamRateLimit(req, "accept", 10);
  if (limited) return limited;
  const t = await getT();
  const { error, student } = await requireStudent();
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("team.join.invalid") }, { status: 400 });
  const r = await acceptInvite(parsed.data.token, student);
  if (r === "ok") return NextResponse.json({ ok: true });
  return NextResponse.json({ error: t(`team.join.${r}`), reason: r }, { status: STATUS[r] ?? 400 });
}
