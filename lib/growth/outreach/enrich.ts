import type { GrowthLead, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkTargetUrl, safeFetch } from "@/lib/ssrf";
import { addEvent } from "./leads";
import { FREEMAIL, normDomain, normEmail, normPhone } from "./normalize";
import { OFFERS, OFFER_BY_KEY, type Offer } from "./offers";

// Lead enrichment: fetch the lead's own website through the SSRF-guarded
// fetcher, pull out only what the business itself publishes (emails, phone,
// social profiles), detect digital-gap signals, then one cheap Haiku call for
// a fit score, the best TIBLOGICS offer and a one-line opener.
//
// Nothing is guessed: an address is stored only when it appears on the page,
// otherwise the lead is marked "no public email found".

const UA = "Mozilla/5.0 (compatible; TIBLOGICSBot/1.0; +https://tiblogics.com)";
const MAX_BYTES = 1_500_000;

export interface Signals {
  hasWebsite: boolean;
  reachable: boolean;
  https: boolean;
  loadMs: number | null;
  slow: boolean;
  hasBooking: boolean;
  hasChat: boolean;
  hasReviewsLink: boolean;
  hasViewport: boolean;
  hasContactForm: boolean;
  copyrightYear: number | null;
  outdated: boolean;
  outdatedReasons: string[];
  noUnsolicitedNotice: boolean;
  pagesFetched: string[];
  title: string | null;
  description: string | null;
  error?: string;
}

export interface Extracted {
  emails: string[];
  phones: string[];
  socials: Record<string, string>;
  text: string;
  contactLink: string | null;
}

/** Dev/test only: hosts the enricher may fetch although they are private. */
function testHostAllowed(url: URL): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const list = (process.env.GROWTH_ENRICH_TEST_HOSTS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(url.host.toLowerCase()) || list.includes(url.hostname.toLowerCase());
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.length;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
}

async function guardedGet(input: string): Promise<{ ok: boolean; url: string; status: number; html: string; ms: number; error?: string }> {
  const started = Date.now();
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, url: input, status: 0, html: "", ms: 0, error: "Bad URL" };
  }
  try {
    let res: Response;
    const init = { headers: { "User-Agent": UA, Accept: "text/html,*/*;q=0.5" }, signal: AbortSignal.timeout(10_000) };
    if (testHostAllowed(url)) {
      res = await fetch(url, { ...init, redirect: "follow" });
    } else {
      const checked = await checkTargetUrl(url.toString());
      if (!checked.ok) return { ok: false, url: input, status: 0, html: "", ms: 0, error: `Blocked (${checked.reason})` };
      res = await safeFetch(checked.url, init);
    }
    const type = res.headers.get("content-type") ?? "";
    const html = res.ok && /html|text\/plain/i.test(type || "text/html") ? await readCapped(res) : "";
    return { ok: res.ok, url: res.url || url.toString(), status: res.status, html, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, url: input, status: 0, html: "", ms: Date.now() - started, error: err instanceof Error ? err.message.slice(0, 160) : "Fetch failed" };
  }
}

const SOCIAL_HOSTS: Array<[string, RegExp]> = [
  ["facebook", /(^|\.)facebook\.com$/],
  ["instagram", /(^|\.)instagram\.com$/],
  ["linkedin", /(^|\.)linkedin\.com$/],
  ["x", /(^|\.)(twitter|x)\.com$/],
  ["tiktok", /(^|\.)tiktok\.com$/],
  ["youtube", /(^|\.)(youtube\.com|youtu\.be)$/],
];

const JUNK_EMAIL = /(\.(png|jpe?g|gif|svg|webp|css|js)$)|example\.|sentry|wixpress|domain\.com|yourname|youremail|email@email|@2x|noreply|no-reply|u003e/i;

export function extract(html: string, base: string): Extracted {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const socials: Record<string, string> = {};
  let contactLink: string | null = null;
  const baseUrl = new URL(base);

  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const href = m[1].trim();
    if (/^mailto:/i.test(href)) {
      const e = normEmail(decodeURIComponent(href.slice(7)));
      if (e && !JUNK_EMAIL.test(e)) emails.add(e);
      continue;
    }
    if (/^tel:/i.test(href)) {
      const p = decodeURIComponent(href.slice(4)).trim();
      if (normPhone(p)) phones.add(p);
      continue;
    }
    let u: URL;
    try {
      u = new URL(href, baseUrl);
    } catch {
      continue;
    }
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    for (const [name, re] of SOCIAL_HOSTS) {
      if (re.test(host) && !socials[name] && u.pathname.length > 1 && !/sharer|share\?|intent\/|plugins|dialog/i.test(u.toString())) {
        socials[name] = u.toString().split("#")[0];
      }
    }
    if (!contactLink && u.host === baseUrl.host && /contact|about|nous-joindre|contactez/i.test(u.pathname)) {
      contactLink = u.toString().split("#")[0];
    }
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#64;|&commat;/g, "@")
    .replace(/\s+/g, " ")
    .trim();

  for (const m of text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}/gi)) {
    const e = normEmail(m[0]);
    if (e && !JUNK_EMAIL.test(e)) emails.add(e);
  }
  if (phones.size === 0) {
    for (const m of text.matchAll(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g)) {
      phones.add(m[0].trim());
      if (phones.size >= 3) break;
    }
  }
  return { emails: [...emails].slice(0, 10), phones: [...phones].slice(0, 5), socials, text, contactLink };
}

export function detectSignals(html: string, text: string, opts: { https: boolean; ms: number | null }): Omit<Signals, "hasWebsite" | "reachable" | "pagesFetched"> {
  const h = html.toLowerCase();
  const year = new Date().getFullYear();
  const years = [...text.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1])).filter((y) => y > 1995 && y <= year + 1);
  const copyrightYear = years.length ? Math.max(...years) : null;
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const outdatedReasons: string[] = [];
  if (copyrightYear && copyrightYear <= year - 3) outdatedReasons.push(`Copyright ${copyrightYear}`);
  if (!hasViewport) outdatedReasons.push("Not mobile-friendly (no viewport tag)");
  if (/jquery[.-]?1\.\d/.test(h)) outdatedReasons.push("Old jQuery 1.x");
  if (/<font[\s>]|<marquee|<center>|\.swf["']|<frameset/i.test(html)) outdatedReasons.push("Legacy HTML (font/marquee/frames/Flash)");
  const title = /<title[^>]*>([^<]{1,200})<\/title>/i.exec(html)?.[1].trim() ?? null;
  const description = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})/i.exec(html)?.[1].trim() ?? null;
  return {
    https: opts.https,
    loadMs: opts.ms,
    slow: (opts.ms ?? 0) > 3000,
    hasBooking: /calendly|acuityscheduling|booksy|vagaro|fresha|setmore|mindbodyonline|square\.site\/book|squareup\.com\/appointments|opentable|resy\.com|simplybook|janeapp|zocdoc|book (now|online|an appointment)|schedule (an appointment|online|a call)|online booking|réserver|prendre rendez-vous/i.test(h),
    hasChat: /intercom|drift\.com|tawk\.to|crisp\.chat|livechatinc|zendesk|zopim|tidio|hs-scripts|hubspot.*conversations|olark|freshchat|wa\.me\/|api\.whatsapp\.com|messenger.*chat|chatbot/i.test(h),
    hasReviewsLink: /g\.page\/|google\.[a-z.]+\/maps|maps\.app\.goo\.gl|search\.google\.com\/local\/writereview|goo\.gl\/maps|google reviews|avis google/i.test(h),
    hasViewport,
    hasContactForm: /<form[\s\S]{0,2000}?(email|message)/i.test(html),
    copyrightYear,
    outdated: outdatedReasons.length > 0,
    outdatedReasons,
    noUnsolicitedNotice: /(do not|don't|no)\s+(send\s+)?(unsolicited|solicitation|commercial electronic|marketing e-?mails?)/i.test(text),
    title,
    description,
  };
}

/** Fetch the homepage (https first, then http) and one contact/about page. */
export async function crawlLead(website: string | null): Promise<{ signals: Signals; extracted: Extracted }> {
  const empty: Extracted = { emails: [], phones: [], socials: {}, text: "", contactLink: null };
  const base: Signals = {
    hasWebsite: !!website, reachable: false, https: false, loadMs: null, slow: false, hasBooking: false, hasChat: false,
    hasReviewsLink: false, hasViewport: false, hasContactForm: false, copyrightYear: null, outdated: false, outdatedReasons: [],
    noUnsolicitedNotice: false, pagesFetched: [], title: null, description: null,
  };
  if (!website) return { signals: base, extracted: empty };

  const host = normDomain(website);
  let raw = website.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  const tries = raw.startsWith("http://") ? [raw.replace(/^http:/, "https:"), raw] : [raw, raw.replace(/^https:/, "http:")];
  let home: Awaited<ReturnType<typeof guardedGet>> | null = null;
  for (const t of tries) {
    const r = await guardedGet(t);
    if (r.ok && r.html) {
      home = r;
      break;
    }
    if (!home || r.error) home = r;
  }
  if (!home || !home.ok || !home.html) {
    return { signals: { ...base, error: home?.error ?? `HTTP ${home?.status ?? 0}` }, extracted: empty };
  }

  const extracted = extract(home.html, home.url);
  const pages = [home.url];
  let combinedHtml = home.html;
  if (extracted.contactLink && extracted.contactLink !== home.url) {
    const c = await guardedGet(extracted.contactLink);
    if (c.ok && c.html) {
      pages.push(c.url);
      combinedHtml += c.html;
      const more = extract(c.html, c.url);
      extracted.emails = [...new Set([...extracted.emails, ...more.emails])].slice(0, 10);
      extracted.phones = [...new Set([...extracted.phones, ...more.phones])].slice(0, 5);
      extracted.socials = { ...more.socials, ...extracted.socials };
      extracted.text = `${extracted.text} ${more.text}`;
    }
  }
  // Prefer addresses on the business's own domain.
  if (host) extracted.emails.sort((a, b) => Number(b.endsWith(`@${host}`)) - Number(a.endsWith(`@${host}`)));

  const sig = detectSignals(combinedHtml, extracted.text, { https: home.url.startsWith("https:"), ms: home.ms });
  return { signals: { ...base, ...sig, reachable: true, pagesFetched: pages }, extracted };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export function gapsOf(s: Signals): string[] {
  const out: string[] = [];
  if (!s.hasWebsite) out.push("No website");
  else if (!s.reachable) out.push("Website unreachable");
  else {
    if (!s.https) out.push("No SSL (http only)");
    if (s.slow) out.push(`Slow homepage (${((s.loadMs ?? 0) / 1000).toFixed(1)}s)`);
    if (!s.hasBooking) out.push("No online booking");
    if (!s.hasChat) out.push("No chat / instant reply");
    if (s.outdated) out.push(`Outdated site: ${s.outdatedReasons.join(", ")}`);
    if (!s.hasReviewsLink) out.push("No Google reviews link");
  }
  return out;
}

function industryOffer(industry: string | null): Offer | null {
  const i = (industry ?? "").toLowerCase();
  if (!i) return null;
  return OFFERS.find((o) => o.kind === "product" && o.industries?.some((k) => i.includes(k))) ?? null;
}

/** Deterministic score; also the fallback when the model call fails. */
export function heuristicScore(lead: Pick<GrowthLead, "companyName" | "industry" | "area" | "contactName">, s: Signals, email: string | null) {
  let score = 35;
  const reasons: string[] = [];
  const gaps = gapsOf(s);
  if (!s.hasWebsite || !s.reachable) {
    score += 20;
    reasons.push("No working website: clear need for a site and online presence");
  } else {
    if (!s.hasBooking) { score += 8; reasons.push("No online booking: AI booking assistant fits"); }
    if (!s.hasChat) { score += 7; reasons.push("No chat or instant reply on the site"); }
    if (s.outdated) { score += 8; reasons.push("Site looks outdated"); }
    if (!s.https) { score += 5; reasons.push("No SSL"); }
    if (s.slow) { score += 4; reasons.push("Slow homepage"); }
  }
  if (email) { score += 10; reasons.push("Public business email available"); } else { score -= 10; reasons.push("No public email: manual channels only"); }
  if (lead.industry) score += 3;
  if (lead.contactName) score += 3;
  score = Math.max(0, Math.min(100, score));

  let offer: Offer;
  if (!s.hasWebsite || !s.reachable || s.outdated || !s.https) offer = OFFER_BY_KEY.get("web-development")!;
  else if (!s.hasBooking || !s.hasChat) offer = OFFER_BY_KEY.get("ai-implementation")!;
  else offer = industryOffer(lead.industry) ?? OFFER_BY_KEY.get("website-scanner")!;

  const gap = gaps[0];
  const opener = gap === "No website"
    ? `I couldn't find a website for ${lead.companyName}, which likely means customers searching online land on competitors first.`
    : gap
      ? `I had a quick look at ${lead.companyName}'s website and noticed: ${gap.charAt(0).toLowerCase() + gap.slice(1)}.`
      : `I came across ${lead.companyName}${lead.area ? ` in ${lead.area}` : ""} and had a quick look at how you handle enquiries online.`;
  return { score, reasons, offerKey: offer.key, offerReason: offer.fitsWhen, opener };
}

const SCORE_SYSTEM = `You qualify small-business leads for TIBLOGICS, an AI implementation studio (done-for-you AI assistants, workflow automation, websites, AI training, self-serve AI tools, courses and industry prompt packs).
Return ONLY a JSON object, no markdown:
{"score": 0-100 integer fit score, "reasons": ["3-5 short reasons, each grounded in the facts given"], "offer": "<one offer key from the list>", "offerReason": "one sentence on why that offer fits", "opener": "one-sentence personalised email opener"}
Rules:
- Use only the facts provided. Never invent names, numbers, reviews, revenue, staff or anything not in the facts.
- The opener must reference one concrete, verifiable observation from the facts (e.g. no online booking, the site has no SSL), be under 30 words, plain and respectful, no flattery, no exclamation marks, no emojis, and must not mention AI hype.
- Score high (70+) only when there is a clear digital gap TIBLOGICS solves AND a way to reach them.`;

export async function scoreLead(lead: GrowthLead, s: Signals, email: string | null, pageText: string) {
  const fallback = heuristicScore(lead, s, email);
  const facts = {
    company: lead.companyName,
    industry: lead.industry,
    area: lead.area,
    contactRole: lead.role,
    website: lead.website,
    publicEmailFound: !!email,
    gaps: gapsOf(s),
    siteTitle: s.title,
    siteDescription: s.description,
    pageExcerpt: pageText.slice(0, 1500),
  };
  const offers = OFFERS.map((o) => `${o.key}: ${o.name} (fits when: ${o.fitsWhen})`).join("\n");
  try {
    const { text } = await runClaude("lead-score", {
      system: SCORE_SYSTEM,
      messages: [{ role: "user", content: `Offers (key: name):\n${offers}\n\nLead facts (JSON):\n${JSON.stringify(facts)}` }],
      meta: { ref: `growth-lead:${lead.id}` },
    });
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no JSON");
    const j = JSON.parse(m[0]) as { score?: unknown; reasons?: unknown; offer?: unknown; offerReason?: unknown; opener?: unknown };
    const score = Number(j.score);
    const offerKey = typeof j.offer === "string" && OFFER_BY_KEY.has(j.offer) ? j.offer : fallback.offerKey;
    return {
      score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : fallback.score,
      reasons: Array.isArray(j.reasons) ? j.reasons.filter((r): r is string => typeof r === "string").map((r) => r.slice(0, 200)).slice(0, 6) : fallback.reasons,
      offerKey,
      offerReason: typeof j.offerReason === "string" ? j.offerReason.slice(0, 300) : fallback.offerReason,
      opener: typeof j.opener === "string" && j.opener.trim() ? j.opener.trim().slice(0, 300) : fallback.opener,
      ai: true,
    };
  } catch (err) {
    console.warn("[growth/enrich] model scoring failed, using heuristic", err instanceof Error ? err.message : err);
    return { ...fallback, ai: false };
  }
}

/** Full enrichment for one lead; writes results and a timeline event. */
export async function enrichLead(lead: GrowthLead): Promise<GrowthLead> {
  const { signals, extracted } = await crawlLead(lead.website);
  const ownDomain = normDomain(lead.website);
  // Prefer an address on the business's domain; free mailboxes only when that is what they publish.
  const published = extracted.emails.filter((e) => !ownDomain || e.endsWith(`@${ownDomain}`) || FREEMAIL.has(e.split("@")[1]));
  const publicEmails = published.length ? published : extracted.emails;
  const bestPublic = publicEmails[0] ?? null;
  const email = lead.email ?? bestPublic;
  const emailStatus = lead.email ? (publicEmails.includes(lead.email) ? "found_public" : lead.emailStatus === "unknown" ? "provided" : lead.emailStatus) : bestPublic ? "found_public" : "none_found";

  const scored = await scoreLead(lead, signals, email, extracted.text);
  const data: Prisma.GrowthLeadUpdateInput = {
    signals: signals as unknown as Prisma.InputJsonValue,
    socials: extracted.socials as Prisma.InputJsonValue,
    publicEmails: publicEmails as Prisma.InputJsonValue,
    emailStatus,
    score: scored.score,
    scoreReasons: scored.reasons as Prisma.InputJsonValue,
    bestOffer: scored.offerKey,
    offerReason: scored.offerReason,
    opener: scored.opener,
    enrichStatus: "done",
    enrichError: signals.error ?? null,
    enrichedAt: new Date(),
  };
  if (!lead.email && bestPublic) {
    data.email = bestPublic;
    // Published conspicuously on their own site with no "no unsolicited
    // email" notice: the CASL implied-consent basis, recorded with where.
    if (lead.consentBasis === "unset" && !signals.noUnsolicitedNotice) {
      data.consentBasis = "implied_published";
      data.consentNote = `Published on ${signals.pagesFetched.join(", ")} (seen ${new Date().toISOString().slice(0, 10)})`;
    }
  }
  if (!lead.phone && extracted.phones[0]) {
    data.phone = extracted.phones[0];
    data.phoneNorm = normPhone(extracted.phones[0]);
  }
  if (!lead.linkedinUrl && extracted.socials.linkedin) data.linkedinUrl = extracted.socials.linkedin;
  if (lead.stage === "new") data.stage = "enriched";

  const updated = await prisma.growthLead.update({ where: { id: lead.id }, data });
  await addEvent(
    lead.id,
    "enriched",
    `Score ${scored.score}${scored.ai ? "" : " (heuristic)"} · ${email ? (bestPublic && !lead.email ? `public email found: ${bestPublic}` : "email on file") : "no public email found"}${signals.error ? ` · site: ${signals.error}` : ""}`,
    { gaps: gapsOf(signals), offer: scored.offerKey },
  );
  return updated;
}

// ── Queue ───────────────────────────────────────────────────────────────────

export async function enqueueEnrich(ids: string[]): Promise<number> {
  const r = await prisma.growthLead.updateMany({
    where: { id: { in: ids.slice(0, 2000) }, enrichStatus: { not: "running" } },
    data: { enrichStatus: "queued", enrichError: null },
  });
  return r.count;
}

/**
 * Works through the queue, at most `max` leads and one at a time. Each lead is
 * claimed (queued → running) before work so two workers never take the same
 * one. Rate-limited globally so bulk runs stay polite to the sites and cheap.
 */
export async function processEnrichQueue(max = 3): Promise<{ processed: number; failed: number; remaining: number; limited: boolean }> {
  // A worker that died mid-lead leaves it "running": give it back after 5 min.
  await prisma.growthLead.updateMany({
    where: { enrichStatus: "running", updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } },
    data: { enrichStatus: "queued" },
  });
  let processed = 0;
  let failed = 0;
  let limited = false;
  for (let i = 0; i < max; i++) {
    const next = await prisma.growthLead.findFirst({ where: { enrichStatus: "queued" }, orderBy: { updatedAt: "asc" } });
    if (!next) break;
    if (!(await checkRateLimit("growth-enrich", Number(process.env.GROWTH_ENRICH_PER_MIN) || 20, 60_000))) {
      limited = true;
      break;
    }
    const claim = await prisma.growthLead.updateMany({ where: { id: next.id, enrichStatus: "queued" }, data: { enrichStatus: "running" } });
    if (claim.count !== 1) continue;
    try {
      await enrichLead(next);
      processed++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message.slice(0, 300) : "Enrichment failed";
      await prisma.growthLead.update({ where: { id: next.id }, data: { enrichStatus: "failed", enrichError: msg } });
      await addEvent(next.id, "enrich_failed", msg);
    }
  }
  const remaining = await prisma.growthLead.count({ where: { enrichStatus: { in: ["queued", "running"] } } });
  return { processed, failed, remaining, limited };
}
