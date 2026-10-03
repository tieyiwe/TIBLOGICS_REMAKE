import { createHmac } from "crypto";
import { SITE_URL } from "@/lib/seo/site";

// Share previews unique to each page: a card drawn from the page's own title,
// description and section (app/og/card). The values travel in the URL and
// are signed, so the route never draws text that did not come from this
// site (nobody can make "tiblogics.com" cards that say something else).

export type CardBrand = "tib" | "arfa";

export interface CardInput {
  title: string;
  description?: string;
  /** Small label over the title: the section ("Services", "Free AI tools"). */
  kicker?: string;
  brand?: CardBrand;
}

/** Bump when the card design changes, so social sites fetch the new one. */
const DESIGN = "1";

function secret(): string {
  return process.env.OG_CARD_SECRET || process.env.NEXTAUTH_SECRET || "tiblogics-og";
}

const clean = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);

function payload(c: Required<Pick<CardInput, "title">> & CardInput): string {
  return [DESIGN, c.brand ?? "tib", clean(c.kicker ?? "", 40), clean(c.title, 140), clean(c.description ?? "", 220)].join("\n");
}

export function signCard(c: CardInput): string {
  return createHmac("sha256", secret()).update(payload(c)).digest("base64url").slice(0, 22);
}

export function verifyCard(c: CardInput, sig: string | null): boolean {
  if (!sig) return false;
  const want = signCard(c);
  if (want.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

/** The absolute URL of the page's card, ready for og:image. */
export function cardUrl(c: CardInput): string {
  const q = new URLSearchParams();
  q.set("t", clean(c.title, 140));
  if (c.description) q.set("d", clean(c.description, 220));
  if (c.kicker) q.set("k", clean(c.kicker, 40));
  if (c.brand && c.brand !== "tib") q.set("b", c.brand);
  q.set("v", DESIGN);
  q.set("s", signCard(c));
  return `${SITE_URL}/og/card?${q.toString()}`;
}

/** The section label for a path (used when a page does not name one). */
export function kickerFor(path: string): { kicker: string; brand: CardBrand } {
  const seg = path.split("?")[0].split("/").filter(Boolean)[0] ?? "";
  const map: Record<string, { kicker: string; brand?: CardBrand }> = {
    services: { kicker: "Services" },
    "ai-times": { kicker: "AI Times" },
    events: { kicker: "Events" },
    store: { kicker: "Store" },
    contact: { kicker: "Contact" },
    tools: { kicker: "Free AI tools" },
    book: { kicker: "Book a consultation" },
    about: { kicker: "About TIBLOGICS" },
    toolkit: { kicker: "Toolkit Live" },
    free: { kicker: "Free resource" },
    lp: { kicker: "TIBLOGICS" },
    badges: { kicker: "Verified skill badge", brand: "arfa" },
    certificates: { kicker: "Certificate", brand: "arfa" },
    "learning-box": { kicker: "ARFA · AI Academy", brand: "arfa" },
    learn: { kicker: "ARFA · AI Academy", brand: "arfa" },
    p: { kicker: "Portfolio", brand: "arfa" },
    accessibility: { kicker: "Accessibility" },
    privacy: { kicker: "Privacy" },
    terms: { kicker: "Terms" },
  };
  const hit = map[seg];
  return { kicker: hit?.kicker ?? "TIBLOGICS", brand: hit?.brand ?? "tib" };
}
