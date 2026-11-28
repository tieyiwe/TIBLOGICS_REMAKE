import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const search = searchParams.get("search") ?? "";

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.newsletterSubscriber.count({ where }),
  ]);

  return NextResponse.json({ subscribers, total, page, pages: Math.ceil(total / limit) });
}
