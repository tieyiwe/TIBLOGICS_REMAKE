import { NextResponse } from "next/server";
import { didDocument, getSigningKey } from "@/lib/learn/skill-badges/signing";

// The issuer's did:web document (did:web:<host> resolves here). It publishes
// the Ed25519 public key that signs TIBLOGICS skill badges, as a Multikey
// (for the eddsa-jcs-2022 Data Integrity proofs) and as a JWK (for VC-JWT).
export const dynamic = "force-dynamic";

export function GET() {
  const key = getSigningKey();
  return NextResponse.json(didDocument(key), {
    headers: {
      "Content-Type": "application/did+json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
      ...(key?.ephemeral ? { "X-Badge-Key": "ephemeral-development-key" } : {}),
    },
  });
}
