import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, rateLimit } from "@/lib/require-admin";

/** Clamp a client-reported score to the 0–100 range the admin UI renders. */
function score(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
}

// POST stays public — the scanner runs for anonymous visitors and saves its
// result here before asking for an email.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`scanner-leads:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();

    const { url, overallScore, seoScore, perfScore, uxScore, aiScore, findings, aiDescription } = body;

    // Every field arrived straight from the request. Without caps an anonymous
    // caller could write unbounded text (and any JSON shape) into the table the
    // admin dashboard reads.
    if (!url || typeof url !== "string" || url.length > 2048) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    const lead = await prisma.scannerLead.create({
      data: {
        url,
        overallScore: score(overallScore),
        seoScore: score(seoScore),
        perfScore: score(perfScore),
        uxScore: score(uxScore),
        aiScore: score(aiScore),
        findings: findings && typeof findings === "object" ? findings : {},
        aiDescription:
          typeof aiDescription === "string" ? aiDescription.slice(0, 5000) : "",
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("[POST /api/scanner-leads]", error);
    return NextResponse.json(
      { error: "Failed to create scanner lead" },
      { status: 500 }
    );
  }
}

// Staff only. This returns every captured lead's name, email and scanned URL —
// the whole scanner mailing list was readable by anyone who guessed the path.
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const leads = await prisma.scannerLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("[GET /api/scanner-leads]", error);
    return NextResponse.json(
      { error: "Failed to fetch scanner leads" },
      { status: 500 }
    );
  }
}
