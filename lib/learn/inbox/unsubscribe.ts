import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { ensureAccountTables } from "@/lib/learn/account-status/db";

// Unsubscribe links in marketing messages: /learn/unsubscribe?t=<token>.
// The token names the learner and is signed, so it cannot be forged for
// someone else; it does not expire (old emails must keep working).

function sig(studentId: string): string {
  return createHmac("sha256", `${process.env.NEXTAUTH_SECRET ?? "dev-secret"}:arfa-unsubscribe`).update(studentId).digest("base64url").slice(0, 32);
}

export function unsubscribeToken(studentId: string): string {
  return `${Buffer.from(studentId).toString("base64url")}.${sig(studentId)}`;
}

export function readUnsubscribeToken(token: string | null | undefined): string | null {
  if (!token || token.length > 300) return null;
  const [idPart, s] = token.split(".");
  if (!idPart || !s) return null;
  let id: string;
  try {
    id = Buffer.from(idPart, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!/^[\w-]{6,64}$/.test(id)) return null;
  const want = Buffer.from(sig(id));
  const got = Buffer.from(s);
  return want.length === got.length && timingSafeEqual(want, got) ? id : null;
}

export async function setMarketingOptOut(studentId: string, optOut: boolean): Promise<boolean> {
  const exists = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!exists) return false;
  await ensureAccountTables();
  await prisma.learnerAccount.upsert({
    where: { studentId },
    create: { studentId, marketingOptOut: optOut, updatedAt: new Date() },
    update: { marketingOptOut: optOut, updatedAt: new Date() },
  });
  return true;
}
