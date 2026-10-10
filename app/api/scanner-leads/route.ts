import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// POST is gone: the scanner saves its own result on the server
// (app/api/scanner/audit, lib/scanner/lead.ts). It used to accept any scores
// an anonymous caller sent.
export function POST() {
  return NextResponse.json({ error: "Gone" }, { status: 410 });
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
