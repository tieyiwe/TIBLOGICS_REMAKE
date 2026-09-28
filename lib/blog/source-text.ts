import { checkTargetUrl, safeFetch } from "@/lib/ssrf";

/**
 * The text of the article a news item links to, or null if it cannot be read.
 *
 * The agent used to write every news piece from the headline alone, then told
 * the model to open with "the most striking verified fact" — when nothing had
 * been verified, so every specific in those articles was the model's guess.
 * Now it reads the source first. Goes through the SSRF guard because these
 * URLs come from Hacker News and DEV.to, i.e. from anyone.
 */
export async function fetchSourceText(url: string): Promise<string | null> {
  try {
    const checked = await checkTargetUrl(url);
    if (!checked.ok) return null;
    const res = await safeFetch(checked.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TIBLOGICS-AITimes/1.0; +https://tiblogics.com)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml|text\/plain/i.test(type)) return null;
    const raw = (await res.text()).slice(0, 2_000_000);
    return extractArticleText(raw);
  } catch {
    return null;
  }
}

/** Readable text from an HTML page: the article if one is marked, else the body. */
export function extractArticleText(html: string): string | null {
  const article =
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
    html.match(/<main[\s\S]*?<\/main>/i)?.[0];
  const body = article && article.length > 1500 ? article : html;
  const text = body
    .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  // Under this, it is a cookie wall, a login page or a paywall stub — not
  // something an article can honestly be written from.
  if (text.length < 600) return null;
  return text.slice(0, 12_000);
}

