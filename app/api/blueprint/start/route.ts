import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { resolveCheckoutDiscount } from "@/lib/promotions/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureBlueprintTables } from "@/lib/blueprint/db";
import { blueprintPrice, BLUEPRINT_PRODUCT } from "@/lib/blueprint/config";
import { FIELD_KEYS, IntakeSchema, ISSUE_KEYS } from "@/lib/blueprint/intake";
import { getLocale, translatorFor, type T } from "@/lib/i18n/server";
import { blueprintToken, hashToken, newCreditCode, newSalt } from "@/lib/blueprint/token";
import { recordAttribution } from "@/lib/growth/attribution";

// Saves the intake as a draft and opens Stripe checkout. The draft is only
// written up after payment settles (the webhook), and the price comes from
// server configuration, never the request.

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

/** A validation message in the visitor's language, naming the process it is about. */
function issueText(t: T, issue: { message: string; path: PropertyKey[] } | undefined): string {
  if (!issue) return t("tools.bp.v.check");
  const tooLong = /^(.*) is too long$/.exec(issue.message);
  const known = ISSUE_KEYS[issue.message];
  const msg = known
    ? t(`tools.bp.v.${known}`)
    : tooLong && FIELD_KEYS[tooLong[1]]
    ? t("tools.bp.v.tooLong", { field: t(`tools.bp.field.${FIELD_KEYS[tooLong[1]]}`) })
    : t("tools.bp.v.check");
  const [first, index] = issue.path;
  return first === "processes" && typeof index === "number" ? t("tools.bp.v.inProcess", { n: index + 1, msg }) : msg;
}

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`blueprint-start:${ip}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.tooManyAttempts") }, { status: 429 });
  }
  const price = blueprintPrice();
  if (!price) return NextResponse.json({ error: t("tools.bp.api.notOnSale") }, { status: 503 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: t("tools.api.paymentsOff") }, { status: 503 });

  const parsed = IntakeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issueText(t, issue), path: issue?.path }, { status: 400 });
  }
  // The blueprint is written in the language the customer bought in.
  const intake = { ...parsed.data, locale };

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
  if (!bp) return NextResponse.json({ error: t("tools.bp.api.couldNotStart") }, { status: 500 });

  const metadata = { product: BLUEPRINT_PRODUCT, blueprintId: bp.id };
  try {
    const discount = await resolveCheckoutDiscount({
      lines: [{ key: "blueprint", amountCents: price }],
      recurring: false,
      buyer: { email: intake.email },
    });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: price,
          product_data: {
            name: "TIBLOGICS Automation Blueprint",
            description: t("tools.bp.api.stripeDesc", { company: intake.company }),
          },
        },
      }],
      customer_email: intake.email,
      ...(discount.couponId ? { discounts: [{ coupon: discount.couponId }] } : discount.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
      client_reference_id: bp.id,
      // Stripe has French; for Swahili it follows the browser.
      locale: locale === "fr" ? "fr" : "auto",
      success_url: `${SITE}/tools/automation-blueprint?paid=1`,
      cancel_url: `${SITE}/tools/automation-blueprint?canceled=1`,
      metadata: { ...discount.metadata, ...metadata },
      payment_intent_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    await prisma.blueprint.update({ where: { id: bp.id }, data: { stripeSessionId: session.id } });
    await recordAttribution({ kind: "blueprint", refId: bp.id, cookieHeader: req.headers.get("cookie"), headers: req.headers, amountCents: price });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[blueprint/start]", err instanceof Error ? err.message : err);
    await prisma.blueprint.delete({ where: { id: bp.id } }).catch(() => {});
    return NextResponse.json({ error: t("tools.api.checkoutFailed") }, { status: 502 });
  }
}
