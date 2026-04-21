import Stripe from "stripe";

// Lazy singleton — deferred so build-time imports don't throw without STRIPE_SECRET_KEY
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_: Stripe, prop: string | symbol) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default stripe;
