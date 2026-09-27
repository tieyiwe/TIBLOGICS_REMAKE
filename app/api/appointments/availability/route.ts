import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { getAvailability } from "@/lib/booking/availability";

export async function GET() {
  const availability = await getAvailability();
  return NextResponse.json(availability);
}

// Staff only — this rewrites which days and times the public booking form
// offers. GET stays public; the booking form reads it.
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { days, slots } = await req.json();

    // Validated rather than trusted: an empty or malformed value here closes
    // public booking, and the write-time check in POST /api/appointments now
    // rejects anything outside this list, so bad data would lock visitors out.
    const cleanDays = Array.isArray(days)
      ? [...new Set(days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
      : [];
    const cleanSlots = Array.isArray(slots)
      ? [...new Set(
          slots
            .filter((s): s is string => typeof s === "string")
            .map((s) => s.trim())
            .filter((s) => /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(s)),
        )]
      : [];

    if (cleanDays.length === 0 || cleanSlots.length === 0) {
      return NextResponse.json(
        {
          error:
            "Pick at least one day and one time slot. Slots must look like \"9:00 AM\".",
        },
        { status: 400 },
      );
    }

    await Promise.all([
      prisma.adminSettings.upsert({
        where: { key: "avail_days" },
        update: { value: cleanDays.join(",") },
        create: { key: "avail_days", value: cleanDays.join(",") },
      }),
      prisma.adminSettings.upsert({
        where: { key: "avail_slots" },
        update: { value: cleanSlots.join(",") },
        create: { key: "avail_slots", value: cleanSlots.join(",") },
      }),
    ]);
    return NextResponse.json({ ok: true, days: cleanDays, slots: cleanSlots });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
