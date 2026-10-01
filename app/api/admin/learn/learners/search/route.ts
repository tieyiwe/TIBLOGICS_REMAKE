import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";

export const dynamic = "force-dynamic";

// Learner picker for the message composer: name or email contains q.
export async function GET(req: NextRequest) {
  const { error } = await learnerStaff("manage");
  if (error) return error;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ results: [] });
  const rows = await prisma.student.findMany({
    where: {
      OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
      NOT: { email: { endsWith: "@deleted.arfa.invalid" } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, name: true, email: true, locale: true },
  });
  return NextResponse.json({ results: rows }, { headers: { "Cache-Control": "no-store" } });
}
