import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { ensureToolkitTables } from "@/lib/toolkit/db";
import { VERTICAL_LABELS } from "@/lib/toolkit/guard/rules";

// The business profile. Editable by any signed-in account, so it can be set
// up before subscribing; only used by the paid routes.

const FIELDS = ["businessName", "location", "audience", "offer", "voice", "differentiators", "compliance"] as const;
const LIMITS: Record<(typeof FIELDS)[number], number> = {
  businessName: 120, location: 120, audience: 600, offer: 600, voice: 300, differentiators: 600, compliance: 800,
};

export async function PUT(req: NextRequest) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const data: Record<string, string> = {};
  for (const f of FIELDS) {
    const v = body[f];
    if (v === undefined) continue;
    if (typeof v !== "string") return NextResponse.json({ error: `Invalid ${f}` }, { status: 400 });
    if (v.length > LIMITS[f]) return NextResponse.json({ error: `${f} is too long (max ${LIMITS[f]} characters)` }, { status: 400 });
    data[f] = v.trim();
  }
  if (body.vertical !== undefined) {
    if (!(body.vertical in VERTICAL_LABELS)) return NextResponse.json({ error: "Unknown industry" }, { status: 400 });
    data.vertical = body.vertical;
  }

  await ensureToolkitTables();
  const profile = await prisma.toolkitProfile.upsert({
    where: { studentId: student.id },
    create: { studentId: student.id, ...data },
    update: data,
  });
  return NextResponse.json({ ok: true, profile });
}
