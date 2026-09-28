import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureBlueprintTables } from "@/lib/blueprint/db";
import { blueprintPrice, BLUEPRINT_PRODUCT } from "@/lib/blueprint/config";
import { IntakeSchema } from "@/lib/blueprint/intake";
import { blueprintToken, hashToken, newCreditCode, newSalt } from "@/lib/blueprint/token";

// Saves the intake as a draft and opens Stripe checkout. The draft is only
// written up after payment settles (the webhook), and the price comes from
// server configuration, never the request.

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`blueprint-start:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const price = blueprintPrice();
  if (!price) return NextResponse.json({ error: "The Automation Blueprint is not on sale yet." }, { status: 503 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });

  const parsed = IntakeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Please check the form", path: issue?.path }, { status: 400 });
  }
  const intake = parsed.data;

  await ensureBlueprintTables();

  // The credit code is unique; a collision is vanishingly rare but retried.
  let bp;
  for (let attempt = 0; attempt < 3 && !bp; attempt++) {
    const salt = newSalt();
    try {
      bp = await prisma.blueprint.create({
        data: {
          email: intake.email, name: intake.name, company: intake.company,
          status: "draft", intake: JSON.parse(JSON.stringify(intake)),
          creditCode: newCreditCode(), tokenSalt: salt, tokenHash: hashToken(newSalt()),
        },
      });
      await prisma.blueprint.update({ where: { id: bp.id }, data: { tokenHash: hashToken(blueprintToken(bp.id, salt)) } });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }
  }
  if (!bp) return NextResponse.json({ error: "Could not start. Please try again." }, { status: 500 });

  const metadata = { product: BLUEPRINT_PRODUCT, blueprintId: bp.id };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: price,
          product_data: {
            name: "TIBLOGICS Automation Blueprint",
            description: `A written automation plan for ${intake.company}, credited against a build.`,
          },
        },
      }],
      customer_email: intake.email,
      allow_promotion_codes: true,
      client_reference_id: bp.id,
      success_url: `${SITE}/tools/automation-blueprint?paid=1`,
      cancel_url: `${SITE}/tools/automation-blueprint?canceled=1`,
      metadata,
      payment_intent_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    await prisma.blueprint.update({ where: { id: bp.id }, data: { stripeSessionId: session.id } });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[blueprint/start]", err instanceof Error ? err.message : err);
    await prisma.blueprint.delete({ where: { id: bp.id } }).catch(() => {});
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
