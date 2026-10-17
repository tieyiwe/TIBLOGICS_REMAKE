import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import payments from "@/lib/payments";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, getT } from "@/lib/i18n/server";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { TRACK_CURRENCY, trackPriceCents } from "@/lib/learn/pricing";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { canAccessTrack, getAccess, getStudent } from "@/lib/learn/session";
import { portalAuth } from "@/lib/learn/youth-portal";
import { isYouthSlug } from "@/lib/learn/youth";
import { CONSENT_AGE, YOUTH_MAX_AGE, YOUTH_MIN_AGE } from "@/lib/learn/youth-account";
import { RELATIONSHIPS, SPONSOR_LOCALES, cleanFreeText, createSponsorship, isParentRole, setSponsorshipSession, sponsorSiblingPct } from "@/lib/learn/youth-sponsor";

// "Sponsor a young person" (/sponsor-youth): anybody pays for a child's
// place. Public (no account needed), rate limited, every field validated
// here, prices from the server only. The child's account is created only
// once the payment is confirmed (lib/learn/youth-sponsor.ts).
const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
const Email = z.string().trim().toLowerCase().email().max(254);
const Name = z.string().trim().min(1).max(80).regex(/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u);

const Body = z.object({
  sponsorName: Name,
  sponsorEmail: Email,
  relationship: z.enum(RELATIONSHIPS),
  relationshipOther: z.string().max(200).optional(),
  childFirstName: Name.refine((s) => s.length <= 40),
  childAge: z.number().int().min(YOUTH_MIN_AGE).max(YOUTH_MAX_AGE),
  childEmail: Email,
  childLocale: z.enum(SPONSOR_LOCALES),
  lane: z.string().refine(isYouthSlug),
  note: z.string().max(1000).optional(),
  plan: z.enum(["lifetime", "monthly"]),
  parentEmail: Email.optional().or(z.literal("")),
  parentAttested: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const blocked = csrfGuard(req);
  if (blocked) return blocked;
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`youth-sponsor:${ip}`, 10, 600_000)) || !(await checkRateLimit(`youth-sponsor-d:${ip}`, 40, 86_400_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "form");
    return NextResponse.json({ error: t(`learn.youth.sponsor.err.${FIELD[field] ?? "form"}`), field }, { status: 400 });
  }
  const b = parsed.data;
  const fail = (key: string, field: string, status = 400) => NextResponse.json({ error: t(`learn.youth.sponsor.err.${key}`), field }, { status });

  if (b.sponsorEmail === b.childEmail) return fail("childEmailSame", "childEmail");
  let relationshipOther: string | null = null;
  if (b.relationship === "other") {
    relationshipOther = cleanFreeText(b.relationshipOther ?? "", 40, 2);
    if (!relationshipOther) return fail("relationshipOther", "relationshipOther");
  }
  const note = b.note?.trim() ? cleanFreeText(b.note, 300, 2) : null;
  if (b.note?.trim() && !note) return fail("note", "note");
  if (!cleanFreeText(b.sponsorName, 80) || !cleanFreeText(b.childFirstName, 40)) return fail("name", "sponsorName");
  const parentRole = isParentRole(b.relationship);
  const under = b.childAge < CONSENT_AGE;
  const parentEmail = parentRole ? null : b.parentEmail || null;
  if (!parentRole && under && !parentEmail) return fail("parentEmail", "parentEmail");
  if (parentEmail && (parentEmail === b.childEmail || parentEmail === b.sponsorEmail)) return fail("parentEmailSame", "parentEmail");
  if (parentRole && under && b.parentAttested !== true) return fail("attest", "parentAttested");
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: t("learn.api.paymentsOff") }, { status: 503 });

  try {
    await ensureLearnEditColumns().catch(() => {});
    const track = await prisma.learnTrack.findUnique({ where: { slug: b.lane }, select: { id: true, slug: true, title: true, level: true, status: true, priceCents: true } });
    if (!track || track.status !== "live") return fail("lane", "lane", 404);
    // A child who already has the program needs no new place.
    const existing = await prisma.student.findUnique({ where: { email: b.childEmail }, select: { id: true } });
    if (existing) {
      // Held counts too (a lane locked until the parent's OK or the setup).
      const acc = await getAccess(existing.id);
      if (canAccessTrack(acc, track.id) || acc.youthHeld.includes(track.id)) return fail("alreadyHas", "childEmail", 409);
    }
    const base = b.plan === "monthly" ? trackMonthlyCents(track.slug) : trackPriceCents(track.level, track.priceCents);
    if (base == null) return fail("lane", "lane", 404);
    // Only for a sponsor signed in with that email (learner account or the
    // portal): otherwise the price would tell anyone who typed an address
    // whether that person already has a child in the program.
    const [me, portalEmail] = await Promise.all([getStudent().catch(() => null), portalAuth().catch(() => null)]);
    const proven = [me?.email, portalEmail].some((e) => e && e.trim().toLowerCase() === b.sponsorEmail);
    const siblingPct = proven ? await sponsorSiblingPct(b.sponsorEmail, b.childEmail) : 0;
    const amount = siblingPct ? Math.round((base * (100 - siblingPct)) / 100) : base;
    const id = await createSponsorship(
      {
        sponsorName: b.sponsorName, sponsorEmail: b.sponsorEmail, relationship: b.relationship, relationshipOther,
        childFirstName: b.childFirstName, childAge: b.childAge, childEmail: b.childEmail, childLocale: b.childLocale,
        lane: track.slug, note, plan: b.plan, parentEmail, parentAttested: parentRole && b.parentAttested === true, sponsorLocale: locale,
      },
      amount,
      siblingPct,
    );
    const { url, sessionId } = await payments.createYouthSponsorCheckout({
      sponsorshipId: id,
      sponsorEmail: b.sponsorEmail,
      trackId: track.id,
      trackSlug: track.slug,
      trackTitle: track.title,
      plan: b.plan,
      amount,
      siblingDiscountPct: siblingPct || undefined,
      currency: TRACK_CURRENCY,
      successUrl: `${SITE}/api/learn/youth/sponsor/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${SITE}/sponsor-youth?lane=${track.slug}&cancelled=1`,
    });
    await setSponsorshipSession(id, sessionId);
    // Analytics: where the sponsor came from (first and last touch). Never throws.
    await import("@/lib/analytics/touch").then((m) => m.recordTouch({ kind: "youth_sponsor", refId: id, headers: req.headers, amountCents: amount })).catch(() => {});
    return NextResponse.json({ url });
  } catch (err) {
    // No names or emails in the log.
    console.error("[POST /api/learn/youth/sponsor]", err instanceof Error ? err.message : "error");
    return NextResponse.json({ error: t("learn.api.checkoutFailed") }, { status: 500 });
  }
}

const FIELD: Record<string, string> = {
  sponsorName: "name", sponsorEmail: "email", relationship: "relationship", relationshipOther: "relationshipOther",
  childFirstName: "name", childAge: "age", childEmail: "childEmail", childLocale: "form", lane: "lane", note: "note",
  plan: "form", parentEmail: "parentEmail", parentAttested: "attest",
};
