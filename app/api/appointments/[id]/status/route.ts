import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public: the booking success page polls it for the status and the meeting
// link. Rate-limited, and the link is only returned in the day after booking
// (it is also in the confirmation email), so an id that leaks later does not
// hand out the meeting.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkRateLimit(`appt-status:${clientIp(req.headers)}`, 60, 600_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const { id } = await params;
    if (!id || typeof id !== "string" || id.length > 100) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: { status: true, zoomLink: true, confirmedAt: true, createdAt: true },
    });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const recent = Date.now() - appt.createdAt.getTime() < 86_400_000;
    return NextResponse.json({ status: appt.status, confirmedAt: appt.confirmedAt, zoomLink: recent ? appt.zoomLink : null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
