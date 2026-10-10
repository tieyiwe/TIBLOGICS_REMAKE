import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { submitApplication } from "@/lib/learn/scholarship/applications";
import { ScholarshipError } from "@/lib/learn/scholarship/service";

// The public Tilo Vision Scholarship application (/tilo-vision-scholarship).
// No sign-in. Rate limited per network and per address; a hidden field
// catches bots (they get the same thank-you, nothing is stored).
const Id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const Body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(254),
  phone: z.string().trim().min(7).max(30),
  country: z.string().trim().max(80).optional().nullable(),
  locale: z.enum(["en", "fr", "sw"]).optional(),
  background: z.string().max(40).optional().nullable(),
  motivation: z.string().trim().min(80).max(2000),
  goals: z.string().trim().max(1000).optional().nullable(),
  trackIds: z.array(Id).max(5).optional(),
  links: z.string().trim().max(300).optional().nullable(),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Generous per network: a whole event venue can apply over one Wi-Fi.
  // The per-address limit below and the hidden field stop repeat and bot posts.
  if (!(await checkRateLimit(`scholarship-apply:${ip}`, 200, 3_600_000))) {
    return NextResponse.json({ error: t("learn.scholarApply.error.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.scholarApply.error.invalid") }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true, reference: null });
  if (!(await checkRateLimit(`scholarship-apply:email:${parsed.data.email.toLowerCase()}`, 3, 86_400_000))) {
    return NextResponse.json({ error: t("learn.scholarApply.error.tooMany") }, { status: 429 });
  }
  try {
    const r = await submitApplication(parsed.data, req.headers);
    return NextResponse.json(r);
  } catch (err) {
    if (err instanceof ScholarshipError) {
      return NextResponse.json({ error: t(err.message === "closed" ? "learn.scholarApply.closedTitle" : "learn.scholarApply.error.invalid") }, { status: err.status });
    }
    console.error("[POST /api/learn/scholarship/apply]", err);
    return NextResponse.json({ error: t("learn.scholarApply.error.generic") }, { status: 500 });
  }
}
