// Promotions: types, status and discount math shared by the server, the
// admin editor and the public price displays. Client-safe (no database, no
// Stripe). Server logic lives in lib/promotions/service.ts.

/** What a promotion can apply to. Each checkout line carries one of these. */
export const SCOPE_KEYS = ["arfa_monthly", "tracks", "team", "store", "toolkit", "blueprint", "events"] as const;
export type ScopeKey = (typeof SCOPE_KEYS)[number];

export const SCOPE_LABELS: Record<ScopeKey, string> = {
  arfa_monthly: "ARFA monthly plan",
  tracks: "ARFA track purchases",
  team: "ARFA team seats",
  store: "Store products",
  toolkit: "Toolkit Live",
  blueprint: "Automation Blueprint",
  events: "Events",
};

/** Keys that can be narrowed to selected ids (tracks, products). */
export const SCOPE_WITH_IDS: ScopeKey[] = ["tracks", "store"];

/** One scope entry. `ids` empty or missing: everything of that kind. */
export interface ScopeEntry {
  key: ScopeKey;
  ids?: string[];
}

export type PromoKind = "percent" | "amount";
export type PromoDuration = "once" | "repeating" | "forever";
export type PromoMode = "code" | "auto";
/** Stored state. "Live" and "Scheduled" are computed from it and the dates. */
export type PromoState = "draft" | "published" | "paused" | "ended";
export type PromoStatus = "draft" | "scheduled" | "live" | "ended" | "paused";

export interface PromotionRecord {
  id: string;
  name: string;
  state: PromoState;
  kind: PromoKind;
  percentOff: number | null;
  amountOffCents: number | null;
  duration: PromoDuration;
  durationMonths: number | null;
  scope: ScopeEntry[];
  mode: PromoMode;
  code: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  firstTimeOnly: boolean;
  minimumCents: number | null;
  bannerEn: string | null;
  bannerFr: string | null;
  bannerSw: string | null;
  stripeCouponId: string | null;
  stripePromotionCodeId: string | null;
  stripeCodeActive: boolean;
  redemptionCount: number;
  publishedAt: Date | null;
  endedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Stripe's smallest USD charge. No discount takes a checkout below it. */
export const STRIPE_MIN_CENTS = 50;

/** Promotion codes: 3 to 32 characters, letters, digits, dash, underscore. Stored uppercase. */
export const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

export function normaliseCode(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toUpperCase();
}

export function promoStatus(p: Pick<PromotionRecord, "state" | "startsAt" | "endsAt" | "maxRedemptions" | "redemptionCount">, now = new Date()): PromoStatus {
  if (p.state === "draft") return "draft";
  if (p.state === "paused") return "paused";
  if (p.state === "ended") return "ended";
  if (p.endsAt && p.endsAt.getTime() <= now.getTime()) return "ended";
  if (p.maxRedemptions != null && p.redemptionCount >= p.maxRedemptions) return "ended";
  if (p.startsAt && p.startsAt.getTime() > now.getTime()) return "scheduled";
  return "live";
}

/** "20% off", "$15 off". */
export function discountLabel(p: Pick<PromotionRecord, "kind" | "percentOff" | "amountOffCents">): string {
  if (p.kind === "percent") return `${Number(p.percentOff ?? 0).toString()}% off`;
  return `${fmtUsd(p.amountOffCents ?? 0)} off`;
}

export function durationLabel(p: Pick<PromotionRecord, "duration" | "durationMonths">): string {
  if (p.duration === "forever") return "every billing period";
  if (p.duration === "repeating") return `for ${p.durationMonths ?? 1} month${p.durationMonths === 1 ? "" : "s"}`;
  return "once";
}

export function fmtUsd(cents: number): string {
  const v = cents / 100;
  return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}

/** A checkout line: what is bought and its pre-discount total in cents. */
export interface CheckoutLine {
  key: ScopeKey | "other";
  /** Track id, product id, plan id, event slug. */
  id?: string | null;
  /** Line total (unit x quantity), cents. */
  amountCents: number;
}

export function scopeCoversLine(scope: ScopeEntry[], line: CheckoutLine): boolean {
  if (line.key === "other") return false;
  const e = scope.find((s) => s.key === line.key);
  if (!e) return false;
  if (!e.ids || e.ids.length === 0) return true;
  return !!line.id && e.ids.includes(line.id);
}

export interface DiscountQuote {
  /** Sum of the lines this promotion covers. */
  eligibleCents: number;
  /** Whole checkout before the discount. */
  subtotalCents: number;
  /** What comes off, after the $0.50 floor. 0: does not apply. */
  discountCents: number;
  /** Every line covered and no floor cap: the promotion's own coupon gives exactly this. */
  exact: boolean;
}

/** The discount a promotion gives on these lines, never taking the total below $0.50. */
export function quoteDiscount(
  p: Pick<PromotionRecord, "kind" | "percentOff" | "amountOffCents" | "scope">,
  lines: CheckoutLine[],
): DiscountQuote {
  const subtotalCents = lines.reduce((n, l) => n + Math.max(0, Math.round(l.amountCents)), 0);
  const covered = lines.filter((l) => scopeCoversLine(p.scope, l));
  const eligibleCents = covered.reduce((n, l) => n + Math.max(0, Math.round(l.amountCents)), 0);
  if (eligibleCents <= 0) return { eligibleCents, subtotalCents, discountCents: 0, exact: false };
  const raw =
    p.kind === "percent"
      ? Math.round((eligibleCents * Math.min(100, Math.max(0, p.percentOff ?? 0))) / 100)
      : Math.min(Math.max(0, p.amountOffCents ?? 0), eligibleCents);
  const cap = Math.max(0, subtotalCents - STRIPE_MIN_CENTS);
  const discountCents = Math.max(0, Math.min(raw, cap));
  return { eligibleCents, subtotalCents, discountCents, exact: covered.length === lines.length && raw <= cap };
}

/** A public sale price for one item, for display (the server recomputes at checkout). */
export interface SaleView {
  promotionId: string;
  /** Price after the sale, cents. */
  saleCents: number;
  /** Price before, cents (struck through). */
  originalCents: number;
  /** For subscriptions: "once" | "repeating" | "forever". */
  duration: PromoDuration;
  durationMonths: number | null;
}

// ── Time zone: the admin works in Toronto time ────────────────────────────

export const PROMO_TZ = "America/Toronto";

function tzParts(d: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute, s: +o.second };
}

/** Date to "YYYY-MM-DDTHH:mm" wall time in Toronto (for <input type="datetime-local">). */
export function toZonedInput(d: Date | null | undefined, tz = PROMO_TZ): string {
  if (!d) return "";
  const p = tzParts(d, tz);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

/** "YYYY-MM-DDTHH:mm" read as Toronto wall time, to a Date. Null when blank or invalid. */
export function fromZonedInput(v: string | null | undefined, tz = PROMO_TZ): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(v ?? "").trim());
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let guess = wall;
  for (let i = 0; i < 3; i++) {
    const p = tzParts(new Date(guess), tz);
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    guess += wall - seen;
  }
  const out = new Date(guess);
  return Number.isNaN(out.getTime()) ? null : out;
}

/** "Oct 3, 2026, 9:00 AM" in Toronto time. */
export function fmtZoned(d: Date | string | null | undefined, tz = PROMO_TZ): string {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleString("en-CA", { timeZone: tz, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
