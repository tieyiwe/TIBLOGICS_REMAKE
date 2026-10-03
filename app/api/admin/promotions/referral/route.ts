import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { actorEmail, errorResponse, promoAdmin } from "@/lib/promotions/admin";
import { disableReferralSetting, getReferralSetting, saveReferralSetting } from "@/lib/promotions/service";
import { referralCouponId } from "@/lib/learn/referrals/service";

// Referral welcome discount: a Stripe coupon made here that replaces
// STRIPE_REFERRAL_COUPON_ID while on. Turning it off falls back to the env.
const Body = z.object({
  kind: z.enum(["percent", "amount"]),
  percentOff: z.number().min(0).max(100).nullable().optional(),
  amountOffCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
  duration: z.enum(["once", "repeating", "forever"]),
  durationMonths: z.number().int().min(1).max(36).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const { error } = await promoAdmin(req);
  if (error) return error;
  return NextResponse.json({ setting: await getReferralSetting(), envCouponId: referralCouponId() });
}

export async function POST(req: NextRequest) {
  const { session, error } = await promoAdmin(req);
  if (error) return error;
  try {
    const b = Body.parse(await req.json().catch(() => ({})));
    const setting = await saveReferralSetting(b, actorEmail(session));
    await audit(session, "promotion.referral.set", { type: "referral-coupon", id: setting.couponId, label: "Referral welcome discount" }, {
      kind: setting.kind, percentOff: setting.percentOff, amountOffCents: setting.amountOffCents, duration: setting.duration, durationMonths: setting.durationMonths,
    });
    return NextResponse.json({ setting, envCouponId: referralCouponId() });
  } catch (err) {
    return errorResponse(err, "referral");
  }
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await promoAdmin(req);
  if (error) return error;
  try {
    await disableReferralSetting(actorEmail(session));
    await audit(session, "promotion.referral.off", { type: "referral-coupon", label: "Referral welcome discount" }, { fallback: referralCouponId() ? "env" : "none" });
    return NextResponse.json({ setting: await getReferralSetting(), envCouponId: referralCouponId() });
  } catch (err) {
    return errorResponse(err, "referral off");
  }
}
