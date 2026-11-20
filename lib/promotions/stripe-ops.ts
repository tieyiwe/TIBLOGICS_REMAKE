// Every Stripe call the promotions module makes. Checkouts use price_data
// (ad-hoc products), which a coupon's applies_to cannot target, so a coupon
// here is never product-restricted: eligibility is enforced in our checkout
// code (lib/promotions/service.ts resolveCheckoutDiscount).
import type Stripe from "stripe";
import stripe from "@/lib/stripe";
import type { PromoDuration, PromoKind } from "./shared";

export class PromotionError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** A Stripe failure as a sentence the owner can act on. */
export function friendlyStripeError(err: unknown, doing: string): PromotionError {
  const e = err as { type?: string; code?: string; message?: string; statusCode?: number };
  const msg = String(e?.message ?? "");
  console.error(`[promotions/stripe] ${doing}`, msg || err);
  if (!process.env.STRIPE_SECRET_KEY) return new PromotionError("Stripe is not configured (STRIPE_SECRET_KEY is missing).", 503);
  if (e?.type === "StripeAuthenticationError") return new PromotionError("Stripe rejected the API key. Check STRIPE_SECRET_KEY.", 502);
  if (/already exists|must be unique|already in use/i.test(msg)) {
    return new PromotionError("That code is already active in Stripe. Choose another code, or pause the promotion that uses it.", 409);
  }
  if (e?.type === "StripeConnectionError" || e?.type === "StripeAPIError") {
    return new PromotionError(`Could not reach Stripe to ${doing}. Nothing was changed. Try again in a minute.`, 502);
  }
  if (e?.type === "StripeRateLimitError") return new PromotionError("Stripe is rate limiting requests. Try again in a minute.", 429);
  return new PromotionError(`Stripe could not ${doing}: ${msg.slice(0, 200) || "unknown error"}.`, 502);
}

export interface CouponSpec {
  name: string;
  kind: PromoKind;
  percentOff?: number | null;
  amountOffCents?: number | null;
  duration: PromoDuration;
  durationMonths?: number | null;
  metadata?: Record<string, string>;
  /** One-off coupons: single use, short-lived. */
  maxRedemptions?: number;
  redeemBy?: Date;
}

export async function createCoupon(spec: CouponSpec): Promise<string> {
  const params: Stripe.CouponCreateParams = {
    name: spec.name.slice(0, 40),
    duration: spec.duration,
    ...(spec.duration === "repeating" ? { duration_in_months: Math.max(1, spec.durationMonths ?? 1) } : {}),
    ...(spec.kind === "percent"
      ? { percent_off: Number(spec.percentOff) }
      : { amount_off: Math.round(Number(spec.amountOffCents)), currency: "usd" }),
    ...(spec.maxRedemptions ? { max_redemptions: spec.maxRedemptions } : {}),
    ...(spec.redeemBy ? { redeem_by: Math.floor(spec.redeemBy.getTime() / 1000) } : {}),
    metadata: { source: "tiblogics-admin", ...(spec.metadata ?? {}) },
  };
  try {
    const c = await stripe.coupons.create(params);
    return c.id;
  } catch (err) {
    throw friendlyStripeError(err, "create the coupon");
  }
}

export async function renameCoupon(id: string, name: string): Promise<void> {
  try {
    await stripe.coupons.update(id, { name: name.slice(0, 40) });
  } catch (err) {
    throw friendlyStripeError(err, "rename the coupon");
  }
}

/** Deleting a coupon stops new redemptions; subscriptions that have it keep it. */
export async function archiveCoupon(id: string): Promise<void> {
  try {
    await stripe.coupons.del(id);
  } catch (err) {
    const e = err as { code?: string; statusCode?: number };
    if (e?.statusCode === 404 || e?.code === "resource_missing") return;
    throw friendlyStripeError(err, "archive the old coupon");
  }
}

export interface PromotionCodeSpec {
  couponId: string;
  code: string;
  active: boolean;
  expiresAt?: Date | null;
  maxRedemptions?: number | null;
  firstTimeOnly?: boolean;
  minimumCents?: number | null;
  promotionId: string;
}

/** A Stripe promotion code whose restrictions mirror ours where Stripe supports them. */
export async function createPromotionCode(spec: PromotionCodeSpec): Promise<string> {
  const restrictions: Stripe.PromotionCodeCreateParams.Restrictions = {};
  if (spec.firstTimeOnly) restrictions.first_time_transaction = true;
  if (spec.minimumCents && spec.minimumCents > 0) {
    restrictions.minimum_amount = spec.minimumCents;
    restrictions.minimum_amount_currency = "usd";
  }
  const expires = spec.expiresAt && spec.expiresAt.getTime() > Date.now() + 60_000 ? Math.floor(spec.expiresAt.getTime() / 1000) : undefined;
  try {
    const pc = await stripe.promotionCodes.create({
      coupon: spec.couponId,
      code: spec.code,
      active: spec.active,
      ...(expires ? { expires_at: expires } : {}),
      ...(spec.maxRedemptions && spec.maxRedemptions > 0 ? { max_redemptions: spec.maxRedemptions } : {}),
      ...(Object.keys(restrictions).length ? { restrictions } : {}),
      metadata: { source: "tiblogics-admin", promotionId: spec.promotionId },
    });
    return pc.id;
  } catch (err) {
    throw friendlyStripeError(err, "create the promotion code");
  }
}

export async function setPromotionCodeActive(id: string, active: boolean): Promise<void> {
  try {
    await stripe.promotionCodes.update(id, { active });
  } catch (err) {
    const e = err as { code?: string; statusCode?: number };
    if (!active && (e?.statusCode === 404 || e?.code === "resource_missing")) return;
    throw friendlyStripeError(err, active ? "turn the promotion code on" : "turn the promotion code off");
  }
}
