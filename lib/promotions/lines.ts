// Checkout lines for what a customer is about to buy, priced from the server
// only (the same sources the checkout routes use). Used by
// /api/promotions/validate so a code is checked against real prices.
import { z } from "zod";
import prisma from "@/lib/prisma";
import { PLANS } from "@/lib/payments/provider";
import { trackPriceCents } from "@/lib/learn/pricing";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { getTeamPricing, quoteNewTeam } from "@/lib/learn/team/settings";
import { TEAM_MAX_SEATS } from "@/lib/learn/team/config";
import { toolkitPlans, type ToolkitPlan } from "@/lib/toolkit/config";
import { blueprintPrice } from "@/lib/blueprint/config";
import type { CheckoutLine } from "./shared";

const Slug = z.string().trim().regex(/^[a-z0-9-]{1,64}$/);

export const Target = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("arfa_monthly") }),
  z.object({ kind: z.literal("track"), slug: Slug }),
  z.object({ kind: z.literal("team"), seats: z.number().int().min(1).max(TEAM_MAX_SEATS) }),
  z.object({
    kind: z.literal("store"),
    items: z.array(z.object({ id: z.string().trim().min(1).max(64), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  }),
  z.object({ kind: z.literal("toolkit"), plan: z.enum(["toolkit", "guard"]) }),
  z.object({ kind: z.literal("blueprint") }),
]);
export type TargetT = z.infer<typeof Target>;

/** Lines for a target, or null when it is not for sale. */
export async function linesFor(t: TargetT): Promise<CheckoutLine[] | null> {
  switch (t.kind) {
    case "arfa_monthly":
      return [{ key: "arfa_monthly", id: "monthly", amountCents: PLANS.monthly.amount }];
    case "track": {
      await ensureLearnEditColumns().catch(() => {});
      const track = await prisma.learnTrack.findUnique({ where: { slug: t.slug }, select: { id: true, level: true, status: true, priceCents: true } });
      if (!track || track.status !== "live") return null;
      return [{ key: "tracks", id: track.id, amountCents: trackPriceCents(track.level, track.priceCents) }];
    }
    case "team": {
      const pricing = await getTeamPricing();
      const q = quoteNewTeam(pricing, Math.max(t.seats, pricing.minSeats));
      return [{ key: "team", amountCents: q.totalCents }];
    }
    case "store": {
      const wanted = new Map<string, number>();
      for (const it of t.items) wanted.set(it.id, (wanted.get(it.id) ?? 0) + it.quantity);
      const products = await prisma.product.findMany({ where: { id: { in: [...wanted.keys()] }, published: true }, select: { id: true, price: true, stock: true } });
      const lines = products
        .filter((p) => p.stock == null || p.stock >= (wanted.get(p.id) ?? 1))
        .map((p) => ({ key: "store" as const, id: p.id, amountCents: p.price * (wanted.get(p.id) ?? 1) }));
      return lines.length ? lines : null;
    }
    case "toolkit": {
      const plan = toolkitPlans()[t.plan as ToolkitPlan];
      return plan?.amount ? [{ key: "toolkit", id: plan.id, amountCents: plan.amount }] : null;
    }
    case "blueprint": {
      const price = blueprintPrice();
      return price ? [{ key: "blueprint", amountCents: price }] : null;
    }
  }
}
