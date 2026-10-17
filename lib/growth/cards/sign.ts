import { createHmac, timingSafeEqual } from "crypto";
import { siteUrl } from "../links";

// Publishing platforms fetch a post's image card without a session (Facebook
// reads it by URL), so a post card URL can carry a signature instead. The
// signature covers the post and the slide only; the card shows copy that is
// about to be published anyway.

function secret(): string {
  return process.env.GROWTH_CARD_SECRET || process.env.NEXTAUTH_SECRET || "tib-growth-cards";
}

export function cardSig(postId: string, slide: number): string {
  return createHmac("sha256", secret()).update(`growth-card:${postId}:${slide}`).digest("base64url").slice(0, 32);
}

export function verifyCardSig(postId: string, slide: number, sig: string | null): boolean {
  if (!sig) return false;
  const a = Buffer.from(cardSig(postId, slide));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Absolute, signed URL of a post's card (what a platform downloads). */
export function signedCardUrl(postId: string, slide = 0): string {
  return `${siteUrl()}/api/admin/growth/cards/post/${encodeURIComponent(postId)}?slide=${slide}&sig=${cardSig(postId, slide)}`;
}
