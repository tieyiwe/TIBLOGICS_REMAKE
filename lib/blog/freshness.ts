// Keeping AI Times current: what counts as news, and how old is too old.
//
// The agent used to accept Hacker News and DEV.to stories up to 30 days old,
// feed items up to 14 days old, and never looked at the date of the article it
// was writing from, so a 2019 blog post resurfacing on Hacker News could be
// written up today as if it had just happened. Now:
//   - candidate stories must be at most NEWS_MAX_AGE_DAYS old (default 4);
//   - headlines marked with an earlier year ("(2019)", the Hacker News
//     convention for old articles) are skipped;
//   - the source page's own publication date is read, and a source older than
//     the limit is skipped before anything is written.
//
//   AI_TIMES_MAX_AGE_DAYS  1 to 14 (default 4)

const n = Number(process.env.AI_TIMES_MAX_AGE_DAYS);
export const NEWS_MAX_AGE_DAYS = Number.isFinite(n) && n >= 1 && n <= 14 ? n : 4;
export const NEWS_MAX_AGE_MS = NEWS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/** True when a date is older than the news window. */
export function tooOld(d: Date | null | undefined, now = Date.now()): boolean {
  return !!d && now - d.getTime() > NEWS_MAX_AGE_MS;
}

/** A headline that says it is about an earlier year's article: "Title (2019)", "[2021]". */
export function isDatedOldHeadline(title: string, year = new Date().getUTCFullYear()): boolean {
  const m = /[([]((?:19|20)\d{2})[)\]]\s*$/.exec(title.trim());
  return !!m && Number(m[1]) < year;
}

/**
 * When the page says it was published: Open Graph / article meta, schema.org
 * JSON-LD, or the first <time datetime>. Null when the page does not say (or
 * the date is in the future, which means it is not a publication date).
 */
export function extractPublishedDate(html: string): Date | null {
  const head = html.slice(0, 400_000);
  const candidates: string[] = [];
  const meta = (re: RegExp) => {
    for (const m of head.matchAll(re)) if (m[1]) candidates.push(m[1]);
  };
  const names = "article:published_time|og:published_time|datePublished|date|pubdate|publish-date|parsely-pub-date|sailthru\\.date|dc\\.date|DC\\.date\\.issued";
  meta(new RegExp(`<meta[^>]+(?:property|name|itemprop)=["'](?:${names})["'][^>]*content=["']([^"']+)["']`, "gi"));
  meta(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["'](?:${names})["']`, "gi"));
  meta(/"datePublished"\s*:\s*"([^"]+)"/g);
  meta(/<time[^>]+datetime=["']([^"']+)["']/gi);
  const now = Date.now();
  for (const c of candidates) {
    const d = new Date(c.trim());
    if (!isNaN(d.getTime()) && d.getTime() <= now + 36 * 3600_000 && d.getUTCFullYear() >= 1995) return d;
  }
  return null;
}

/** "2026-10-03 (2 days ago)" for the writer's prompt. */
export function describeAge(d: Date | null, now = Date.now()): string {
  if (!d) return "unknown (the page does not give a date)";
  const days = Math.floor((now - d.getTime()) / 86_400_000);
  return `${d.toISOString().slice(0, 10)} (${days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`})`;
}
