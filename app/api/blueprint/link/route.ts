import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, isValidEmail } from "@/lib/require-admin";
import { ensureBlueprintTables } from "@/lib/blueprint/db";
import { rotateBlueprintLink } from "@/lib/blueprint/token";
import { sendBlueprintLinkEmail } from "@/lib/blueprint/email";
import { getT } from "@/lib/i18n/server";

// Email a fresh link to every paid blueprint for an address. Same answer
// whether or not there are any; each request retires the old links.
export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`blueprint-link:${ip}`, 5, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }
  const { email } = await req.json().catch(() => ({}));
  if (!isValidEmail(email)) return NextResponse.json({ error: t("tools.api.invalidEmail") }, { status: 400 });
  const clean = email.trim().toLowerCase();

  if (await checkRateLimit(`blueprint-link:email:${clean}`, 3, 3_600_000)) {
    await ensureBlueprintTables();
    const rows = await prisma.blueprint.findMany({
      where: { email: clean, status: { not: "draft" } },
      select: { id: true, company: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    if (rows.length) {
      const links = await Promise.all(rows.map(async (r) => ({ company: r.company, link: await rotateBlueprintLink(r.id) })));
      await sendBlueprintLinkEmail({ email: clean, links }).catch((err) => console.error("[blueprint/link]", err instanceof Error ? err.message : err));
    }
  }
  return NextResponse.json({ ok: true, message: t("tools.bp.api.linkSent") });
}
