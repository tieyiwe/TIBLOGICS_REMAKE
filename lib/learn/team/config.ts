// Team plans: constants shared by the server and the client. No database here.
//
// Defaults the owner left to us. Each one can be changed without a deploy:
//   - seat price and minimum seats: Admin > Learn > Teams > Defaults (stored in
//     AdminSettings "learn.team.pricing"), else LEARN_TEAM_SEAT_PRICE_CENTS /
//     LEARN_TEAM_MIN_SEATS, else the values below;
//   - a team's own seat price: Admin > Learn > Teams > (team).

export const TEAM_PRODUCT = "learn-team";
export const TEAM_CURRENCY = "USD";
export const TEAM_DEFAULT_SEAT_PRICE_CENTS = 6900;
export const TEAM_DEFAULT_MIN_SEATS = 5;
export const TEAM_MAX_SEATS = 500;
/** Invitation links stay valid this long. */
export const TEAM_INVITE_DAYS = 14;
/** Same read-only grace as individual subscriptions. */
export const TEAM_GRACE_DAYS = 7;

export type TeamRole = "owner" | "manager" | "member";
export type TeamMemberStatus = "invited" | "active" | "removed";
/** pending: checkout started, not paid. comped: free seats from staff. */
export type TeamStatus = "pending" | "active" | "trialing" | "past_due" | "canceled" | "comped";

export const isManagerRole = (r: string | null | undefined) => r === "owner" || r === "manager";

/**
 * What a manager can and cannot see. Shown to members word for word and
 * enforced in lib/learn/team/report.ts, which only ever reads the sources in
 * SHARED (it never touches LearnerDraft, LessonReflection, Tutor*, LabAttempt
 * text, practice pad or portfolio content).
 */
export const SHARED = ["progress", "scores", "certificates", "studio", "review"] as const;
export const NEVER_SHARED = ["drafts", "reflections", "tutor", "practice"] as const;

/** Light email check for invites (the API re-validates with zod). */
export const EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

/** Pulls email addresses out of pasted text or CSV (any separator, any column). */
export function parseEmailList(text: string): string[] {
  const out = new Set<string>();
  for (const raw of text.split(/[\s,;\t\r\n"'<>]+/)) {
    const e = raw.trim().toLowerCase();
    if (e && EMAIL_RE.test(e) && e.length <= 254) out.add(e);
  }
  return [...out];
}

// ── Pricing (shared by checkout, the API and every display) ───────────────

/** Optional volume band: from `minSeats` seats, each seat costs `seatPriceCents`. */
export interface SeatTier {
  minSeats: number;
  seatPriceCents: number;
}

export interface TeamPriceBook {
  seatPriceCents: number;
  minSeats: number;
  /** Ascending by minSeats. Empty (the default) means one price for every size. */
  tiers: SeatTier[];
}

/**
 * THE seat price for a team of `seats`: the highest band the count reaches,
 * else the base price. Checkout, the seats API and every price shown on a
 * page go through this one function, so a new price structure is one change.
 */
export function seatPriceFor(book: TeamPriceBook, seats: number): number {
  let price = book.seatPriceCents;
  for (const t of book.tiers) if (seats >= t.minSeats) price = t.seatPriceCents;
  return price;
}

export interface SeatQuote {
  seats: number;
  seatPriceCents: number;
  totalCents: number;
  /** The band applied, or null for the base price. */
  tier: SeatTier | null;
}

export function quoteSeats(book: TeamPriceBook, seats: number): SeatQuote {
  const seatPriceCents = seatPriceFor(book, seats);
  const tier = [...book.tiers].reverse().find((t) => seats >= t.minSeats) ?? null;
  return { seats, seatPriceCents, totalCents: seatPriceCents * seats, tier };
}

/** Cleans tiers read from settings JSON: valid integers, ascending, unique bands. */
export function cleanTiers(raw: unknown): SeatTier[] {
  if (!Array.isArray(raw)) return [];
  const out = new Map<number, number>();
  for (const r of raw) {
    const minSeats = Number((r as SeatTier)?.minSeats);
    const price = Number((r as SeatTier)?.seatPriceCents);
    if (Number.isInteger(minSeats) && minSeats >= 1 && minSeats <= TEAM_MAX_SEATS && Number.isInteger(price) && price >= 100 && price <= 1_000_000) {
      out.set(minSeats, price);
    }
  }
  return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([minSeats, seatPriceCents]) => ({ minSeats, seatPriceCents }));
}

// ── Invitations: paste, list or CSV with optional names ──────────────────

export interface InviteRow {
  email: string;
  name: string | null;
  /** invalid: looks like an address but is not one. duplicate: already earlier in the list. */
  problem: "invalid" | "duplicate" | null;
}

const ROLE_WORDS = /^(owner|manager|member|role|email|e-mail|courriel|name|nom|jina)$/i;

/**
 * One row per line (or per comma-separated address on a line without names).
 * Accepts "email", "Name <email>", "Name, email" and "email, Name" (CSV from a
 * spreadsheet, any column order, header line ignored).
 */
export function parseInviteRows(text: string): InviteRow[] {
  const rows: InviteRow[] = [];
  const seen = new Set<string>();
  const push = (rawEmail: string, name: string | null) => {
    const email = rawEmail.trim().toLowerCase().replace(/^mailto:/, "");
    if (!email) return;
    if (!EMAIL_RE.test(email) || email.length > 254) {
      rows.push({ email, name, problem: "invalid" });
      return;
    }
    rows.push({ email, name, problem: seen.has(email) ? "duplicate" : null });
    seen.add(email);
  };
  for (const line of text.split(/\r?\n/)) {
    const cells = line
      .split(/[,;\t]/)
      .map((c) => c.trim().replace(/^["']|["']$/g, "").trim())
      .filter(Boolean);
    if (cells.length === 0) continue;
    const withAt = cells.filter((c) => c.includes("@"));
    if (withAt.length === 0) continue; // header or blank line
    if (withAt.length > 1 || cells.length === 1) {
      // A list of addresses (or "Name <email>" items) on one line.
      for (const c of cells) {
        const angle = c.match(/^(.*)<([^>]+)>$/);
        if (angle) push(angle[2], angle[1].trim().replace(/^["']|["']$/g, "") || null);
        else if (c.includes("@")) for (const part of c.split(/\s+/)) if (part.includes("@")) push(part, null);
      }
      continue;
    }
    const angle = withAt[0].match(/^(.*)<([^>]+)>$/);
    const email = angle ? angle[2] : withAt[0];
    const others = cells.filter((c) => c !== withAt[0] && !ROLE_WORDS.test(c));
    const name = (angle?.[1].trim() || others.join(" ")).slice(0, 80) || null;
    push(email, name);
  }
  return rows;
}

// ── Team join link (domain-restricted) ────────────────────────────────────

/** Public mailbox providers: a team link can never be restricted to these. */
export const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.fr", "yahoo.co.uk", "ymail.com", "hotmail.com", "hotmail.fr", "hotmail.co.uk",
  "outlook.com", "outlook.fr", "live.com", "live.fr", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me",
  "protonmail.com", "gmx.com", "gmx.de", "gmx.fr", "mail.com", "yandex.com", "yandex.ru", "zoho.com", "orange.fr", "free.fr",
  "laposte.net", "sfr.fr", "wanadoo.fr", "qq.com", "163.com", "126.com", "hey.com", "fastmail.com", "tutanota.com",
]);

export const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** "@Company.com " -> "company.com"; null when not a usable company domain. */
export function cleanDomain(raw: string): string | null {
  const d = raw.trim().toLowerCase().replace(/^@/, "");
  if (!DOMAIN_RE.test(d) || PUBLIC_EMAIL_DOMAINS.has(d)) return null;
  return d;
}

export const emailDomain = (email: string) => email.trim().toLowerCase().split("@").pop() ?? "";

/** True when the address is on the domain or one of its subdomains. */
export function emailOnDomain(email: string, domain: string): boolean {
  const d = emailDomain(email);
  return d === domain || d.endsWith(`.${domain}`);
}

/** Members inactive this long are flagged in "Needs attention". */
export const TEAM_INACTIVE_DAYS = 7;
/** A member can be nudged at most once in this window. */
export const TEAM_NUDGE_HOURS = 24;
