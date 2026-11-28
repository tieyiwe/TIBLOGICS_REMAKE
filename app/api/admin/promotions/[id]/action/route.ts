import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { can } from "@/lib/admin/permissions";
import { actorEmail, errorResponse, promoAdmin, serialise } from "@/lib/promotions/admin";
import { duplicatePromotion, publishPromotion, stopPromotion } from "@/lib/promotions/service";
import { promoStatus } from "@/lib/promotions/shared";

// Publish (or resume), pause, end now, duplicate. Each takes effect at once:
// the Stripe promotion code is switched and auto-apply follows the new state.
const Body = z.object({ action: z.enum(["publish", "pause", "end", "duplicate"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await promoAdmin(req);
  if (error) return error;
  const { id } = await params;
  try {
    const { action } = Body.parse(await req.json().catch(() => ({})));
    // Publishing, pausing or ending changes what customers pay right away.
    if (action !== "duplicate" && !can(session.user, "promotions.publish")) {
      return NextResponse.json({ error: "Turning promotions on or off needs the Publish promotions permission." }, { status: 403 });
    }
    if (action === "duplicate") {
      const copy = await duplicatePromotion(id, actorEmail(session));
      await audit(session, "promotion.duplicate", { type: "promotion", id: copy.id, label: copy.name }, { from: id });
      return NextResponse.json({ promotion: serialise(copy) }, { status: 201 });
    }
    const promo = action === "publish" ? await publishPromotion(id) : await stopPromotion(id, action === "pause" ? "paused" : "ended");
    await audit(session, `promotion.${action}`, { type: "promotion", id, label: promo.name }, { status: promoStatus(promo), code: promo.code });
    return NextResponse.json({ promotion: serialise(promo) });
  } catch (err) {
    return errorResponse(err, "action");
  }
}
