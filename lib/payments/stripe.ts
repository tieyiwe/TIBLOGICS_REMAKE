// Stripe implementation of PaymentProvider. The only file in the Learn
// module that talks to Stripe directly.
import stripe from "@/lib/stripe";
import {
  PLANS,
  type CheckoutRequest,
  type PaymentProvider,
  type PlanDefinition,
} from "./provider";

// Optional: pre-created Stripe Price IDs. If absent we fall back to inline
// price_data so the platform works before Stripe products are configured.
const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_LEARN_MONTHLY_PRICE_ID,
  annual: process.env.STRIPE_LEARN_ANNUAL_PRICE_ID,
};

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  listPlans(): PlanDefinition[] {
    return [PLANS.monthly, PLANS.annual];
  },

  async createCheckout(req: CheckoutRequest) {
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

  async createBillingPortal(customerId: string, returnUrl: string) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: portal.url };
  },
};

export default stripeProvider;
