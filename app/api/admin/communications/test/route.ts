import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { applyMerge } from "@/lib/learn/inbox/markdown";
import { renderCampaignEmail, sendCampaignEmail } from "@/lib/learn/inbox/email";
import { BODY_MAX, SUBJECT_MAX, sampleMergeValues } from "@/lib/learn/inbox/campaigns";
import { audit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

// Test send: the message as a learner would get it (sample merge values),
// to the signed-in admin's own address, subject prefixed with [Test].
const Body = z.object({
  kind: z.enum(["marketing", "service"]),
  subject: z.string().trim().min(1).max(SUBJECT_MAX),
  body: z.string().trim().min(1).max(BODY_MAX),
  locale: z.enum(["en", "fr"]).default("en"),
});

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const to = session.user.email;
  if (!to) return NextResponse.json({ error: "Your account has no email" }, { status: 400 });
  if (!(await checkRateLimit(`comms-test:${to}`, 20, 3_600_000))) return NextResponse.json({ error: "Too many tests in an hour." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Write a subject and a message" }, { status: 400 });
  const v = sampleMergeValues(session.user.name ?? "Amina");
  const email = renderCampaignEmail({
    locale: parsed.data.locale,
    subject: `[Test] ${applyMerge(parsed.data.subject, v)}`,
    body: applyMerge(parsed.data.body, v),
    marketing: parsed.data.kind === "marketing",
    studentId: "test-preview",
    withInboxLink: true,
  });
  try {
    await sendCampaignEmail(to, email);
  } catch (err) {
    console.error("[comms/test]", err);
    return NextResponse.json({ error: "The test email could not be sent. Check the ARFA mail settings." }, { status: 502 });
  }
  await audit(session, "comms.test", { type: "email", label: to }, { subject: parsed.data.subject });
  return NextResponse.json({ ok: true, to });
}
