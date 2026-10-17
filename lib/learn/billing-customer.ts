import prisma from "@/lib/prisma";
import { trackSubscriptionCustomer } from "@/lib/learn/track-subscriptions";

// The learner's Stripe customer, so a new checkout lands on the same customer
// as their other subscriptions and one billing portal shows everything
// (lib/payments/stripe.ts createSessionFor). The all-tracks plan's customer
// first, else a track plan's. Null for a learner who never paid by
// subscription: Stripe then creates the customer from the email.
export async function learnerStripeCustomer(studentId: string): Promise<string | null> {
  const sub = await prisma.learnSubscription
    .findUnique({ where: { studentId }, select: { stripeCustomerId: true } })
    .catch(() => null);
  return sub?.stripeCustomerId ?? (await trackSubscriptionCustomer(studentId));
}
