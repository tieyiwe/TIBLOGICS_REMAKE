// Response helpers for the public, read-only machine endpoints (the JSON
// course catalog and the Markdown pages). They carry only public catalog
// data, so any origin may read them (agents running in a browser included),
// and they are cached briefly by browsers and longer by shared caches. The
// data behind them is cached in process (lib/cache/public-data.ts), so a
// burst of requests does not reach the database.

const CACHE = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

const COMMON = {
  "Cache-Control": CACHE,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "X-Content-Type-Options": "nosniff",
};

export function publicJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...COMMON, "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Markdown for agents. Served inline as text/markdown; the canonical Link
 * header points search engines at the HTML page, so the two never compete
 * in results.
 */
export function publicMarkdown(body: string, canonical: string): Response {
  return new Response(body, {
    headers: {
      ...COMMON,
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${canonical}>; rel="canonical"`,
    },
  });
}

export function publicNotFound(kind: "json" | "markdown"): Response {
  return kind === "json"
    ? new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...COMMON, "Cache-Control": "public, max-age=60", "Content-Type": "application/json; charset=utf-8" } })
    : new Response("Not found\n", { status: 404, headers: { ...COMMON, "Cache-Control": "public, max-age=60", "Content-Type": "text/plain; charset=utf-8" } });
}

/** CORS preflight for the public endpoints. */
export function publicOptions(): Response {
  return new Response(null, { status: 204, headers: { ...COMMON, "Access-Control-Max-Age": "86400" } });
}

/** Slugs are lowercase words and dashes; anything else is not a track. */
export const isPublicSlug = (s: string) => /^[A-Za-z0-9][A-Za-z0-9-]{0,120}$/.test(s);
