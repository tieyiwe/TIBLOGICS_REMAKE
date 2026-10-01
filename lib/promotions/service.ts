// Promotions (admin: /admin_pro/promotions). Server only.
//
// A promotion is a Stripe coupon plus OUR rules: what it applies to (scope),
// when (dates), how often (max redemptions), for whom (first-time customers)
// and from what order size (minimum). Checkouts build Stripe line items with
// price_data, so Stripe cannot restrict a coupon to our products: every
// checkout route asks resolveCheckoutDiscount() which discount, if any, goes
// on the session. Precedence, one discount per checkout:
//   explicit valid code  >  automatic sale  >  referral welcome coupon.
// No discount ever takes a checkout below Stripe's $0.50 minimum.
//
// Stripe's own "promotion code" box (allow_promotion_codes) is offered only
// when a live code-mode promotion exists and EVERY live code-mode promotion
// covers every line of that checkout; the Stripe promotion code mirrors our
// expiry, limit, first-time and minimum restrictions. Narrower codes are typed
// in our own field before checkout and validated here.
//
// Reads are per request with a short in-process cache that every save clears,
// so a publish or pause takes effect at once on this instance.
import { randomUUID } from "crypto";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { ensurePromotionTables } from "./db";
import {
  CODE_RE,
  SCOPE_KEYS,
  normaliseCode,
  promoStatus,
  quoteDiscount,
  scopeCoversLine,
  type CheckoutLine,
  type DiscountQuote,
  type PromoDuration,
  type PromoKind,
  type PromoMode,
  type PromoState,
  type PromotionRecord,
  type SaleView,
  type ScopeEntry,
  type ScopeKey,
} from "./shared";
import {
  PromotionError,
  archiveCoupon,
  createCoupon,
  createPromotionCode,
  renameCoupon,
  setPromotionCodeActive,
} from "./stripe-ops";

export { PromotionError } from "./stripe-ops";

// ── Reading ────────────────────────────────────────────────────────────────

type Row = Awaited<ReturnType<typeof prisma.promotion.findMany>>[number];

function cleanScope(raw: unknown): ScopeEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ScopeEntry[] = [];
  for (const r of raw) {
    const key = (r as ScopeEntry)?.key;
    if (!SCOPE_KEYS.includes(key as ScopeKey) || out.some((o) => o.key === key)) continue;
    const ids = Array.isArray((r as ScopeEntry).ids) ? (r as ScopeEntry).ids!.filter((x) => typeof x === "string").slice(0, 200) : [];
    out.push(ids.length ? { key, ids } : { key });
  }
  return out;
}

function toRecord(r: Row, counts: Map<string, number>): PromotionRecord {
  return {
    ...r,
    state: r.state as PromoState,
    kind: r.kind as PromoKind,
    duration: r.duration as PromoDuration,
    mode: r.mode as PromoMode,
    scope: cleanScope(r.scope),
    redemptionCount: counts.get(r.id) ?? 0,
  };
}

async function redemptionCounts(ids?: string[]): Promise<Map<string, number>> {
  const rows = await prisma.promotionRedemption.groupBy({
    by: ["promotionId"],
    _count: { _all: true },
    ...(ids ? { where: { promotionId: { in: ids } } } : {}),
  });
  return new Map(rows.map((r) => [r.promotionId, r._count._all]));
}

const CACHE_MS = 10_000;
let cache: { at: number; rows: PromotionRecord[] } | null = null;
let settingsCache: { at: number; referral: ReferralSetting | null } | null = null;

/** Clears the in-process cache. Every save calls it. */
export function invalidatePromotions() {
  cache = null;
  settingsCache = null;
}

/** Published and paused promotions (what checkouts and public pages read). Cached briefly. */
export async function activePromotions(): Promise<PromotionRecord[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  await ensurePromotionTables();
  const rows = await prisma.promotion.findMany({ where: { state: "published" }, orderBy: { publishedAt: "desc" } });
  const counts = await redemptionCounts(rows.map((r) => r.id));
  const out = rows.map((r) => toRecord(r, counts));
  cache = { at: Date.now(), rows: out };
  reconcileStripeCodes(out);
  return out;
}

/** Same as activePromotions, but never throws (public pages degrade to no sale). */
export async function activePromotionsSafe(): Promise<PromotionRecord[]> {
  try {
    return await activePromotions();
  } catch (err) {
    console.error("[promotions] read failed", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function listPromotions(): Promise<PromotionRecord[]> {
  await ensurePromotionTables();
  const rows = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  const counts = await redemptionCounts();
  return rows.map((r) => toRecord(r, counts));
}

export async function getPromotion(id: string): Promise<PromotionRecord | null> {
  await ensurePromotionTables();
  const r = await prisma.promotion.findUnique({ where: { id } });
  if (!r) return null;
  return toRecord(r, await redemptionCounts([id]));
}

// A scheduled code goes live, or a finished one stops, without anyone saving:
// the Stripe promotion code is switched on or off the first time a request
// sees the change. Throttled; never blocks the request.
let reconciling = false;
let lastReconcile = 0;
function reconcileStripeCodes(rows: PromotionRecord[]) {
  if (reconciling || Date.now() - lastReconcile < 15_000 || !process.env.STRIPE_SECRET_KEY) return;
  const todo = rows.filter((p) => p.mode === "code" && p.stripePromotionCodeId && p.stripeCodeActive !== (promoStatus(p) === "live"));
  if (todo.length === 0) return;
  reconciling = true;
  lastReconcile = Date.now();
  (async () => {
    for (const p of todo) {
      const want = promoStatus(p) === "live";
      try {
        await setPromotionCodeActive(p.stripePromotionCodeId!, want);
        await prisma.promotion.update({ where: { id: p.id }, data: { stripeCodeActive: want } });
      } catch (err) {
        console.error("[promotions] reconcile", p.id, err instanceof Error ? err.message : err);
      }
    }
  })().finally(() => {
    reconciling = false;
    cache = null;
  });
}

// ── Saving (admin) ─────────────────────────────────────────────────────────

export interface PromotionInput {
  name: string;
  kind: PromoKind;
  percentOff?: number | null;
  amountOffCents?: number | null;
  duration: PromoDuration;
  durationMonths?: number | null;
  scope: ScopeEntry[];
  mode: PromoMode;
  code?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxRedemptions?: number | null;
  firstTimeOnly?: boolean;
  minimumCents?: number | null;
  bannerEn?: string | null;
  bannerFr?: string | null;
  bannerSw?: string | null;
}

function normaliseInput(i: PromotionInput) {
  const code = i.mode === "code" ? normaliseCode(i.code) || null : null;
  const scope = cleanScope(i.scope);
  const blank = (s: string | null | undefined) => (s && s.trim() ? s.trim().slice(0, 200) : null);
  return {
    name: i.name.trim().slice(0, 120),
    kind: i.kind,
    percentOff: i.kind === "percent" ? Math.round(Number(i.percentOff) * 100) / 100 : null,
    amountOffCents: i.kind === "amount" ? Math.round(Number(i.amountOffCents)) : null,
    duration: i.duration,
    durationMonths: i.duration === "repeating" ? Math.max(1, Math.min(36, Math.round(Number(i.durationMonths) || 1))) : null,
    scope,
    mode: i.mode,
    code,
    startsAt: i.startsAt ?? null,
    endsAt: i.endsAt ?? null,
    maxRedemptions: i.maxRedemptions && i.maxRedemptions > 0 ? Math.round(i.maxRedemptions) : null,
    firstTimeOnly: !!i.firstTimeOnly,
    minimumCents: i.minimumCents && i.minimumCents > 0 ? Math.round(i.minimumCents) : null,
    bannerEn: blank(i.bannerEn),
    bannerFr: blank(i.bannerFr),
    bannerSw: blank(i.bannerSw),
  };
}
type Clean = ReturnType<typeof normaliseInput>;

async function checkInput(c: Clean, selfId: string | null, forPublish: boolean) {
  if (!c.name) throw new PromotionError("Give the promotion a name.");
  if (c.kind === "percent" && !(c.percentOff! > 0 && c.percentOff! <= 100)) throw new PromotionError("Percent off must be between 1 and 100.");
  if (c.kind === "amount" && !(c.amountOffCents! >= 1 && c.amountOffCents! <= 10_000_00)) throw new PromotionError("Amount off must be between $0.01 and $10,000.");
  if (c.startsAt && c.endsAt && c.endsAt <= c.startsAt) throw new PromotionError("The end date must be after the start date.");
  if (c.mode === "code") {
    if (!c.code) {
      if (forPublish) throw new PromotionError("Choose the code customers will type, for example LAUNCH20.");
    } else {
      if (!CODE_RE.test(c.code)) throw new PromotionError("Codes are 3 to 32 characters: letters, digits, dash or underscore. Example: LAUNCH20.");
      const clash = await prisma.promotion.findFirst({
        where: { code: { equals: c.code, mode: "insensitive" }, state: { in: ["draft", "published", "paused"] }, ...(selfId ? { NOT: { id: selfId } } : {}) },
        select: { name: true },
      });
      if (clash) throw new PromotionError(`The code ${c.code} is already used by "${clash.name}". Choose another code, or end that promotion first.`, 409);
    }
  }
  if (forPublish) {
    if (c.scope.length === 0) throw new PromotionError("Choose at least one thing this promotion applies to.");
    for (const s of c.scope) if (s.ids && s.ids.length === 0) delete s.ids;
    if (c.endsAt && c.endsAt.getTime() <= Date.now()) throw new PromotionError("The end date is in the past. Change it or clear it before publishing.");
  }
}

function sameMoney(a: Pick<PromotionRecord, "kind" | "percentOff" | "amountOffCents" | "duration" | "durationMonths">, b: Clean) {
  return a.kind === b.kind && (a.percentOff ?? null) === (b.percentOff ?? null) && (a.amountOffCents ?? null) === (b.amountOffCents ?? null) &&
    a.duration === b.duration && (a.durationMonths ?? null) === (b.durationMonths ?? null);
}

function sameCodeRules(a: PromotionRecord, b: Clean) {
  const t = (d: Date | null) => (d ? d.getTime() : null);
  return a.mode === b.mode && a.code === b.code && t(a.endsAt) === t(b.endsAt) && a.maxRedemptions === b.maxRedemptions &&
    a.firstTimeOnly === b.firstTimeOnly && a.minimumCents === b.minimumCents;
}

function dataOf(c: Clean) {
  return { ...c, scope: c.scope as unknown as Prisma.InputJsonValue };
}

export async function createPromotion(input: PromotionInput, by: string): Promise<PromotionRecord> {
  await ensurePromotionTables();
  const c = normaliseInput(input);
  await checkInput(c, null, false);
  const id = randomUUID();
  await prisma.promotion.create({ data: { id, ...dataOf(c), state: "draft", createdBy: by } });
  invalidatePromotions();
  return (await getPromotion(id))!;
}

/** Thrown when a save would replace the Stripe coupon; the admin confirms and resends. */
export class NeedsConfirm extends PromotionError {
  constructor() {
    super("Changing the amount, type or duration of a published promotion archives its Stripe coupon and creates a new one. Customers who already redeemed it keep their discount.", 409);
  }
}

export async function updatePromotion(id: string, input: PromotionInput, opts: { confirmRecreate?: boolean }): Promise<{ promo: PromotionRecord; recreated: boolean; changes: string[] }> {
  await ensurePromotionTables();
  const cur = await getPromotion(id);
  if (!cur) throw new PromotionError("Promotion not found.", 404);
  if (cur.state === "ended") throw new PromotionError("This promotion has ended. Duplicate it to run it again.", 409);
  const c = normaliseInput(input);
  const onStripe = cur.state !== "draft" && !!cur.stripeCouponId;
  await checkInput(c, id, onStripe);

  const changes: string[] = [];
  let recreated = false;
  let couponId = cur.stripeCouponId;
  let codeId = cur.stripePromotionCodeId;
  let codeActive = cur.stripeCodeActive;

  if (onStripe) {
    const moneyChanged = !sameMoney(cur, c);
    if (moneyChanged && !opts.confirmRecreate) throw new NeedsConfirm();
    const liveAfter = cur.state === "published" && promoStatus({ ...cur, ...c, state: "published" }) === "live";

    if (moneyChanged) {
      const fresh = await createCoupon({ name: c.name, kind: c.kind, percentOff: c.percentOff, amountOffCents: c.amountOffCents, duration: c.duration, durationMonths: c.durationMonths, metadata: { promotionId: id } });
      if (codeId) await setPromotionCodeActive(codeId, false);
      codeId = null;
      codeActive = false;
      if (c.mode === "code" && c.code) {
        codeId = await createPromotionCode({ couponId: fresh, code: c.code, active: liveAfter, expiresAt: c.endsAt, maxRedemptions: remaining(c.maxRedemptions, cur.redemptionCount), firstTimeOnly: c.firstTimeOnly, minimumCents: c.minimumCents, promotionId: id });
        codeActive = liveAfter;
      }
      await archiveCoupon(cur.stripeCouponId!).catch((err) => console.error("[promotions] archive", err));
      couponId = fresh;
      recreated = true;
      changes.push("coupon recreated");
    } else {
      if (cur.name !== c.name) await renameCoupon(cur.stripeCouponId!, c.name).catch((err) => console.error("[promotions] rename", err));
      if (!sameCodeRules(cur, c)) {
        // Stripe promotion codes cannot change their code or restrictions: retire and replace.
        if (codeId) await setPromotionCodeActive(codeId, false);
        codeId = null;
        codeActive = false;
        if (c.mode === "code" && c.code) {
          try {
            codeId = await createPromotionCode({ couponId: cur.stripeCouponId!, code: c.code, active: liveAfter, expiresAt: c.endsAt, maxRedemptions: remaining(c.maxRedemptions, cur.redemptionCount), firstTimeOnly: c.firstTimeOnly, minimumCents: c.minimumCents, promotionId: id });
            codeActive = liveAfter;
          } catch (err) {
            if (cur.stripePromotionCodeId) await setPromotionCodeActive(cur.stripePromotionCodeId, cur.stripeCodeActive).catch(() => {});
            throw err;
          }
        }
        changes.push("promotion code replaced");
      } else if (codeId && codeActive !== liveAfter) {
        await setPromotionCodeActive(codeId, liveAfter);
        codeActive = liveAfter;
      }
    }
  }

  for (const k of ["name", "kind", "percentOff", "amountOffCents", "duration", "durationMonths", "mode", "code", "maxRedemptions", "firstTimeOnly", "minimumCents"] as const) {
    if ((cur as unknown as Record<string, unknown>)[k] !== (c as Record<string, unknown>)[k]) changes.push(k);
  }
  if (JSON.stringify(cur.scope) !== JSON.stringify(c.scope)) changes.push("scope");
  if ((cur.startsAt?.getTime() ?? null) !== (c.startsAt?.getTime() ?? null) || (cur.endsAt?.getTime() ?? null) !== (c.endsAt?.getTime() ?? null)) changes.push("dates");
  if (cur.bannerEn !== c.bannerEn || cur.bannerFr !== c.bannerFr || cur.bannerSw !== c.bannerSw) changes.push("banner");

  await prisma.promotion.update({
    where: { id },
    data: { ...dataOf(c), stripeCouponId: couponId, stripePromotionCodeId: codeId, stripeCodeActive: codeActive, updatedAt: new Date() },
  });
  invalidatePromotions();
  return { promo: (await getPromotion(id))!, recreated, changes };
}

function remaining(max: number | null, used: number): number | null {
  if (max == null) return null;
  return Math.max(1, max - used);
}

export async function publishPromotion(id: string): Promise<PromotionRecord> {
  await ensurePromotionTables();
  const cur = await getPromotion(id);
  if (!cur) throw new PromotionError("Promotion not found.", 404);
  if (cur.state === "ended") throw new PromotionError("This promotion has ended. Duplicate it to run it again.", 409);
  if (!process.env.STRIPE_SECRET_KEY) throw new PromotionError("Stripe is not configured (STRIPE_SECRET_KEY is missing), so nothing can be published.", 503);
  const c = normaliseInput(cur);
  await checkInput(c, id, true);

  const liveNow = promoStatus({ ...cur, state: "published" }) === "live";
  let couponId = cur.stripeCouponId;
  if (!couponId) {
    couponId = await createCoupon({ name: cur.name, kind: cur.kind, percentOff: cur.percentOff, amountOffCents: cur.amountOffCents, duration: cur.duration, durationMonths: cur.durationMonths, metadata: { promotionId: id } });
    await prisma.promotion.update({ where: { id }, data: { stripeCouponId: couponId } });
  }
  let codeId = cur.stripePromotionCodeId;
  let codeActive = cur.stripeCodeActive;
  if (cur.mode === "code") {
    if (!codeId) {
      codeId = await createPromotionCode({ couponId, code: cur.code!, active: liveNow, expiresAt: cur.endsAt, maxRedemptions: remaining(cur.maxRedemptions, cur.redemptionCount), firstTimeOnly: cur.firstTimeOnly, minimumCents: cur.minimumCents, promotionId: id });
    } else if (codeActive !== liveNow) {
      await setPromotionCodeActive(codeId, liveNow);
    }
    codeActive = liveNow;
  }
  await prisma.promotion.update({
    where: { id },
    data: { state: "published", stripePromotionCodeId: codeId, stripeCodeActive: codeActive, publishedAt: cur.publishedAt ?? new Date(), endedAt: null, updatedAt: new Date() },
  });
  invalidatePromotions();
  return (await getPromotion(id))!;
}

/** Pause (state "paused") or end now (state "ended"): the code stops in Stripe and auto-apply stops at once. */
export async function stopPromotion(id: string, how: "paused" | "ended"): Promise<PromotionRecord> {
  await ensurePromotionTables();
  const cur = await getPromotion(id);
  if (!cur) throw new PromotionError("Promotion not found.", 404);
  if (cur.state === "ended") throw new PromotionError("This promotion has already ended.", 409);
  if (how === "paused" && cur.state !== "published") throw new PromotionError("Only a published promotion can be paused.", 409);
  if (cur.stripePromotionCodeId && cur.stripeCodeActive) await setPromotionCodeActive(cur.stripePromotionCodeId, false);
  await prisma.promotion.update({
    where: { id },
    data: { state: how, stripeCodeActive: false, ...(how === "ended" ? { endedAt: new Date() } : {}), updatedAt: new Date() },
  });
  invalidatePromotions();
  return (await getPromotion(id))!;
}

export async function duplicatePromotion(id: string, by: string): Promise<PromotionRecord> {
  const cur = await getPromotion(id);
  if (!cur) throw new PromotionError("Promotion not found.", 404);
  const newId = randomUUID();
  await prisma.promotion.create({
    data: {
      id: newId,
      ...dataOf(normaliseInput({ ...cur, name: `Copy of ${cur.name}`.slice(0, 120), code: null })),
      state: "draft",
      createdBy: by,
    },
  });
  invalidatePromotions();
  return (await getPromotion(newId))!;
}

export async function deleteDraft(id: string): Promise<void> {
  const cur = await getPromotion(id);
  if (!cur) throw new PromotionError("Promotion not found.", 404);
  if (cur.state !== "draft" || cur.stripeCouponId) throw new PromotionError("Only a draft that was never published can be deleted. End it instead.", 409);
  await prisma.promotion.delete({ where: { id } });
  invalidatePromotions();
}

// ── Eligibility ────────────────────────────────────────────────────────────

export interface Buyer {
  studentId?: string | null;
  email?: string | null;
}

/** No earlier paid purchase of anything we sell, by this learner or email. */
export async function isFirstTimeCustomer(b: Buyer): Promise<boolean | null> {
  const email = b.email?.trim().toLowerCase() || null;
  if (!b.studentId && !email) return null;
  const checks: Promise<number>[] = [];
  const n = (p: Promise<number>) => p.catch(() => 0);
  if (b.studentId) {
    checks.push(n(prisma.learnSubscription.count({ where: { studentId: b.studentId, stripeSubscriptionId: { not: null } } })));
    checks.push(n(prisma.trackPurchase.count({ where: { studentId: b.studentId } })));
    checks.push(n(prisma.toolkitSubscription.count({ where: { studentId: b.studentId, stripeSubscriptionId: { not: null } } })));
  }
  if (email) {
    checks.push(n(prisma.order.count({ where: { email: { equals: email, mode: "insensitive" }, status: { in: ["paid", "fulfilled"] } } })));
    checks.push(n(prisma.promotionRedemption.count({ where: { email: { equals: email, mode: "insensitive" } } })));
  }
  const counts = await Promise.all(checks);
  return counts.every((c) => c === 0);
}

export type RejectReason = "invalid" | "notStarted" | "expired" | "usedUp" | "scope" | "firstTime" | "minimum";

export class CodeRejected extends Error {
  constructor(readonly reason: RejectReason, readonly minimumCents?: number | null) {
    super(`Promotion code rejected: ${reason}`);
  }
}

/** Checks a code typed by a customer against these lines. Throws CodeRejected. */
export async function checkCode(rawCode: string, lines: CheckoutLine[], buyer: Buyer): Promise<{ promo: PromotionRecord; quote: DiscountQuote }> {
  const code = normaliseCode(rawCode);
  if (!CODE_RE.test(code)) throw new CodeRejected("invalid");
  const promos = await activePromotions();
  const promo = promos.find((p) => p.mode === "code" && p.code && p.code.toUpperCase() === code);
  if (!promo) {
    // An ended or paused code says so, rather than "not found".
    await ensurePromotionTables();
    const old = await prisma.promotion.findFirst({ where: { code: { equals: code, mode: "insensitive" }, state: { in: ["ended", "paused"] } }, select: { id: true } });
    throw new CodeRejected(old ? "expired" : "invalid");
  }
  const status = promoStatus(promo);
  if (status === "scheduled") throw new CodeRejected("notStarted");
  if (status === "ended") {
    throw new CodeRejected(promo.maxRedemptions != null && promo.redemptionCount >= promo.maxRedemptions ? "usedUp" : "expired");
  }
  if (status !== "live") throw new CodeRejected("invalid");
  const quote = quoteDiscount(promo, lines);
  if (quote.eligibleCents <= 0) throw new CodeRejected("scope");
  if (promo.minimumCents && quote.subtotalCents < promo.minimumCents) throw new CodeRejected("minimum", promo.minimumCents);
  if (promo.firstTimeOnly && (await isFirstTimeCustomer(buyer)) !== true) throw new CodeRejected("firstTime");
  if (quote.discountCents <= 0) throw new CodeRejected("minimum");
  return { promo, quote };
}

/** The best live automatic sale for these lines, if any. */
async function bestAutoSale(lines: CheckoutLine[], buyer: Buyer): Promise<{ promo: PromotionRecord; quote: DiscountQuote } | null> {
  const promos = (await activePromotions()).filter((p) => p.mode === "auto" && promoStatus(p) === "live");
  let best: { promo: PromotionRecord; quote: DiscountQuote } | null = null;
  let firstTime: boolean | null | undefined;
  for (const promo of promos) {
    const quote = quoteDiscount(promo, lines);
    if (quote.discountCents <= 0) continue;
    if (promo.minimumCents && quote.subtotalCents < promo.minimumCents) continue;
    if (promo.firstTimeOnly) {
      firstTime ??= await isFirstTimeCustomer(buyer);
      if (firstTime !== true) continue;
    }
    if (!best || quote.discountCents > best.quote.discountCents) best = { promo, quote };
  }
  return best;
}

// ── Checkout ───────────────────────────────────────────────────────────────

export interface CheckoutDiscountInput {
  lines: CheckoutLine[];
  /** A subscription checkout (the coupon's duration matters). */
  recurring: boolean;
  /** A code the customer typed in our field. Invalid: CodeRejected is thrown. */
  code?: string | null;
  buyer?: Buyer;
  /** Referral welcome coupon, claimed only when nothing else applies. */
  referral?: () => Promise<string | null>;
}

export interface CheckoutDiscount {
  couponId: string | null;
  allowPromotionCodes: boolean;
  /** Goes on the Checkout Session; the webhook records the redemption from it. */
  metadata: Record<string, string>;
  discountCents: number;
}

export async function resolveCheckoutDiscount(input: CheckoutDiscountInput): Promise<CheckoutDiscount> {
  const buyer = input.buyer ?? {};
  let chosen: { promo: PromotionRecord; quote: DiscountQuote; source: "code" | "auto" } | null = null;
  if (input.code && input.code.trim()) {
    const hit = await checkCode(input.code, input.lines, buyer);
    chosen = { ...hit, source: "code" };
  } else {
    const hit = await bestAutoSale(input.lines, buyer).catch((err) => {
      console.error("[promotions] auto sale lookup", err);
      return null;
    });
    if (hit) chosen = { ...hit, source: "auto" };
  }

  if (chosen) {
    const couponId = await couponFor(chosen.promo, chosen.quote, input.recurring);
    return {
      couponId,
      allowPromotionCodes: false,
      discountCents: chosen.quote.discountCents,
      metadata: {
        promotionId: chosen.promo.id,
        promoSource: chosen.source,
        ...(chosen.source === "code" && chosen.promo.code ? { promoCode: chosen.promo.code } : {}),
      },
    };
  }

  const referral = input.referral ? await input.referral() : null;
  if (referral) return { couponId: referral, allowPromotionCodes: false, discountCents: 0, metadata: { promoSource: "referral" } };
  return { couponId: null, allowPromotionCodes: await stripeCodeBoxAllowed(input.lines), discountCents: 0, metadata: {} };
}

/** The promotion's coupon when it gives exactly the quote; otherwise a single-use coupon for the exact amount. */
async function couponFor(p: PromotionRecord, q: DiscountQuote, recurring: boolean): Promise<string> {
  if (q.exact && p.stripeCouponId) return p.stripeCouponId;
  return createCoupon({
    name: p.name,
    kind: "amount",
    amountOffCents: q.discountCents,
    duration: recurring ? p.duration : "once",
    durationMonths: p.durationMonths,
    maxRedemptions: 1,
    redeemBy: new Date(Date.now() + 2 * 86_400_000),
    metadata: { promotionId: p.id, oneOff: "1" },
  });
}

/**
 * Stripe's promotion code box: on only when every live code-mode promotion
 * covers every line (Stripe cannot restrict a code to our items).
 * STRIPE_ALLOW_DASHBOARD_PROMO_CODES=true keeps the box when no admin code is
 * live, for codes made directly in the Stripe dashboard.
 */
export async function stripeCodeBoxAllowed(lines: CheckoutLine[]): Promise<boolean> {
  const promos = await activePromotionsSafe();
  const live = promos.filter((p) => p.mode === "code" && p.stripePromotionCodeId && promoStatus(p) === "live");
  if (live.length === 0) return process.env.STRIPE_ALLOW_DASHBOARD_PROMO_CODES === "true";
  return lines.length > 0 && live.every((p) => lines.every((l) => scopeCoversLine(p.scope, l)));
}

// ── Public display ─────────────────────────────────────────────────────────

/**
 * The live automatic sale price for single items, read on the server. Use
 * `sale(line)` per item. First-time-only sales show to everyone; checkout
 * decides. Never throws.
 */
export async function saleContext(): Promise<{ sale: (line: CheckoutLine) => SaleView | null; any: boolean }> {
  const promos = (await activePromotionsSafe()).filter((p) => p.mode === "auto" && promoStatus(p) === "live");
  return {
    any: promos.length > 0,
    sale(line) {
      let best: SaleView | null = null;
      for (const p of promos) {
        const q = quoteDiscount(p, [line]);
        if (q.discountCents <= 0 || (p.minimumCents && q.subtotalCents < p.minimumCents)) continue;
        if (!best || line.amountCents - q.discountCents < best.saleCents) {
          best = { promotionId: p.id, saleCents: line.amountCents - q.discountCents, originalCents: line.amountCents, duration: p.duration, durationMonths: p.durationMonths };
        }
      }
      return best;
    },
  };
}

/** Banner text for a live promotion, in the visitor's language (English fills gaps). */
export async function liveBanner(locale: string): Promise<{ id: string; text: string } | null> {
  const promos = (await activePromotionsSafe()).filter((p) => p.bannerEn && promoStatus(p) === "live");
  const p = promos[0];
  if (!p) return null;
  const text = (locale === "fr" ? p.bannerFr : locale === "sw" ? p.bannerSw : null) || p.bannerEn!;
  return { id: p.id, text };
}

// ── Redemptions (Stripe webhook) ───────────────────────────────────────────

/** Records a paid checkout that carried a discount. Idempotent per session. Never throws. */
export async function recordRedemption(session: Stripe.Checkout.Session): Promise<void> {
  try {
    const discount = session.total_details?.amount_discount ?? 0;
    if (!(discount > 0)) return;
    await ensurePromotionTables();
    let promotionId = session.metadata?.promotionId || null;
    let source = session.metadata?.promoSource || "auto";
    if (session.metadata?.promoSource === "referral") return;
    if (!promotionId) {
      // A code typed on Stripe's own page: find which one.
      const full = await stripe.checkout.sessions.retrieve(session.id, { expand: ["total_details.breakdown"] });
      const d = full.total_details?.breakdown?.discounts?.[0]?.discount;
      const coupon = d?.coupon;
      const codeId = typeof d?.promotion_code === "string" ? d.promotion_code : d?.promotion_code?.id ?? null;
      const hit = await prisma.promotion.findFirst({
        where: { OR: [...(codeId ? [{ stripePromotionCodeId: codeId }] : []), ...(coupon?.id ? [{ stripeCouponId: coupon.id }] : [])] },
        select: { id: true },
      });
      promotionId = hit?.id ?? coupon?.metadata?.promotionId ?? null;
      source = "stripe_code";
    }
    if (!promotionId) return;
    const meta = session.metadata ?? {};
    const product = meta.product || (meta.orderId ? "store" : meta.registrationId ? "event" : meta.appointmentId ? "appointment" : null);
    await prisma.promotionRedemption.createMany({
      data: [{
        id: randomUUID(),
        promotionId,
        stripeSessionId: session.id,
        source,
        product,
        email: (session.customer_details?.email ?? session.customer_email ?? null)?.toLowerCase() ?? null,
        studentId: meta.studentId || meta.ownerStudentId || null,
        subtotalCents: session.amount_subtotal ?? 0,
        discountCents: discount,
        totalCents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
      }],
      skipDuplicates: true,
    });
    invalidatePromotions();
  } catch (err) {
    console.error("[promotions] record redemption", err instanceof Error ? err.message : err);
  }
}

export interface RedemptionRow {
  id: string;
  promotionId: string;
  stripeSessionId: string;
  source: string;
  product: string | null;
  email: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: Date;
}

export async function listRedemptions(promotionId: string, take = 200): Promise<RedemptionRow[]> {
  await ensurePromotionTables();
  return prisma.promotionRedemption.findMany({ where: { promotionId }, orderBy: { createdAt: "desc" }, take });
}

export async function redemptionTotals(): Promise<Map<string, { revenue: number; discount: number }>> {
  await ensurePromotionTables();
  const rows = await prisma.promotionRedemption.groupBy({ by: ["promotionId"], _sum: { totalCents: true, discountCents: true } });
  return new Map(rows.map((r) => [r.promotionId, { revenue: r._sum.totalCents ?? 0, discount: r._sum.discountCents ?? 0 }]));
}

// ── Referral welcome discount (overrides STRIPE_REFERRAL_COUPON_ID) ────────

export interface ReferralSetting {
  enabled: boolean;
  couponId: string;
  kind: PromoKind;
  percentOff: number | null;
  amountOffCents: number | null;
  duration: PromoDuration;
  durationMonths: number | null;
  updatedAt?: string;
  updatedBy?: string | null;
}

export async function getReferralSetting(): Promise<ReferralSetting | null> {
  if (settingsCache && Date.now() - settingsCache.at < CACHE_MS) return settingsCache.referral;
  await ensurePromotionTables();
  const row = await prisma.promotionSetting.findUnique({ where: { key: "referral" } });
  const v = (row?.value ?? null) as ReferralSetting | null;
  const referral = v && typeof v.couponId === "string" ? { ...v, updatedAt: row!.updatedAt.toISOString(), updatedBy: row!.updatedBy } : null;
  settingsCache = { at: Date.now(), referral };
  return referral;
}

/** The referral coupon to use: the admin setting when on, else STRIPE_REFERRAL_COUPON_ID. */
export async function effectiveReferralCouponId(envFallback: () => string | null): Promise<string | null> {
  try {
    const s = await getReferralSetting();
    if (s?.enabled && s.couponId) return s.couponId;
  } catch (err) {
    console.error("[promotions] referral setting", err instanceof Error ? err.message : err);
  }
  return envFallback();
}

export async function saveReferralSetting(
  input: { kind: PromoKind; percentOff?: number | null; amountOffCents?: number | null; duration: PromoDuration; durationMonths?: number | null },
  by: string,
): Promise<ReferralSetting> {
  await ensurePromotionTables();
  const kind = input.kind;
  const percentOff = kind === "percent" ? Math.round(Number(input.percentOff) * 100) / 100 : null;
  const amountOffCents = kind === "amount" ? Math.round(Number(input.amountOffCents)) : null;
  if (kind === "percent" && !(percentOff! > 0 && percentOff! <= 100)) throw new PromotionError("Percent off must be between 1 and 100.");
  if (kind === "amount" && !(amountOffCents! >= 1)) throw new PromotionError("Enter an amount off.");
  const durationMonths = input.duration === "repeating" ? Math.max(1, Math.min(36, Math.round(Number(input.durationMonths) || 1))) : null;
  const couponId = await createCoupon({
    name: "Referral welcome",
    kind,
    percentOff,
    amountOffCents,
    duration: input.duration,
    durationMonths,
    metadata: { purpose: "referral-welcome" },
  });
  const value: ReferralSetting = { enabled: true, couponId, kind, percentOff, amountOffCents, duration: input.duration, durationMonths };
  await prisma.promotionSetting.upsert({
    where: { key: "referral" },
    create: { key: "referral", value: value as unknown as Prisma.InputJsonValue, updatedBy: by },
    update: { value: value as unknown as Prisma.InputJsonValue, updatedBy: by, updatedAt: new Date() },
  });
  invalidatePromotions();
  return (await getReferralSetting())!;
}

export async function disableReferralSetting(by: string): Promise<void> {
  await ensurePromotionTables();
  const cur = await getReferralSetting();
  if (!cur) return;
  await prisma.promotionSetting.update({
    where: { key: "referral" },
    data: { value: { ...cur, enabled: false, updatedAt: undefined, updatedBy: undefined } as unknown as Prisma.InputJsonValue, updatedBy: by, updatedAt: new Date() },
  });
  invalidatePromotions();
}
