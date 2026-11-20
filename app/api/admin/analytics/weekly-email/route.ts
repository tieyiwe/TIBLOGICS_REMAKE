import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { setWeeklyEmail, weeklyEmailEnabled } from "@/lib/analytics/insights";
import { buildWeeklyEmail, maybeSendWeeklyEmail, weeklyRecipient } from "@/lib/analytics/weekly-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The weekly growth email (lib/analytics/weekly-email.ts).
//   GET                     on/off and the recipient (Business analytics)
//   GET ?preview=1          the email as HTML (Business analytics)
//   POST { enabled }        turn it on or off (Settings permission)
//   POST { send: true }     send this week's email now (owner and admins, 3 an hour)

const Body = z.union([z.object({ enabled: z.boolean() }).strict(), z.object({ send: z.literal(true) }).strict()]);

export async function GET(req: NextRequest) {
  const preview = req.nextUrl.searchParams.get("preview") === "1";
  // The on/off state is shown in Settings too; the preview holds the numbers.
  const denied = preview ? await requirePermission("insights") : ((await requirePermission("settings")) && (await requirePermission("insights")));
  if (denied) return denied;
  if (preview) {
    const mail = await buildWeeklyEmail();
    return new NextResponse(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, private" } });
  }
  return NextResponse.json({ enabled: await weeklyEmailEnabled(), recipient: weeklyRecipient() });
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if ("enabled" in parsed.data) {
    const denied = await requirePermission("settings");
    if (denied) return denied;
    await setWeeklyEmail(parsed.data.enabled);
    return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
  }
  const denied = await requirePermission("__admin__");
  if (denied) return denied;
  if (!(await checkRateLimit("analytics-weekly-send:admin", 3, 3_600_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const r = await maybeSendWeeklyEmail({ force: true });
  return NextResponse.json({ ok: r === "sent", result: r, recipient: weeklyRecipient() }, { status: r === "sent" || r === "off" ? 200 : 502 });
}
