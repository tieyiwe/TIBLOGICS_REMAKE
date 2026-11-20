import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ClaudeRefusal } from "@/lib/claude";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { generateKit, KitError } from "@/lib/growth/content/kit";
import { isLanguage } from "@/lib/growth/content/platforms";

// A kit is one Sonnet call; generation can take a minute.
export const maxDuration = 180;

export async function GET() {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const [kits, queued] = await Promise.all([
    prisma.growthKit.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, slug: true, productKey: true, productType: true, productTitle: true, language: true, audienceId: true, warnings: true, createdAt: true },
    }),
    prisma.growthPost.groupBy({ by: ["kitId"], where: { kitId: { not: null } }, _count: { _all: true } }),
  ]);
  const q = new Map(queued.map((r) => [r.kitId, r._count._all]));
  return NextResponse.json({
    kits: kits.map((k) => ({ ...k, warningCount: Array.isArray(k.warnings) ? k.warnings.length : 0, warnings: undefined, queued: q.get(k.id) ?? 0 })),
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const session = await getServerSession(authOptions).catch(() => null);
  if (!(await checkRateLimit(`growth-kit:${session?.user?.id ?? "admin"}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Too many kits this hour. Try again later." }, { status: 429 });
  }
  const b = await jsonBody(req);
  const productKey = typeof b?.productKey === "string" ? b.productKey.slice(0, 200) : "";
  if (!productKey) return NextResponse.json({ error: "Pick a product." }, { status: 400 });
  const language = isLanguage(b?.language) ? b.language : "en";
  const audienceId = typeof b?.audienceId === "string" ? b.audienceId.slice(0, 60) : null;
  try {
    const kit = await generateKit({ productKey, language, audienceId });
    return NextResponse.json({ kit: { id: kit.id, slug: kit.slug } }, { status: 201 });
  } catch (err) {
    if (err instanceof KitError) return NextResponse.json({ error: err.message }, { status: 422 });
    if (err instanceof ClaudeRefusal) return NextResponse.json({ error: "The model declined to write this kit." }, { status: 422 });
    console.error("[growth/kits] generate", err);
    return NextResponse.json({ error: "Kit generation failed. Try again." }, { status: 502 });
  }
}
