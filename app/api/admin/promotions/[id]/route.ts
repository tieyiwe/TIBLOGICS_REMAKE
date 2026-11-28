import { NextRequest, NextResponse } from "next/server";
import { audit } from "@/lib/admin/audit";
import { errorResponse, promoAdmin, PromotionBody, serialise, toInput } from "@/lib/promotions/admin";
import { deleteDraft, getPromotion, listRedemptions, updatePromotion } from "@/lib/promotions/service";

// One promotion: read (with redemptions), save, delete a never-published draft.
// Saving a published promotion updates Stripe at once (lib/promotions/service.ts).
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { error } = await promoAdmin(req);
  if (error) return error;
  const { id } = await params;
  try {
    const promo = await getPromotion(id);
    if (!promo) return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
    const redemptions = await listRedemptions(id);
    return NextResponse.json({ promotion: serialise(promo), redemptions: redemptions.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
  } catch (err) {
    return errorResponse(err, "get");
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { session, error } = await promoAdmin(req);
  if (error) return error;
  const { id } = await params;
  try {
    const body = PromotionBody.parse(await req.json().catch(() => ({})));
    const { promo, recreated, changes } = await updatePromotion(id, toInput(body), { confirmRecreate: body.confirmRecreate });
    await audit(session, recreated ? "promotion.recreate" : "promotion.update", { type: "promotion", id, label: promo.name }, { changes, state: promo.state });
    return NextResponse.json({ promotion: serialise(promo), recreated });
  } catch (err) {
    return errorResponse(err, "update");
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { session, error } = await promoAdmin(req);
  if (error) return error;
  const { id } = await params;
  try {
    const cur = await getPromotion(id);
    await deleteDraft(id);
    await audit(session, "promotion.delete", { type: "promotion", id, label: cur?.name ?? null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err, "delete");
  }
}
