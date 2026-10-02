import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { LOCALE_COOKIE, isLocale, learnLocale } from "@/lib/i18n/config";

// Remembers the visitor's language choice: a cookie for everyone, and the
// account setting for signed-in learners so it follows them across devices
// and into their emails.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!isLocale(body.locale)) return NextResponse.json({ error: "Unknown language" }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, body.locale, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  const student = await getStudent().catch(() => null);
  if (student) await prisma.student.update({ where: { id: student.id }, data: { locale: learnLocale(body.locale) } }).catch(() => {});
  return res;
}
