// Admin API guard and input schema for /api/admin/promotions/*.
// Owner or admin only (requirePermission("*")), JSON from this site only.
import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { ensurePromotionTables } from "./db";
import { SCOPE_KEYS, fromZonedInput, type PromotionRecord } from "./shared";
import { NeedsConfirm, type PromotionInput } from "./service";
import { PromotionError } from "./stripe-ops";

export async function promoAdmin(req: Request): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const denied = await requirePermission("*");
  if (denied) return { session: null, error: denied };
  if (req.method !== "GET") {
    const bad = req.method === "DELETE" ? (sameSite(req) ? null : NextResponse.json({ error: "Cross-site request refused" }, { status: 403 })) : csrfGuard(req);
    if (bad) return { session: null, error: bad };
  }
  try {
    await ensurePromotionTables();
  } catch (err) {
    console.error("[promotions] tables", err);
    return { session: null, error: NextResponse.json({ error: "Database unavailable" }, { status: 503 }) };
  }
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session) return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session, error: null };
}

function sameSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export function actorEmail(s: Session): string {
  return s.user?.email ?? s.user?.name ?? "admin";
}

const LocalDate = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Use a valid date and time")
  .nullable()
  .optional();

const Banner = z.string().trim().max(200).nullable().optional();

export const PromotionBody = z.object({
  name: z.string().trim().min(1, "Give the promotion a name.").max(120),
  kind: z.enum(["percent", "amount"]),
  percentOff: z.number().min(0).max(100).nullable().optional(),
  amountOffCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
  duration: z.enum(["once", "repeating", "forever"]),
  durationMonths: z.number().int().min(1).max(36).nullable().optional(),
  scope: z.array(z.object({ key: z.enum(SCOPE_KEYS), ids: z.array(z.string().trim().min(1).max(64)).max(200).optional() })).max(SCOPE_KEYS.length),
  mode: z.enum(["code", "auto"]),
  code: z.string().trim().max(32).nullable().optional(),
  startsAt: LocalDate,
  endsAt: LocalDate,
  maxRedemptions: z.number().int().min(0).max(1_000_000).nullable().optional(),
  firstTimeOnly: z.boolean().optional(),
  minimumCents: z.number().int().min(0).max(10_000_000).nullable().optional(),
  bannerEn: Banner,
  bannerFr: Banner,
  bannerSw: Banner,
  confirmRecreate: z.boolean().optional(),
});

export function toInput(b: z.infer<typeof PromotionBody>): PromotionInput {
  return {
    ...b,
    startsAt: b.startsAt ? fromZonedInput(b.startsAt) : null,
    endsAt: b.endsAt ? fromZonedInput(b.endsAt) : null,
  };
}

/** Zod or service error as a JSON response the admin form can show. */
export function errorResponse(err: unknown, where: string): NextResponse {
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: err.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }
  if (err instanceof PromotionError) {
    const confirm = err instanceof NeedsConfirm;
    return NextResponse.json({ error: err.message, ...(confirm ? { needsConfirm: true } : {}) }, { status: err.status });
  }
  console.error(`[admin/promotions] ${where}`, err);
  return NextResponse.json({ error: "Something went wrong. Nothing was changed. Try again." }, { status: 500 });
}

/** JSON-safe promotion for the admin client. */
export function serialise(p: PromotionRecord) {
  return {
    ...p,
    startsAt: p.startsAt?.toISOString() ?? null,
    endsAt: p.endsAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    endedAt: p.endedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
export type SerialPromotion = ReturnType<typeof serialise>;
