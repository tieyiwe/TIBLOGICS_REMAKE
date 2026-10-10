import { buildLlmsTxt } from "@/lib/seo/llms";

// /llms.txt for AI engines (https://llmstxt.org), generated from the live
// catalog so prices and tracks never go stale. Cached briefly at the edge.
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await buildLlmsTxt();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
