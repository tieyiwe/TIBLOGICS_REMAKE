import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { scholarshipWriter } from "@/lib/learn/scholarship/guard";
import { setApplicationsOpen } from "@/lib/learn/scholarship/applications";

// Open or close public applications (/tilo-vision-scholarship).
const Body = z.object({ open: z.boolean() });

export async function POST(req: NextRequest) {
  const { session, error } = await scholarshipWriter(req);
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await setApplicationsOpen(parsed.data.open);
  await audit(session, parsed.data.open ? "scholarship.applications.open" : "scholarship.applications.close", { type: "setting", id: "scholarship.applications" });
  return NextResponse.json({ ok: true });
}
