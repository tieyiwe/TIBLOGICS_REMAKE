import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProspectSource } from "@prisma/client";
import { sendProspectEmail } from "@/lib/resend";
import { checkRateLimit, requireAdmin } from "@/lib/require-admin";
import { clientIp } from "@/lib/geo";

// GET is admin-only — POST is public (AI advisor submits prospects)
export async function GET(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const prospects = await prisma.prospect.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(prospects);
  } catch {
    return NextResponse.json({ error: "Failed to fetch prospects" }, { status: 500 });
  }
}

const str = (v: unknown, max: number): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
// The Advisor page sent "ECHELON_ADVISOR", which is not a ProspectSource, so
// every save failed; anything not in the enum is recorded as the Advisor.
const SOURCES = new Set<string>(Object.values(ProspectSource));
const MAX_BODY = 64_000;

// Public: the Advisor (/tools/advisor) saves the profile it built. Each one
// emails the owner, so it is rate limited per address and every field is
// bounded (the conversation is kept to its last 50 turns of 2,000 characters).
export async function POST(req: Request) {
  const ip = clientIp(req.headers) ?? "unknown";
  if (!(await checkRateLimit(`prospects:${ip}`, 5, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ error: "Too large" }, { status: 413 });
    const body = JSON.parse(raw) as Record<string, unknown>;

    const name = str(body.name, 200);
    const business = str(body.business, 200);
    const industry = str(body.industry, 200);
    const mainChallenge = str(body.mainChallenge, 2000);
    if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    if (!business) return NextResponse.json({ error: "Invalid business" }, { status: 400 });
    if (!industry) return NextResponse.json({ error: "Invalid industry" }, { status: 400 });
    if (!mainChallenge) return NextResponse.json({ error: "Invalid mainChallenge" }, { status: 400 });

    const solutions = Array.isArray(body.suggestedSolutions)
      ? body.suggestedSolutions.map((x) => str(x, 200)).filter((x): x is string => !!x).slice(0, 10)
      : [];
    const log = Array.isArray(body.conversationLog)
      ? body.conversationLog
          .slice(-50)
          .map((m) => {
            const r = m as { role?: unknown; content?: unknown };
            return { role: r?.role === "user" ? "user" : "assistant", content: str(r?.content, 2000) ?? "" };
          })
      : undefined;

    const prospect = await prisma.prospect.create({
      data: {
        name,
        business,
        industry,
        mainChallenge,
        budget: str(body.budget, 100) ?? "",
        suggestedSolutions: solutions,
        email: str(body.email, 320),
        phone: str(body.phone, 30),
        source: typeof body.source === "string" && SOURCES.has(body.source) ? (body.source as ProspectSource) : ProspectSource.TIBS_ADVISOR,
        conversationLog: log,
      },
    });

    sendProspectEmail({
      name: prospect.name,
      business: prospect.business,
      industry: prospect.industry,
      budget: prospect.budget,
      mainChallenge: prospect.mainChallenge,
      suggestedSolutions: prospect.suggestedSolutions,
    }).catch((err) => console.error("[sendProspectEmail]", err));

    return NextResponse.json({ id: prospect.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create prospect" }, { status: 500 });
  }
}
