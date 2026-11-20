// Shared normalisation for dedupe (domain / email / phone) and lead fields.

export const FREEMAIL = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.ca", "yahoo.fr", "ymail.com", "icloud.com", "me.com", "mac.com",
  "aol.com", "proton.me", "protonmail.com", "gmx.com", "gmx.net", "mail.com", "zoho.com",
  "yandex.com", "hotmail.ca", "hotmail.fr", "live.ca", "outlook.fr", "videotron.ca",
  "sympatico.ca", "rogers.com", "shaw.ca", "bell.net", "comcast.net", "verizon.net",
]);

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

export function normEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().replace(/^mailto:/i, "").split("?")[0].toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

/** Bare registrable-ish host: "https://www.Foo.com/x" → "foo.com". */
export function normDomain(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  let s = v.trim().toLowerCase();
  if (s.includes("@") && !s.includes("/")) s = s.split("@").pop() ?? "";
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(s) ? s : `http://${s}`);
    const host = u.hostname.replace(/^www\./, "").replace(/\.$/, "");
    return host.includes(".") || host === "localhost" ? host : null;
  } catch {
    return null;
  }
}

/** Domain for dedupe: the website's, or the email's when it is not a free mailbox. */
export function dedupeDomain(website: string | null | undefined, email: string | null | undefined): string | null {
  const w = normDomain(website ?? null);
  if (w) return w;
  const e = normEmail(email ?? null);
  if (!e) return null;
  const d = e.split("@")[1];
  return FREEMAIL.has(d) ? null : d;
}

/** Digits only; North American numbers lose a leading 1 so formats compare equal. */
export function normPhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  let d = v.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length >= 7 && d.length <= 15 ? d : null;
}

/** wa.me wants the full international number without "+" or zeros. */
export function waNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10) d = `1${d}`; // assume North America for 10-digit numbers
  return d.length >= 8 && d.length <= 15 ? d : null;
}

export function normUrl(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const s = v.trim();
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function clean(v: unknown, max = 300): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
}

export function firstName(contact: string | null | undefined): string | null {
  const s = (contact ?? "").trim();
  if (!s) return null;
  const f = s.split(/\s+/)[0].replace(/[^\p{L}'-]/gu, "");
  return f.length >= 2 ? f[0].toUpperCase() + f.slice(1) : null;
}
