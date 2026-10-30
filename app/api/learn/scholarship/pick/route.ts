import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import payments from "@/lib/payments";
import { getAccess, requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { TRACK_CURRENCY } from "@/lib/learn/pricing";
import { pickTrack } from "@/lib/learn/scholarship/service";

// Uses one of the learner's scholarship tracks. Everything (the award, the
// track, the price) is read on the server from the signed-in learner's own
// scholarship; the body only names which one and which track.
const Id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const Body = z.object({ scholarshipId: Id, trackId: Id });

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
const CONFIRM = "/api/learn/checkout/confirm?session_id={CHECKOUT_SESSION_ID}";

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Per learner, plus a looser per-network ceiling: scholars at one school
  // or office share an IP and must not block each other.
  if (!(await checkRateLimit(`learn-scholarship:pick:ip:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const { error, student } = await requireStudent();
  if (error) return error;
  if (!(await checkRateLimit(`learn-scholarship:pick:${student.id}`, 10, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.scholar.error.notEligible") }, { status: 400 });

  try {
    const access = await getAccess(student.id);
    const r = await pickTrack(student, parsed.data.scholarshipId, parsed.data.trackId, access.purchased);
    if (r.kind === "error") return NextResponse.json({ error: t(`learn.scholar.error.${r.error}`), reason: r.error }, { status: r.status });
    if (r.kind === "unlocked") return NextResponse.json({ ok: true, url: `/learn/track/${r.slug}?welcome=1` });

    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: t("learn.api.paymentsOff") }, { status: 503 });
    const { url } = await payments.createTrackCheckout({
      studentId: student.id,
      email: student.email,
      trackId: r.track.id,
      trackTitle: r.track.title,
      amount: r.amountCents,
      currency: TRACK_CURRENCY,
      successUrl: `${SITE}${CONFIRM}`,
      cancelUrl: `${SITE}/scholarship?checkout=cancelled`,
      scholarship: {
        id: r.scholarshipId,
        code: r.code,
        coveragePct: r.coveragePct,
        listCents: r.track.priceCents,
        couponId: r.couponId,
        description: `Tilo Vision Scholarship ${r.code}: ${r.coveragePct}% covered. One-time payment, lifetime access to this track.`,
      },
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[POST /api/learn/scholarship/pick]", err);
    return NextResponse.json({ error: t("learn.scholar.error.generic") }, { status: 500 });
  }
}
