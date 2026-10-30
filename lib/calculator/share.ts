// Share links: the inputs that differ from the defaults, as JSON, compressed
// with deflate-raw and base64url-encoded into the URL hash (#c=...). The hash
// never reaches the server, so nothing is logged and there is no URL-length
// limit on the server side. A plain-JSON fallback covers browsers without
// CompressionStream.

import { DEFAULT_INPUTS } from "./defaults";
import { diffInputs, sanitizeInputs } from "./schema";
import type { Inputs } from "./types";

export const SHARE_PARAM = "c";
/** Links longer than this are refused rather than produced. */
export const MAX_SHARE_LENGTH = 6000;

interface Payload {
  i: Record<string, unknown>;
  d?: string;
}

function toB64url(bytes: Uint8Array): string {
  let s = "";
  for (let n = 0; n < bytes.length; n++) s += String.fromCharCode(bytes[n]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(b.length);
  for (let n = 0; n < b.length; n++) out[n] = b.charCodeAt(n);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const body = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
}

const hasCompression = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

/** "z" + deflated base64url, or "j" + plain base64url JSON. */
export async function encodeState(inputs: Inputs, description = ""): Promise<string> {
  const payload: Payload = { i: diffInputs(inputs, DEFAULT_INPUTS) };
  if (description.trim()) payload.d = description.trim().slice(0, 500);
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  if (hasCompression()) {
    try {
      return "z" + toB64url(await pipe(bytes, new CompressionStream("deflate-raw")));
    } catch {
      // Fall through to plain encoding.
    }
  }
  return "j" + toB64url(bytes);
}

export async function decodeState(code: string): Promise<{ inputs: Inputs; description: string } | null> {
  if (!code || code.length > MAX_SHARE_LENGTH * 2) return null;
  try {
    const kind = code[0];
    let bytes = fromB64url(code.slice(1));
    if (kind === "z") {
      if (!hasCompression()) return null;
      bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    } else if (kind !== "j") {
      return null;
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Partial<Payload>;
    return {
      inputs: sanitizeInputs(payload.i ?? {}, DEFAULT_INPUTS),
      description: typeof payload.d === "string" ? payload.d.slice(0, 500) : "",
    };
  } catch {
    return null;
  }
}
