import { NextRequest, NextResponse } from "next/server";
import { audit } from "@/lib/admin/audit";
import { actorEmail, errorResponse, promoAdmin, PromotionBody, serialise, toInput } from "@/lib/promotions/admin";
import { createPromotion, listPromotions } from "@/lib/promotions/service";
import { discountLabel } from "@/lib/promotions/shared";

// Promotions: list and create (as a draft). Owner or admin only.
export async function GET(req: NextRequest) {
  const { error } = await promoAdmin(req);
  if (error) return error;
  try {
    return NextResponse.json({ promotions: (await listPromotions()).map(serialise) });
  } catch (err) {
    return errorResponse(err, "list");
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await promoAdmin(req);
  if (error) return error;
  try {
    const body = PromotionBody.parse(await req.json().catch(() => ({})));
    const promo = await createPromotion(toInput(body), actorEmail(session));
    await audit(session, "promotion.create", { type: "promotion", id: promo.id, label: promo.name }, {
      mode: promo.mode, code: promo.code, discount: discountLabel(promo), scope: promo.scope.map((s) => s.key),
    });
    return NextResponse.json({ promotion: serialise(promo) }, { status: 201 });
  } catch (err) {
    return errorResponse(err, "create");
  }
}
