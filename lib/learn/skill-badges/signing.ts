// Signing for Open Badges 3.0 credentials. Server only (node:crypto).
//
// Proof format: a W3C Data Integrity proof, type "DataIntegrityProof" with
// the "eddsa-jcs-2022" cryptosuite (W3C Recommendation "Data Integrity EdDSA
// Cryptosuites v1.0", section 3.3). It is the JSON Canonicalization Scheme
// (RFC 8785) sibling of eddsa-rdfc-2022: the same Ed25519 signature over
// SHA-256(canonical proof config) || SHA-256(canonical document), with JCS
// instead of RDF dataset canonicalisation, so it needs no JSON-LD processor
// or remote contexts. Every credential can also be fetched as a VC-JWT
// (Open Badges 3.0 section 8.2, JOSE alg "EdDSA", RFC 8037).
//
// Key: BADGE_SIGNING_KEY, an Ed25519 private key as PKCS8 PEM, base64 PKCS8
// DER, or a base64 32-byte seed. The public half is published as a did:web
// document at /.well-known/did.json. Without the variable, development gets
// an ephemeral key (lost on restart) and every credential it signs is marked
// unsigned; production leaves credentials unsigned.
import crypto, { type KeyObject } from "node:crypto";

// ── Site identity ───────────────────────────────────────────────────────────

export function siteBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
}

/** did:web for the site host (a port is percent-encoded, per the did:web spec). */
export function issuerDid(): string {
  const u = new URL(siteBase());
  return `did:web:${u.host.replace(/:/g, "%3A")}`;
}

export const verificationMethodId = () => `${issuerDid()}#key-1`;
export const jwkMethodId = () => `${issuerDid()}#jwk-1`;

// ── Key ─────────────────────────────────────────────────────────────────────

export interface SigningKey {
  privateKey: KeyObject;
  publicKey: KeyObject;
  /** Raw 32-byte Ed25519 public key. */
  publicRaw: Buffer;
  /** First 16 hex chars of SHA-256(publicRaw). */
  fingerprint: string;
  /** True for the development fallback: credentials it signs count as unsigned. */
  ephemeral: boolean;
}

const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function parseKey(raw: string): KeyObject {
  const v = raw.trim().replace(/\\n/g, "\n");
  if (v.includes("-----BEGIN")) return crypto.createPrivateKey({ key: v, format: "pem" });
  const buf = Buffer.from(v, "base64");
  if (buf.length === 32) {
    return crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519_PREFIX, buf]), format: "der", type: "pkcs8" });
  }
  return crypto.createPrivateKey({ key: buf, format: "der", type: "pkcs8" });
}

function describe(privateKey: KeyObject, ephemeral: boolean): SigningKey {
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("BADGE_SIGNING_KEY is not an Ed25519 key");
  const publicKey = crypto.createPublicKey(privateKey);
  const jwk = publicKey.export({ format: "jwk" }) as { x?: string };
  const publicRaw = Buffer.from(jwk.x ?? "", "base64url");
  const fingerprint = crypto.createHash("sha256").update(publicRaw).digest("hex").slice(0, 16);
  return { privateKey, publicKey, publicRaw, fingerprint, ephemeral };
}

// Kept on globalThis so dev hot reloads reuse one ephemeral key.
const G = globalThis as unknown as { __tibBadgeKey?: SigningKey | null; __tibBadgeKeyWarned?: boolean };

/** The signing key, or null when none is configured outside development. */
export function getSigningKey(): SigningKey | null {
  if (G.__tibBadgeKey !== undefined) return G.__tibBadgeKey;
  const env = process.env.BADGE_SIGNING_KEY;
  if (env) {
    try {
      G.__tibBadgeKey = describe(parseKey(env), false);
      return G.__tibBadgeKey;
    } catch (err) {
      console.error("[skill-badges] BADGE_SIGNING_KEY could not be read; badges will be issued unsigned.", err);
      G.__tibBadgeKey = null;
      return null;
    }
  }
  if (process.env.NODE_ENV === "production") {
    if (!G.__tibBadgeKeyWarned) {
      console.warn("[skill-badges] BADGE_SIGNING_KEY is not set: skill badges are issued UNSIGNED.");
      G.__tibBadgeKeyWarned = true;
    }
    G.__tibBadgeKey = null;
    return null;
  }
  console.warn(
    "[skill-badges] WARNING: BADGE_SIGNING_KEY is not set. Using an EPHEMERAL Ed25519 key for development. " +
      "Credentials signed with it are marked unsigned and stop verifying when the server restarts.",
  );
  const { privateKey } = crypto.generateKeyPairSync("ed25519");
  G.__tibBadgeKey = describe(privateKey, true);
  return G.__tibBadgeKey;
}

// ── Encodings ───────────────────────────────────────────────────────────────

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58btc(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  return "1".repeat(zeros) + digits.reverse().map((d) => B58[d]).join("");
}

export function base58btcDecode(s: string): Buffer {
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  const bytes: number[] = [];
  for (const ch of s) {
    const v = B58.indexOf(ch);
    if (v < 0) throw new Error("invalid base58");
    let carry = v;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  return Buffer.from([...new Array(zeros).fill(0), ...bytes.reverse()]);
}

/** Multikey (multicodec ed25519-pub 0xed01, multibase base58btc). */
export function publicKeyMultibase(raw: Buffer): string {
  return "z" + base58btc(Buffer.concat([Buffer.from([0xed, 0x01]), raw]));
}

/** RFC 8785 JSON Canonicalization Scheme. */
export function jcs(value: unknown): string {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("JCS: non-finite number");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? "null" : jcs(v))).join(",")}]`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Default sort compares UTF-16 code units, as RFC 8785 requires.
    const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${jcs(obj[k])}`).join(",")}}`;
  }
  throw new Error(`JCS: unsupported ${typeof value}`);
}

const sha256 = (s: string) => crypto.createHash("sha256").update(s, "utf8").digest();

// ── Data Integrity proof (eddsa-jcs-2022) ───────────────────────────────────

export interface DataIntegrityProof {
  "@context"?: unknown;
  type: "DataIntegrityProof";
  cryptosuite: "eddsa-jcs-2022";
  created: string;
  verificationMethod: string;
  proofPurpose: "assertionMethod";
  proofValue: string;
}

type Doc = Record<string, unknown> & { proof?: DataIntegrityProof };

function hashData(unsecured: Record<string, unknown>, proofConfig: Record<string, unknown>): Buffer {
  return Buffer.concat([sha256(jcs(proofConfig)), sha256(jcs(unsecured))]);
}

/** Adds an eddsa-jcs-2022 DataIntegrityProof. Returns the document unchanged when key is null. */
export function signDocument<T extends Record<string, unknown>>(doc: T, key: SigningKey | null, created = new Date()): T {
  if (!key) return doc;
  const { proof: _ignored, ...unsecured } = doc as Doc;
  void _ignored;
  const config: Record<string, unknown> = {
    type: "DataIntegrityProof",
    cryptosuite: "eddsa-jcs-2022",
    created: created.toISOString().replace(/\.\d{3}Z$/, "Z"),
    verificationMethod: verificationMethodId(),
    proofPurpose: "assertionMethod",
  };
  if (unsecured["@context"] !== undefined) config["@context"] = unsecured["@context"];
  const sig = crypto.sign(null, hashData(unsecured, config), key.privateKey);
  return { ...unsecured, proof: { ...config, proofValue: "z" + base58btc(sig) } } as unknown as T;
}

export type ProofCheck =
  | { ok: true; verificationMethod: string }
  | { ok: false; reason: "no_proof" | "unsupported" | "unknown_key" | "bad_signature" | "context_mismatch" | "malformed" };

/**
 * Verifies an eddsa-jcs-2022 proof against this issuer's published key (the
 * only key this server trusts). Any change to the document after signing,
 * however small, fails with bad_signature.
 */
export function verifyDocument(doc: unknown, key: SigningKey | null): ProofCheck {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return { ok: false, reason: "malformed" };
  const { proof, ...unsecured } = doc as Doc;
  if (!proof || typeof proof !== "object") return { ok: false, reason: "no_proof" };
  if (proof.type !== "DataIntegrityProof" || proof.cryptosuite !== "eddsa-jcs-2022" || proof.proofPurpose !== "assertionMethod") {
    return { ok: false, reason: "unsupported" };
  }
  if (!key || proof.verificationMethod !== verificationMethodId()) return { ok: false, reason: "unknown_key" };
  const { proofValue, ...config } = proof;
  if (typeof proofValue !== "string" || !proofValue.startsWith("z")) return { ok: false, reason: "malformed" };
  if (config["@context"] !== undefined) {
    const docCtx = Array.isArray(unsecured["@context"]) ? unsecured["@context"] : [unsecured["@context"]];
    const proofCtx = Array.isArray(config["@context"]) ? config["@context"] : [config["@context"]];
    if (!proofCtx.every((c, i) => jcs(c) === jcs(docCtx[i]))) return { ok: false, reason: "context_mismatch" };
    unsecured["@context"] = config["@context"];
  }
  let sig: Buffer;
  try {
    sig = base58btcDecode(proofValue.slice(1));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  let valid = false;
  try {
    valid = sig.length === 64 && crypto.verify(null, hashData(unsecured, config as Record<string, unknown>), key.publicKey, sig);
  } catch {
    valid = false;
  }
  return valid ? { ok: true, verificationMethod: proof.verificationMethod } : { ok: false, reason: "bad_signature" };
}

// ── VC-JWT (Open Badges 3.0 section 8.2) ────────────────────────────────────

/** Compact JWS of the credential (without its embedded proof), alg EdDSA. */
export function credentialJwt(doc: Record<string, unknown>, key: SigningKey): string {
  const { proof: _p, ...vc } = doc as Doc;
  void _p;
  const issued = Date.parse(String(vc.issuanceDate ?? vc.validFrom ?? new Date().toISOString()));
  const header = { alg: "EdDSA", typ: "JWT", kid: jwkMethodId() };
  const payload = {
    ...vc,
    iss: issuerDid(),
    jti: vc.id,
    nbf: Math.floor(issued / 1000),
    iat: Math.floor(issued / 1000),
  };
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o), "utf8").toString("base64url");
  const input = `${enc(header)}.${enc(payload)}`;
  const sig = crypto.sign(null, Buffer.from(input, "ascii"), key.privateKey);
  return `${input}.${sig.toString("base64url")}`;
}

export function verifyJwt(jwt: string, key: SigningKey | null): { ok: boolean; payload?: Record<string, unknown> } {
  const parts = jwt.trim().split(".");
  if (parts.length !== 3 || !key) return { ok: false };
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (header.alg !== "EdDSA" || header.kid !== jwkMethodId()) return { ok: false };
    const ok = crypto.verify(null, Buffer.from(`${parts[0]}.${parts[1]}`, "ascii"), key.publicKey, Buffer.from(parts[2], "base64url"));
    return ok ? { ok, payload: JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// ── did:web document ────────────────────────────────────────────────────────

export function didDocument(key: SigningKey | null): Record<string, unknown> {
  const did = issuerDid();
  const methods = key
    ? [
        { id: verificationMethodId(), type: "Multikey", controller: did, publicKeyMultibase: publicKeyMultibase(key.publicRaw) },
        {
          id: jwkMethodId(),
          type: "JsonWebKey",
          controller: did,
          publicKeyJwk: { kty: "OKP", crv: "Ed25519", x: key.publicRaw.toString("base64url") },
        },
      ]
    : [];
  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/multikey/v1", "https://w3id.org/security/suites/jws-2020/v1"],
    id: did,
    verificationMethod: methods,
    assertionMethod: methods.map((m) => m.id),
    service: [{ id: `${did}#website`, type: "LinkedDomains", serviceEndpoint: siteBase() + "/" }],
  };
}
