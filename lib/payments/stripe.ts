// Stripe implementation of PaymentProvider. The only file in the Learn
// module that talks to Stripe directly.
import stripe from "@/lib/stripe";
import {
  PLANS,
  type CheckoutRequest,
  type PaymentProvider,
  type PlanDefinition,
  type TrackCheckoutRequest,
} from "./provider";

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
              name: `TIBLOGICS Learn — All-Access (${plan.label})`,
              description: plan.blurb,
            },
          },
        };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem as never],
      customer_email: req.email,
      allow_promotion_codes: true,
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      // studentId is the join key the webhook uses to attach the subscription.
      client_reference_id: req.studentId,
      metadata: { studentId: req.studentId, plan: req.plan, product: "learn" },
      subscription_data: {
        metadata: { studentId: req.studentId, plan: req.plan, product: "learn" },
      },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };
  },

  async createTrackCheckout(req: TrackCheckoutRequest) {
    const metadata = { product: "learn-track", studentId: req.studentId, trackId: req.trackId };
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: req.currency.toLowerCase(),
            unit_amount: req.amount,
            product_data: {
              name: `TIBLOGICS Learning Box: ${req.trackTitle}`,
              description: "One-time payment. Lifetime access to this track.",
            },
          },
        },
      ],
      customer_email: req.email,
      allow_promotion_codes: true,
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      client_reference_id: req.studentId,
      // The webhook creates the TrackPurchase from these.
      metadata,
      payment_intent_data: { metadata },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };
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
