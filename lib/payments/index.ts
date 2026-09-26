// Active payment provider. Swap this one binding to migrate providers.
import stripeProvider from "./stripe";
import type { PaymentProvider } from "./provider";

export const payments: PaymentProvider = stripeProvider;

export * from "./provider";
export default payments;
