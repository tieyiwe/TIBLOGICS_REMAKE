import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import payments from "@/lib/payments";
import { requireStudent } from "@/lib/learn/session";
import { rateLimit } from "@/lib/require-admin";

const Body = z.object({
  plan: z.enum(["monthly", "annual"]),
  // Slug of the track the learner picked, so checkout returns them to it.
  // Constrained to a slug shape — it becomes part of a redirect URL, and an
  // unvalidated value here would be an open-redirect vector.
  track: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,64}$/, "Invalid track")
    .optional(),
});

const SITE = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
).replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`learn-checkout:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { error, student } = await requireStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  try {
    const { url } = await payments.createCheckout({
      plan: parsed.data.plan,
      studentId: student.id,
      email: student.email,
      successUrl: parsed.data.track
        ? `${SITE}/learn/track/${parsed.data.track}?welcome=1`
        : `${SITE}/learn?welcome=1`,
      cancelUrl: `${SITE}/courses?checkout=cancelled`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/learn/checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
