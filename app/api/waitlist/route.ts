import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail, requireAdmin, checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`waitlist:${ip}`, 5, 60_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }

  const { email, product } = await req.json().catch(() => ({}));

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: t("tools.api.invalidEmail") }, { status: 400 });
  }
  if (!product || typeof product !== "string" || product.length > 100) {
    return NextResponse.json({ error: t("tools.api.invalidProduct") }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();

  await prisma.waitlistEntry.upsert({
    where: { email_product: { email: cleanEmail, product } },
    update: {},
    create: { email: cleanEmail, product },
  });

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const entries = await prisma.waitlistEntry.findMany({
    where: product ? { product } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}
