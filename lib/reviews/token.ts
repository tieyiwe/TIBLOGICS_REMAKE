// Signed, expiring review links: /review?t=TOKEN.
//
// Only people TIBLOGICS invited (a client after a session, a learner with a
// certificate, someone staff invited by hand) can leave a review. The token
// carries who they are (email, name), what they are reviewing (source) and
// the language of the invitation, signed with NEXTAUTH_SECRET (HMAC-SHA256)
// and valid for 60 days. Nothing is stored for the link itself; the invite is
// tracked separately (ReviewInvite) so the same person is never invited twice.
//
// The payload is signed, not encrypted: it holds only the invitee's own
// details, and the link is only ever sent to that invitee.
import { createHmac, timingSafeEqual } from "crypto";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { REVIEW_SOURCES, type ReviewSource } from "./types";

export const REVIEW_LINK_DAYS = 60;
const DAY_MS = 86_400_000;

export interface ReviewInviteClaims {
  email: string;
  name: string;
  source: ReviewSource;
  locale: Locale;
  /** Expiry, ms since epoch. */
  exp: number;
}

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`review-invite:${payload}`).digest("base64url");
}

export function signReviewToken(c: { email: string; name: string; source: ReviewSource; locale: Locale }, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ e: c.email.trim().toLowerCase(), n: c.name.trim().slice(0, 80), s: c.source, l: c.locale, x: now + REVIEW_LINK_DAYS * DAY_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export type TokenCheck = { ok: true; claims: ReviewInviteClaims } | { ok: false; reason: "invalid" | "expired" };

/** Verifies the signature first, then the expiry. Never throws. */
export function verifyReviewToken(token: unknown, now = Date.now()): TokenCheck {
  if (typeof token !== "string" || token.length < 20 || token.length > 1200) return { ok: false, reason: "invalid" };
  const dot = token.indexOf(".");
  if (dot < 1 || dot !== token.lastIndexOf(".")) return { ok: false, reason: "invalid" };
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let want: Buffer;
  try {
    want = Buffer.from(sign(payload));
  } catch {
    return { ok: false, reason: "invalid" };
  }
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return { ok: false, reason: "invalid" };
  let raw: { e?: unknown; n?: unknown; s?: unknown; l?: unknown; x?: unknown };
  try {
    raw = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (
    typeof raw.e !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.e) ||
    typeof raw.n !== "string" ||
    typeof raw.s !== "string" || !(REVIEW_SOURCES as readonly string[]).includes(raw.s) ||
    typeof raw.x !== "number"
  ) {
    return { ok: false, reason: "invalid" };
  }
  if (raw.x < now) return { ok: false, reason: "expired" };
  return {
    ok: true,
    claims: { email: raw.e, name: raw.n, source: raw.s as ReviewSource, locale: isLocale(raw.l) ? raw.l : "en", exp: raw.x },
  };
}
