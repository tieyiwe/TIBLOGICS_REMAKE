// Who is reading and who is commenting, for the article engagement routes.
//
//  - Staff (owner, admins, collaborators with AI Times manage access) comment
//    as TIBLOGICS and can pin or hide right on the page.
//  - Signed-in ARFA learners comment under their account name.
//  - Guests give a name and an email; the first comment waits for a link sent
//    to that email. Opening it publishes the comment and leaves a signed
//    cookie (tib_cmt, 180 days) so later comments from that browser go
//    straight up. The email is never shown.
//  - Votes and reactions are counted per browser with an anonymous random id
//    (tib_rid), stored only as a keyed hash.
//
// Links in emails and the cookies are signed with NEXTAUTH_SECRET (HMAC-SHA256),
// each with its own purpose so one can never stand in for another.
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getServerSession } from "next-auth";
import type { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";
import { getStudent } from "@/lib/learn/session";

const DAY_MS = 86_400_000;
export const COMMENTER_COOKIE = "tib_cmt";
export const READER_COOKIE = "tib_rid";
export const COMMENTER_DAYS = 180;
export const MODERATE_PERMISSION = "blog:manage";

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}

const mac = (purpose: string, payload: string) => createHmac("sha256", secret()).update(`article-${purpose}:${payload}`).digest("base64url");

export function signToken(purpose: string, data: Record<string, unknown>, days: number, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ ...data, x: now + days * DAY_MS })).toString("base64url");
  return `${payload}.${mac(purpose, payload)}`;
}

/** The signed data, or null (bad signature, expired, malformed). Never throws. */
export function verifyToken<T extends Record<string, unknown>>(purpose: string, token: unknown, now = Date.now()): T | null {
  if (typeof token !== "string" || token.length < 20 || token.length > 1500) return null;
  const dot = token.indexOf(".");
  if (dot < 1 || dot !== token.lastIndexOf(".")) return null;
  const payload = token.slice(0, dot);
  try {
    const want = Buffer.from(mac(purpose, payload));
    const got = Buffer.from(token.slice(dot + 1));
    if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T & { x?: unknown };
    if (typeof data.x !== "number" || data.x < now) return null;
    return data;
  } catch {
    return null;
  }
}

/** Keyed hash for identifiers stored in the database (reader ids, addresses). */
export function keyedHash(kind: string, value: string): string {
  return createHmac("sha256", secret()).update(`article-${kind}:${value}`).digest("base64url").slice(0, 32);
}

export type Viewer =
  | { kind: "staff"; staffId: string; name: string; canModerate: boolean }
  | { kind: "learner"; studentId: string; name: string; email: string }
  | { kind: "verified"; name: string; email: string }
  | { kind: "anon" };

/** The guest identity from the signed cookie, or null. */
export function commenterFromCookie(req: NextRequest): { email: string; name: string } | null {
  const data = verifyToken<{ e?: unknown; n?: unknown }>("commenter", req.cookies.get(COMMENTER_COOKIE)?.value);
  if (!data || typeof data.e !== "string" || typeof data.n !== "string") return null;
  return { email: data.e, name: data.n };
}

export async function viewerOf(req: NextRequest): Promise<Viewer> {
  // Staff first: the owner's admin session also opens the learner area
  // (getStudent() accepts it), but on AI Times the owner speaks as TIBLOGICS.
  try {
    const session = await getServerSession(authOptions);
    const u = session?.user;
    if (u && !u.studentId && (u.isOwner || u.isAdmin || u.collaboratorId)) {
      return {
        kind: "staff",
        staffId: u.collaboratorId ?? (u.isOwner ? "owner" : String(u.id ?? "admin")),
        name: (u.name ?? "").trim() || "TIBLOGICS",
        canModerate: can(u, MODERATE_PERMISSION),
      };
    }
  } catch {
    /* a broken session cookie reads as a guest */
  }
  // Learners: getStudent() checks the account is active and the session not revoked.
  const student = await getStudent().catch(() => null);
  if (student) return { kind: "learner", studentId: student.id, name: student.name, email: student.email.toLowerCase() };
  const c = commenterFromCookie(req);
  return c ? { kind: "verified", ...c } : { kind: "anon" };
}

/** The anonymous reader id from the cookie, or a new one to set on the response. */
export function readerId(req: NextRequest): { id: string; fresh: boolean } {
  const v = req.cookies.get(READER_COOKIE)?.value;
  if (v && /^[A-Za-z0-9_-]{22,40}$/.test(v)) return { id: v, fresh: false };
  return { id: randomBytes(18).toString("base64url"), fresh: true };
}

export function readerHash(id: string): string {
  return keyedHash("reader", id);
}

const secure = () => (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

export function setReaderCookie(res: NextResponse, id: string): void {
  res.cookies.set(READER_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: secure(), path: "/", maxAge: 400 * 86_400 });
}

export function setCommenterCookie(res: NextResponse, c: { email: string; name: string }): void {
  res.cookies.set(COMMENTER_COOKIE, signToken("commenter", { e: c.email, n: c.name }, COMMENTER_DAYS), {
    httpOnly: true,
    sameSite: "lax",
    secure: secure(),
    path: "/",
    maxAge: COMMENTER_DAYS * 86_400,
  });
}

export function clearCommenterCookie(res: NextResponse): void {
  res.cookies.set(COMMENTER_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: secure(), path: "/", maxAge: 0 });
}

/** Email links: confirm a guest's comment (7 days) and stop reply emails (1 year). */
export const confirmToken = (commentId: string, email: string, newsletter: boolean) => signToken("confirm", { c: commentId, e: email, nl: newsletter ? 1 : 0 }, 7);
export const unsubscribeToken = (email: string, locale: string) => signToken("unsub", { e: email, l: locale }, 365);
