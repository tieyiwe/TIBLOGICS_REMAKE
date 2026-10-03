import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail, requireAdmin, checkRateLimit } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`partnerships:${ip}`, 3, 60_000))) {
    return NextResponse.json({ error: t("pages.api.tooMany") }, { status: 429 });
  }

  const { businessName, contactName, email, phone, website, address, description } = await req.json();

  if (!businessName || typeof businessName !== "string" || businessName.length > 200) {
    return NextResponse.json({ error: t("pages.api.invalidBusinessName") }, { status: 400 });
  }
  if (!contactName || typeof contactName !== "string" || contactName.length > 200) {
    return NextResponse.json({ error: t("pages.api.invalidContactName") }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: t("pages.api.invalidEmail") }, { status: 400 });
  }
  if (!phone || typeof phone !== "string" || phone.length > 50) {
    return NextResponse.json({ error: t("pages.api.invalidPhone") }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.length > 5000) {
    return NextResponse.json({ error: t("pages.api.descriptionRequired") }, { status: 400 });
  }

  await prisma.partnershipApplication.create({
    data: {
      businessName: businessName.trim().slice(0, 200),
      contactName: contactName.trim().slice(0, 200),
      email: email.trim().toLowerCase(),
      phone: phone.trim().slice(0, 50),
      website: typeof website === "string" ? website.slice(0, 500) : null,
      address: typeof address === "string" ? address.slice(0, 500) : null,
      description: description.slice(0, 5000),
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const applications = await prisma.partnershipApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(applications);
}
