import { checkTargetUrl } from "@/lib/ssrf";
import { DEFAULT_LOCALE, type Vars } from "@/lib/i18n/config";
import { translatorFor } from "@/lib/i18n/server";
import { MAX_COMPETITORS } from "./config";
import { hostOf } from "./report";

type T = (key: string, vars?: Vars) => string;

// Validates the sites a subscriber asks us to watch. Used at checkout and when
// a subscriber edits their list, so both refuse the same things.

export type SitesResult =
  | { ok: true; siteUrl: string; competitors: string[] }
  | { ok: false; error: string };

async function one(t: T, raw: unknown, label: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: t("tools.sites.enter", { label }) };
  if (raw.length > 300) return { ok: false, error: t("tools.sites.tooLong", { label }) };
  const checked = await checkTargetUrl(raw);
  if (!checked.ok) return { ok: false, error: t("tools.sites.blocked", { label, reason: t(`tools.block.${checked.reason}`) }) };
  const u = checked.url;
  // Keep the page they named, drop query strings and fragments: tracking
  // parameters would make every run look like a different page.
  const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
  return { ok: true, url: `${u.protocol}//${u.host}${path}` };
}

/** `t` picks the language of the error messages (English by default). */
export async function validateSites(siteRaw: unknown, competitorsRaw: unknown, t: T = translatorFor(DEFAULT_LOCALE)): Promise<SitesResult> {
  const site = await one(t, siteRaw, t("tools.sites.yourSite"));
  if (!site.ok) return site;

  const list = Array.isArray(competitorsRaw) ? competitorsRaw : [];
  const filled = list.filter((c) => typeof c === "string" && c.trim());
  if (filled.length > MAX_COMPETITORS) return { ok: false, error: t("tools.sites.max", { n: MAX_COMPETITORS }) };

  const competitors: string[] = [];
  const seen = new Set([hostOf(site.url)]);
  for (let i = 0; i < filled.length; i++) {
    const label = t("tools.sites.competitor", { n: i + 1 });
    const c = await one(t, filled[i], label);
    if (!c.ok) return c;
    const host = hostOf(c.url);
    if (seen.has(host)) {
      return { ok: false, error: t("tools.sites.duplicate", { label, host }) };
    }
    seen.add(host);
    competitors.push(c.url);
  }
  return { ok: true, siteUrl: site.url, competitors };
}
