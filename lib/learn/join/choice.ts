// What a visitor picks on the one-page "Join ARFA" flow (/learning-box/join).
// Client-safe (no database, no zod): the page, its links and the server all
// read and write the same URL shape, so a choice survives a reload, the
// Google OAuth round trip and an emailed "Finish your enrolment" link.
//
//   ?track=slug                one track, paid once
//   ?plan=monthly[&track=slug] every track, monthly (track = where to land)
//   ?team=1&seats=N            a team plan
//   &code=PROMO                a promo code to apply
//   &go=1                      signed in: continue straight to payment

export type JoinChoice =
  | { kind: "track"; slug: string }
  | { kind: "monthly"; track?: string | null }
  | { kind: "team"; seats: number; company?: string | null };

export const JOIN_PATH = "/learning-box/join";
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const CODE = /^[A-Za-z0-9_-]{1,40}$/;

export const isSlug = (v: unknown): v is string => typeof v === "string" && SLUG.test(v);
export const cleanPromoCode = (v: unknown): string | null => (typeof v === "string" && CODE.test(v.trim()) ? v.trim().toUpperCase() : null);

/** The choice in a query string (page searchParams or URLSearchParams). Null when nothing usable is there. */
export function parseChoice(q: { track?: string | null; plan?: string | null; team?: string | null; seats?: string | null }): JoinChoice | null {
  if (q.team === "1") {
    const n = Number(q.seats);
    return { kind: "team", seats: Number.isInteger(n) && n > 0 && n <= 500 ? n : 0 };
  }
  if (q.plan === "monthly") return { kind: "monthly", track: isSlug(q.track) ? q.track : null };
  if (isSlug(q.track)) return { kind: "track", slug: q.track };
  return null;
}

/** Query parameters for a choice (no leading "?"). */
export function choiceQuery(c: JoinChoice | null): URLSearchParams {
  const q = new URLSearchParams();
  if (!c) return q;
  if (c.kind === "track") q.set("track", c.slug);
  else if (c.kind === "monthly") {
    q.set("plan", "monthly");
    if (c.track) q.set("track", c.track);
  } else {
    q.set("team", "1");
    if (c.seats > 0) q.set("seats", String(c.seats));
  }
  return q;
}

/** The join page with this choice preselected. Always a same-site path. */
export function joinPath(c: JoinChoice | null, extra?: { go?: boolean; code?: string | null; hash?: string }): string {
  const q = choiceQuery(c);
  const code = cleanPromoCode(extra?.code);
  if (code) q.set("code", code);
  if (extra?.go) q.set("go", "1");
  const s = q.toString();
  return `${JOIN_PATH}${s ? `?${s}` : ""}${extra?.hash ?? ""}`;
}

/** A same-site path, or null. Resolved so "/%09/evil.com" (read as "//evil.com") is refused. */
export function sameSitePath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  try {
    const u = new URL(raw, "https://same.site.invalid");
    return u.origin === "https://same.site.invalid" ? u.pathname + u.search + u.hash : null;
  } catch {
    return null;
  }
}

/** The choice carried by a same-site URL that points at the join page (Google callbackUrl), else null. */
export function choiceFromJoinUrl(raw: string | null | undefined): JoinChoice | null {
  if (!raw) return null;
  try {
    // Cookie values may arrive still percent-encoded.
    const v = /^(https?%3A|%2F)/i.test(raw) ? decodeURIComponent(raw) : raw;
    const u = new URL(v, "https://same.site.invalid");
    if (u.pathname !== JOIN_PATH) return null;
    const g = (k: string) => u.searchParams.get(k);
    return parseChoice({ track: g("track"), plan: g("plan"), team: g("team"), seats: g("seats") });
  } catch {
    return null;
  }
}

/** Equality for analytics and preselection. */
export function choiceKey(c: JoinChoice | null): string {
  if (!c) return "";
  return c.kind === "track" ? `track:${c.slug}` : c.kind;
}

/**
 * Old sign-up links that meant "I want to buy" (/learn/signup, /learn/signup?track=x),
 * as the join page with the same query (UTM parameters included). Anything
 * else, including sign-ups continuing elsewhere (?next=), is returned as is.
 */
export function signupToJoin(href: string): string {
  if (!href.startsWith("/learn/signup")) return href;
  try {
    const u = new URL(href, "https://same.site.invalid");
    if (u.pathname !== "/learn/signup" || u.searchParams.has("next")) return href;
    return `${JOIN_PATH}${u.search}${u.hash}`;
  } catch {
    return href;
  }
}
