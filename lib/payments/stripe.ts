// Stripe implementation of PaymentProvider. The only file in the Learn
// module that talks to Stripe directly.
import stripe from "@/lib/stripe";
import {
  PLANS,
  type CheckoutRequest,
  type PaymentProvider,
  type PlanDefinition,
  type TeamCheckoutRequest,
  type TrackCheckoutRequest,
} from "./provider";
import type { CheckoutDiscountFields } from "./provider";

/** One coupon, or Stripe's code box, never both (Stripe allows one or the other). */
function discountParams(req: CheckoutDiscountFields) {
  if (req.couponId) return { discounts: [{ coupon: req.couponId }] };
  return req.allowPromotionCodes === false ? {} : { allow_promotion_codes: true };
}

// Optional: a pre-created Stripe Price ID for the monthly plan. If absent we
// fall back to inline price_data (PLANS.monthly.amount, $89) so the platform
// works before Stripe products are configured. When set, it must be an $89
// monthly price. The annual plan is no longer sold.
const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_LEARN_MONTHLY_PRICE_ID,
};

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  listPlans(): PlanDefinition[] {
    return [PLANS.monthly];
  },

  async createCheckout(req: CheckoutRequest) {
    if (req.plan !== "monthly") throw new Error("Only the monthly plan is sold");
    const plan = PLANS[req.plan];
    const priceId = PRICE_IDS[req.plan];

    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: plan.amount,
            recurring: { interval: plan.interval },
            product_data: {
              name: `ARFA by TIBLOGICS: All-Access (${plan.label})`,
              description: plan.blurb,
            },
          },
        };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem as never],
      customer_email: req.email,
      // A promotion or referral coupon replaces the promotion-code box.
      ...discountParams(req),
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      // studentId is the join key the webhook uses to attach the subscription.
      client_reference_id: req.studentId,
      metadata: {
        ...req.promoMetadata,
        studentId: req.studentId,
        plan: req.plan,
        product: "learn",
        ...(req.returnTrack ? { returnTrack: req.returnTrack } : {}),
      },
      subscription_data: {
        metadata: { studentId: req.studentId, plan: req.plan, product: "learn" },
      },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };
  },

  async createTrackCheckout(req: TrackCheckoutRequest) {
    const metadata: Record<string, string> = { product: "learn-track", studentId: req.studentId, trackId: req.trackId };
    // A scholarship price is final: no promotion code on top of it.
    if (req.scholarship) Object.assign(metadata, { scholarshipId: req.scholarship.id, scholarshipCode: req.scholarship.code, listCents: String(req.scholarship.listCents) });
    // Scholarship with its coupon: the full price, and Stripe shows the
    // scholarship as a discount line (the saving) and the total owed.
    const scholarshipCoupon = req.scholarship?.couponId ?? null;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: req.currency.toLowerCase(),
            unit_amount: scholarshipCoupon ? req.scholarship!.listCents : req.amount,
            product_data: {
              name: `ARFA by TIBLOGICS: ${req.trackTitle}`,
              description: req.scholarship?.description ?? "One-time payment. Lifetime access to this track.",
            },
          },
        },
      ],
      customer_email: req.email,
      ...(req.scholarship ? (scholarshipCoupon ? { discounts: [{ coupon: scholarshipCoupon }] } : {}) : discountParams(req)),
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      client_reference_id: req.studentId,
      // The webhook creates the TrackPurchase from these.
      metadata: { ...req.promoMetadata, ...metadata },
      payment_intent_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };
  },

  // ── Team plans ──────────────────────────────────────────────────────────
  // STRIPE_LEARN_TEAM_PRICE_ID (optional): a monthly per-seat Price for the
  // base band. Without it (and always for a volume band, which a single
  // Price cannot express) the seat price is sent inline.
  async createTeamCheckout(req: TeamCheckoutRequest) {
    const metadata = { product: "learn-team", teamId: req.teamId, ownerStudentId: req.ownerStudentId };
    const priceId = req.volumeBand ? undefined : process.env.STRIPE_LEARN_TEAM_PRICE_ID;
    const lineItem = priceId
      ? { price: priceId, quantity: req.seats }
      : {
          quantity: req.seats,
          price_data: {
            currency: req.currency.toLowerCase(),
            unit_amount: req.seatPriceCents,
            recurring: { interval: "month" as const },
            product_data: {
              name: "ARFA by TIBLOGICS: Team seat",
              description: "One seat, every track. Billed monthly per seat.",
            },
          },
        };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem as never],
      customer_email: req.email,
      ...discountParams(req),
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      client_reference_id: req.ownerStudentId,
      metadata: { ...req.promoMetadata, ...metadata },
      subscription_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url, sessionId: session.id };
  },

  async updateTeamSeats(subscriptionId: string, seats: number) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const item = sub.items?.data?.[0];
    if (!item) throw new Error("Team subscription has no item");
    await stripe.subscriptions.update(subscriptionId, { items: [{ id: item.id, quantity: seats }] });
  },

  async updateTeamSeatPrice(subscriptionId: string, seatPriceCents: number, currency: string) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const item = sub.items?.data?.[0];
    if (!item) throw new Error("Team subscription has no item");
    // Only a subscription on the fixed Stripe price is left alone. A volume
    // band is always checked out with price_data (createTeamCheckout), even
    // when STRIPE_LEARN_TEAM_PRICE_ID is set; returning early for every
    // subscription whenever that secret existed let an owner buy 51 seats at
    // the band price, drop to 2 and keep paying the band price in Stripe.
    if (process.env.STRIPE_LEARN_TEAM_PRICE_ID && item.price?.id === process.env.STRIPE_LEARN_TEAM_PRICE_ID) return;
    const product = typeof item.price?.product === "string" ? item.price.product : item.price?.product?.id;
    if (!product) throw new Error("Team subscription item has no product");
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: item.id,
          quantity: item.quantity ?? 1,
          price_data: { currency: currency.toLowerCase(), unit_amount: seatPriceCents, recurring: { interval: "month" }, product },
        },
      ],
      proration_behavior: "none",
    });
  },

  async createBillingPortal(customerId: string, returnUrl: string) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: portal.url };
  },
};

export default stripeProvider;
