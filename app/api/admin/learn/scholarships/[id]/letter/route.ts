import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { ensureScholarshipTables } from "@/lib/learn/scholarship/db";
import { letterFor } from "@/lib/learn/scholarship/service";

// Staff (learners read): the award letter of any scholarship, to check it
// before approving (watermarked DRAFT) or to send again. ?lang=en|fr|sw.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await learnerStaff("read");
  if (error) return error;
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const lang = req.nextUrl.searchParams.get("lang");
  const { pdf, filename } = await letterFor(s, lang && ["en", "fr", "sw"].includes(lang) ? lang : undefined);
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "no-store, private" },
  });
}
