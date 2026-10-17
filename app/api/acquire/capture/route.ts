import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { CaptureError, handleCapture } from "@/lib/growth/acquire/capture";
import { clientIp, isSameSiteJson } from "@/lib/growth/acquire/security";
import { SLUG_RE } from "@/lib/growth/acquire/types";

// Public opt-in for lead magnets (/free/[slug]) and landing pages (/lp/[slug]).
// JSON only from this site (CSRF), rate-limited per address and per email,
// honeypot + minimum fill time (bots get a fake success and nothing is
// stored), consent required and stored with its exact text and timestamp.
export const dynamic = "force-dynamic";

const Body = z.object({
  refType: z.enum(["magnet", "page"]),
  slug: z.string().regex(SLUG_RE),
  email: z.string().trim().max(254),
  name: z.string().trim().max(100).optional().nullable(),
  business: z.string().trim().max(160).optional().nullable(),
  whatsapp: z.string().trim().max(40).regex(/^[0-9+()\-.\s]*$/).optional().nullable(),
  consent: z.literal(true),
  locale: z.string().max(5).optional(),
  answers: z.array(z.number().int().min(0).max(9)).max(12).optional().nullable(),
  /** Honeypot: a hidden field people never fill in. */
  website: z.string().max(200).optional().nullable(),
  /** When the form was rendered (ms): a submit within 1.5 s is a bot. */
  ts: z.number().int().optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!isSameSiteJson(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const locale: Locale = isLocale(raw?.locale) ? (raw!.locale as Locale) : "en";
  const t = translatorFor(locale);
  const ip = clientIp(req);
  if (!(await checkRateLimit(`acquire-capture:${ip}`, 6, 10 * 60_000))) {
    return NextResponse.json({ error: t("acquire.form.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(raw ?? {});
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const key = field === "consent" ? "acquire.form.consentRequired" : field === "email" ? "acquire.form.invalidEmail" : "acquire.form.failed";
    return NextResponse.json({ error: t(key) }, { status: 400 });
  }
  const b = parsed.data;
  if (b.website || (b.ts && Date.now() - b.ts < 1500)) {
    // Looks automated: answer like a success, store nothing.
    return NextResponse.json({ ok: true, accessUrl: null, result: null });
  }
  if (!(await checkRateLimit(`acquire-email:${b.email.toLowerCase()}`, 4, 60 * 60_000))) {
    return NextResponse.json({ error: t("acquire.form.tooMany") }, { status: 429 });
  }
  try {
    const out = await handleCapture({
      refType: b.refType,
      slug: b.slug,
      email: b.email,
      name: b.name,
      business: b.business,
      whatsapp: b.whatsapp,
      locale,
      answers: b.answers ?? null,
      cookieHeader: req.headers.get("cookie"),
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (err) {
    if (err instanceof CaptureError) {
      const key = err.message === "invalidEmail" ? "acquire.form.invalidEmail" : "acquire.form.failed";
      return NextResponse.json({ error: t(key) }, { status: err.status });
    }
    console.error("[api/acquire/capture]", err);
    return NextResponse.json({ error: t("acquire.form.failed") }, { status: 500 });
  }
}
