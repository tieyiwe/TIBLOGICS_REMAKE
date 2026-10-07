import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { scholarshipWriter } from "@/lib/learn/scholarship/guard";
import { sponsorReport } from "@/lib/learn/scholarship/admin";
import { sendSponsorReport } from "@/lib/learn/scholarship/emails";

// Email a sponsor their impact report (to the sponsor email on their awards,
// or another address). Scholars appear by first name and initial only.
const Body = z.object({ sponsor: z.string().trim().min(1).max(200), to: z.string().max(320).nullish() });

export async function POST(req: NextRequest) {
  const { session, error } = await scholarshipWriter(req);
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const r = await sponsorReport(parsed.data.sponsor);
  if (!r.awarded) return NextResponse.json({ error: "No awards for this sponsor." }, { status: 404 });
  const to = parsed.data.to ? normEmail(parsed.data.to) : r.email;
  if (!to) return NextResponse.json({ error: "Add a sponsor email (on an award or here)." }, { status: 400 });
  try {
    await sendSponsorReport(to, r);
  } catch (err) {
    console.error("[admin/scholarships/sponsors]", err);
    return NextResponse.json({ error: "The email could not be sent." }, { status: 502 });
  }
  await audit(session, "scholarship.sponsor.report", { type: "sponsor", id: r.sponsor, label: to }, { scholars: r.accepted });
  return NextResponse.json({ ok: true, to });
}
