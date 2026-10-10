// Where a visit came from: one source and medium per session, from the UTM
// parameters when the link had them, otherwise from the referrer. Pure, so the
// browser tracker and the server agree (the server re-derives it and never
// trusts the client's answer).
//
// Mediums: organic (search engines), social, email, ai (assistants), referral
// (any other site), paid (cpc, ppc, ads), and "(none)" for direct visits.

export interface Touch {
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
  /** A /go tracked link's code, when the visit came through one. */
  link: string | null;
  /** Landing page (normalised path). */
  landing: string | null;
  /** Referrer host, without www. */
  referrer: string | null;
}

/** UTM values are free text from URLs: a short, safe, lower-case subset. */
export function cleanTag(v: unknown, n = 100): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, n).replace(/[^A-Za-z0-9._\-+~ ]/g, "").trim();
  return s ? s.toLowerCase() : null;
}

const SEARCH: Array<[RegExp, string]> = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)search\.yahoo\.|(^|\.)yahoo\.com$/, "yahoo"],
  [/(^|\.)yandex\./, "yandex"],
  [/(^|\.)baidu\.com$/, "baidu"],
  [/(^|\.)ecosia\.org$/, "ecosia"],
  [/(^|\.)search\.brave\.com$/, "brave"],
  [/(^|\.)qwant\.com$/, "qwant"],
];
const SOCIAL: Array<[RegExp, string]> = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|m\.facebook\.com|l\.facebook\.com)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "x"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)pinterest\./, "pinterest"],
  [/(^|\.)threads\.net$/, "threads"],
  [/(^|\.)t\.me$|(^|\.)telegram\.org$/, "telegram"],
];
const AI: Array<[RegExp, string]> = [
  [/(^|\.)(chatgpt\.com|chat\.openai\.com)$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)claude\.ai$/, "claude"],
  [/(^|\.)gemini\.google\.com$/, "gemini"],
  [/(^|\.)copilot\.microsoft\.com$/, "copilot"],
];
const MAIL = /(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com|mail\.proton\.me)$/;

function normMedium(m: string | null): string | null {
  if (!m) return null;
  if (/^(cpc|ppc|paid|paidsearch|paid_search|paid-social|paid_social|ads?|display|cpm)$/.test(m)) return "paid";
  if (/^(e-?mail|newsletter)$/.test(m)) return "email";
  if (/^(social|social-network|sm|social_media)$/.test(m)) return "social";
  if (/^(organic|seo)$/.test(m)) return "organic";
  return m.slice(0, 40);
}

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.hostname.toLowerCase().replace(/^www\./, "").slice(0, 120) || null;
  } catch {
    return null;
  }
}

/**
 * Source and medium of a visit. `ownHosts` are this site's hosts: a referrer
 * from one of them is internal (navigation), not a source.
 */
export function classify(input: {
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
  utmTerm?: unknown;
  link?: unknown;
  referrer?: string | null;
  landing?: string | null;
  ownHosts?: string[];
}): Touch {
  const own = new Set(["tiblogics.com", "localhost", ...(input.ownHosts ?? []).map((h) => h.replace(/^www\./, ""))]);
  let ref = hostOf(input.referrer ?? null);
  if (ref && (own.has(ref) || own.has(ref.split(":")[0]))) ref = null;
  const s = cleanTag(input.utmSource);
  const m = normMedium(cleanTag(input.utmMedium));
  const link = typeof input.link === "string" && /^[A-Za-z0-9_-]{3,32}$/.test(input.link) ? input.link : null;
  const base = {
    campaign: cleanTag(input.utmCampaign),
    content: cleanTag(input.utmContent),
    term: cleanTag(input.utmTerm),
    link,
    landing: input.landing ? String(input.landing).slice(0, 200) : null,
    referrer: ref,
  };
  if (s) return { source: s, medium: m ?? (ref ? "referral" : "(none)"), ...base };
  if (link) return { source: "tracked link", medium: m ?? "link", ...base };
  if (ref) {
    for (const [re, name] of SEARCH) if (re.test(ref)) return { source: name, medium: "organic", ...base };
    for (const [re, name] of SOCIAL) if (re.test(ref)) return { source: name, medium: "social", ...base };
    for (const [re, name] of AI) if (re.test(ref)) return { source: name, medium: "ai", ...base };
    if (MAIL.test(ref)) return { source: ref, medium: "email", ...base };
    return { source: ref, medium: "referral", ...base };
  }
  return { source: "(direct)", medium: "(none)", ...base };
}

/** Compact cookie form (first touch: tib_ft, 90 days; last touch: tib_lt, session). */
export interface TouchCookie {
  s?: string | null; // utm_source
  m?: string | null; // utm_medium
  c?: string | null; // campaign
  n?: string | null; // content
  k?: string | null; // term
  l?: string | null; // link code
  p?: string | null; // landing path
  r?: string | null; // referrer host
  t?: number; // when
}

export const FIRST_TOUCH_COOKIE = "tib_ft";
export const LAST_TOUCH_COOKIE = "tib_lt";
export const FIRST_TOUCH_DAYS = 90;

export function touchFromCookie(raw: string | null | undefined): (Touch & { at: Date | null }) | null {
  if (!raw || raw.length > 1500) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as TouchCookie;
    if (!o || typeof o !== "object") return null;
    const t = classify({
      utmSource: o.s,
      utmMedium: o.m,
      utmCampaign: o.c,
      utmContent: o.n,
      utmTerm: o.k,
      link: o.l,
      referrer: typeof o.r === "string" && /^[a-z0-9.-]{1,120}$/i.test(o.r) ? `https://${o.r}/` : null,
      landing: typeof o.p === "string" && /^\/[\w\-.~:/]{0,199}$/.test(o.p) ? o.p : null,
    });
    const at = Number.isFinite(Number(o.t)) ? new Date(Number(o.t)) : null;
    return { ...t, at: at && !Number.isNaN(at.getTime()) ? at : null };
  } catch {
    return null;
  }
}

export function cookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}
