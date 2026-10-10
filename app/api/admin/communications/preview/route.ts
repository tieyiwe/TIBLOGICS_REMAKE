import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { AudienceSchema, describeAudience, resolveAudience } from "@/lib/learn/inbox/audience";
import { accountStates } from "@/lib/learn/account-status";

export const dynamic = "force-dynamic";

// Recipient count and a sample for the composer, before anything is sent.
const Body = z.object({ audience: AudienceSchema, kind: z.enum(["marketing", "service"]).optional() });

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid audience" }, { status: 400 });
  const ids = await resolveAudience(parsed.data.audience);
  const states = await accountStates(ids);
  let optedOut = 0;
  let locked = 0;
  for (const s of states.values()) {
    if (s.status === "blocked" || s.status === "deleted") locked++;
    else if (parsed.data.kind === "marketing" && (s.marketingOptOut || s.status === "suspended")) optedOut++;
  }
  const sample = ids.length
    ? await prisma.student.findMany({ where: { id: { in: ids.slice(0, 6) } }, select: { id: true, name: true, email: true, locale: true } })
    : [];
  const byLang = ids.length
    ? await prisma.student.groupBy({ by: ["locale"], where: { id: { in: ids } }, _count: { _all: true } })
    : [];
  return NextResponse.json({
    count: ids.length,
    willSkip: optedOut + locked,
    optedOut,
    locked,
    label: await describeAudience(parsed.data.audience),
    languages: Object.fromEntries(byLang.map((r) => [r.locale, r._count._all])),
    sample,
  });
}
