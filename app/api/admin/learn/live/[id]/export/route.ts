import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { attendanceCsv, attendees, getSession } from "@/lib/learn/live/sessions";

export const dynamic = "force-dynamic";

// CSV of a live session's RSVPs, waitlist and attendance. Staff only; never cached.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requirePermission("events");
  if (authErr) return authErr;
  const id = (await params).id;
  const s = await getSession(id);
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const csv = attendanceCsv(await attendees(id));
  const slug = s.title.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 50) || "session";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="live-${slug}-${s.startsAt.toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store, private",
    },
  });
}
