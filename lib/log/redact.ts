// Helpers for server logs (security checklist, door 28). Logs end up in the
// Replit console, which more people and tools can read than the database, so
// personal data and credentials are masked before they are printed.

/** "jane.doe@example.com" -> "j***@example.com". */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "(none)";
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

/** "+1 202 555 0143" -> "***0143". */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "(none)";
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 4 ? "***" : `***${digits.slice(-4)}`;
}

const SECRET_KEYS = /pass(word)?|secret|token|api[-_]?key|authorization|cookie|signature|hash|card|cvc|iban/i;
const SECRET_VALUES = [
  /sk_(live|test)_[0-9A-Za-z]{8,}/g,
  /whsec_[0-9A-Za-z]{8,}/g,
  /sk-ant-[0-9A-Za-z_-]{8,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /gh[pousr]_[0-9A-Za-z]{20,}/g,
  /(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s]+@/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/g,
];

/** A string with anything that looks like a credential replaced. */
export function redactText(s: string): string {
  let out = s;
  for (const re of SECRET_VALUES) out = out.replace(re, (m, p1) => (typeof p1 === "string" && p1.startsWith("postgres") ? `${p1}***@` : "[redacted]"));
  return out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => maskEmail(m));
}

/**
 * A copy of an object safe to log: secret-named fields are replaced, emails
 * and phone numbers masked, long strings shortened. Never throws.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return redactText(value.length > 500 ? value.slice(0, 500) + "…" : value);
  if (depth > 4) return "[…]";
  if (value instanceof Error) return { name: value.name, message: redactText(value.message) };
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.test(k)) out[k] = "[redacted]";
      else if (/phone|whatsapp/i.test(k) && typeof v === "string") out[k] = maskPhone(v);
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return String(value);
}
