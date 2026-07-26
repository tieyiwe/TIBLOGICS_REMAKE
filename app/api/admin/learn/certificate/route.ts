import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { issueCertificate } from "@/lib/learn/certificates";

// Manual override for support cases — e.g. a learner completed everything
// but a data issue blocked automatic issuance. force:true bypasses the four
// gates entirely, so this is an admin-only escape hatch, not a shortcut.
const Body = z.object({
  studentEmail: z.string().trim().toLowerCase().email(),
  trackSlug: z.string().trim().min(1),
  force: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { studentEmail, trackSlug, force } = parsed.data;

  try {
    const [student, track] = await Promise.all([
      prisma.student.findUnique({ where: { email: studentEmail }, select: { id: true } }),
      prisma.learnTrack.findUnique({ where: { slug: trackSlug }, select: { id: true } }),
    ]);
    if (!student) return NextResponse.json({ error: "No student with that email" }, { status: 404 });
    if (!track) return NextResponse.json({ error: "No track with that slug" }, { status: 404 });

    const result = await issueCertificate(student.id, track.id, { force, issuedByAdmin: true });
    if (!result.ok) {
      return NextResponse.json({ error: result.reason, gates: result.gates }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/admin/learn/certificate]", err);
    return NextResponse.json({ error: "Could not issue certificate" }, { status: 500 });
  }
}
