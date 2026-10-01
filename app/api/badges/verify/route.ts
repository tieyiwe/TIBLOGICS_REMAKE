import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { loadVerifiedBadge } from "@/lib/learn/skill-badges/engine";
import { getSigningKey, issuerDid, siteBase, verifyDocument, verifyJwt } from "@/lib/learn/skill-badges/signing";

// Public verifier for TIBLOGICS skill badges. POST either the credential JSON
// (with its eddsa-jcs-2022 proof) or { "jwt": "<VC-JWT>" }. The signature is
// checked against this issuer's published key; revocation is looked up from
// the credential id. Nothing is stored.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!(await checkRateLimit(`badge-verify:${ip}`, 60, 600_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const text = await req.text().catch(() => "");
  if (text.length > 200_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Send the credential as JSON" }, { status: 400 });
  }

  const key = getSigningKey();
  let credential: Record<string, unknown> | null = null;
  let signature = false;
  let reason: string | null = null;
  let format: "data-integrity" | "vc-jwt" = "data-integrity";

  const jwt = (body as { jwt?: unknown })?.jwt;
  if (typeof jwt === "string") {
    format = "vc-jwt";
    const r = verifyJwt(jwt, key);
    signature = r.ok;
    credential = r.payload ?? null;
    if (!r.ok) reason = "bad_signature";
  } else if (body && typeof body === "object") {
    credential = body as Record<string, unknown>;
    const r = verifyDocument(credential, key);
    signature = r.ok;
    if (!r.ok) reason = r.reason;
  }

  const issuer = credential ? ((credential.issuer as { id?: string } | undefined)?.id ?? credential.issuer) : null;
  const issuerOk = issuer === issuerDid();
  const idStr = typeof credential?.id === "string" ? credential.id : typeof credential?.jti === "string" ? credential.jti : "";
  const prefix = `${siteBase()}/badges/`;
  const awardId = idStr.startsWith(prefix) ? idStr.slice(prefix.length) : null;
  const award = awardId ? await loadVerifiedBadge(awardId) : null;

  const revoked = award?.status === "revoked";
  const developmentKey = !!key?.ephemeral;
  const verified = signature && issuerOk && !!award && !revoked && !developmentKey;
  return NextResponse.json({
    verified,
    format,
    checks: {
      signature,
      issuer: issuerOk,
      knownToIssuer: !!award,
      revoked,
      developmentKey,
    },
    reason: verified ? null : reason ?? (!issuerOk ? "issuer_mismatch" : !award ? "unknown_credential" : revoked ? "revoked" : developmentKey ? "development_key" : null),
    verificationMethod: `${issuerDid()}#key-1`,
  });
}
