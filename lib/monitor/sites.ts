import { checkTargetUrl, BLOCK_MESSAGES } from "@/lib/ssrf";
import { MAX_COMPETITORS } from "./config";
import { hostOf } from "./report";

// Validates the sites a subscriber asks us to watch. Used at checkout and when
// a subscriber edits their list, so both refuse the same things.

export type SitesResult =
  | { ok: true; siteUrl: string; competitors: string[] }
  | { ok: false; error: string };

async function one(raw: unknown, label: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: `${label}: enter a web address` };
  if (raw.length > 300) return { ok: false, error: `${label}: that address is too long` };
  const checked = await checkTargetUrl(raw);
  if (!checked.ok) return { ok: false, error: `${label}: ${BLOCK_MESSAGES[checked.reason]}` };
  const u = checked.url;
  // Keep the page they named, drop query strings and fragments: tracking
  // parameters would make every run look like a different page.
  const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
  return { ok: true, url: `${u.protocol}//${u.host}${path}` };
}

export async function validateSites(siteRaw: unknown, competitorsRaw: unknown): Promise<SitesResult> {
  const site = await one(siteRaw, "Your site");
  if (!site.ok) return site;

  const list = Array.isArray(competitorsRaw) ? competitorsRaw : [];
  const filled = list.filter((c) => typeof c === "string" && c.trim());
  if (filled.length > MAX_COMPETITORS) return { ok: false, error: `Up to ${MAX_COMPETITORS} competitors` };

  const competitors: string[] = [];
  const seen = new Set([hostOf(site.url)]);
  for (let i = 0; i < filled.length; i++) {
    const c = await one(filled[i], `Competitor ${i + 1}`);
    if (!c.ok) return c;
    const host = hostOf(c.url);
    if (seen.has(host)) {
      return { ok: false, error: `Competitor ${i + 1}: ${host} is already on the list` };
    }
    seen.add(host);
    competitors.push(c.url);
  }
  return { ok: true, siteUrl: site.url, competitors };
}
