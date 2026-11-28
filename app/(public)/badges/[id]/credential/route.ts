import { NextRequest, NextResponse } from "next/server";
import { loadVerifiedBadge } from "@/lib/learn/skill-badges/engine";
import { credentialJwt, getSigningKey } from "@/lib/learn/skill-badges/signing";

// The Open Badges 3.0 credential as issued: JSON-LD with an embedded
// eddsa-jcs-2022 Data Integrity proof (default), or ?format=jwt for the
// VC-JWT form. ?download=1 saves it as a file. Private badges are not served;
// a revoked badge answers 410 with the reason.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await loadVerifiedBadge(id);
  if (!b || !b.award.isPublic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (b.status === "revoked") {
    return NextResponse.json({ error: "This badge has been revoked", revoked: true, id: b.credential.id }, { status: 410 });
  }
  // A stored credential that no longer matches its signature is never handed out.
  if (b.status === "invalid") {
    return NextResponse.json({ error: "This badge failed verification", status: b.status }, { status: 409 });
  }
  const download = req.nextUrl.searchParams.get("download") === "1";
  const file = `tiblogics-badge-${id}`;
  const common = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
    "X-Badge-Verification": b.status,
  };

  if (req.nextUrl.searchParams.get("format") === "jwt") {
    const key = getSigningKey();
    if (!key || b.status !== "verified" && b.status !== "unsigned") {
      return NextResponse.json({ error: "No signing key available" }, { status: 503 });
    }
    return new Response(credentialJwt(b.credential, key), {
      headers: {
        ...common,
        "Content-Type": "text/plain; charset=utf-8",
        ...(download ? { "Content-Disposition": `attachment; filename="${file}.jwt"` } : {}),
      },
    });
  }

  return new Response(JSON.stringify(b.credential, null, 2), {
    headers: {
      ...common,
      "Content-Type": "application/ld+json; charset=utf-8",
      ...(download ? { "Content-Disposition": `attachment; filename="${file}.json"` } : {}),
    },
  });
}
