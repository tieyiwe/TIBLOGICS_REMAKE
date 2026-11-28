import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale } from "@/lib/i18n/server";
import { ensureScholarshipTables } from "@/lib/learn/scholarship/db";
import { letterFor } from "@/lib/learn/scholarship/service";

// The scholar's own award letter (PDF). Only their accepted scholarship.
export async function GET(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  if (!(await checkRateLimit(`learn-scholarship:letter:${student.id}`, 20, 60_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findFirst({ where: { id, studentId: student.id, status: "claimed" } });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { pdf, filename } = await letterFor(s, await getLocale());
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store, private" },
  });
}
