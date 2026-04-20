import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

export async function GET() {
  try {
    const [daysRow, slotsRow] = await Promise.all([
      prisma.adminSettings.findUnique({ where: { key: "avail_days" } }),
      prisma.adminSettings.findUnique({ where: { key: "avail_slots" } }),
    ]);
    const days = daysRow ? daysRow.value.split(",").map(Number) : DEFAULT_DAYS;
    const slots = slotsRow ? slotsRow.value.split(",") : DEFAULT_SLOTS;
    return NextResponse.json({ days, slots });
  } catch {
    return NextResponse.json({ days: DEFAULT_DAYS, slots: DEFAULT_SLOTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { days, slots } = await req.json();
    await Promise.all([
      prisma.adminSettings.upsert({
        where: { key: "avail_days" },
        update: { value: (days as number[]).join(",") },
        create: { key: "avail_days", value: (days as number[]).join(",") },
      }),
      prisma.adminSettings.upsert({
        where: { key: "avail_slots" },
        update: { value: (slots as string[]).join(",") },
        create: { key: "avail_slots", value: (slots as string[]).join(",") },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
