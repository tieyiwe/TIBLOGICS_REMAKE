// Small guards for the free-form JSON that public beacons may attach
// (analytics metadata, scanner findings). Anything that is not a plain object,
// or is larger than `maxBytes` once serialised, is dropped rather than stored:
// an anonymous caller must not be able to write arbitrary-size rows.

/** A plain JSON object no larger than `maxBytes`, or null. */
export function boundedObject(v: unknown, maxBytes = 4_000): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  try {
    const s = JSON.stringify(v);
    return s.length <= maxBytes ? (JSON.parse(s) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** A JSON value (object or array) no larger than `maxBytes`, or null. */
export function boundedJson(v: unknown, maxBytes = 50_000): unknown {
  if (v === null || typeof v !== "object") return null;
  try {
    const s = JSON.stringify(v);
    return s.length <= maxBytes ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
