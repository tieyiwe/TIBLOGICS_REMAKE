import { buildLlmsFullTxt } from "@/lib/seo/llms";

// /llms-full.txt: every service, track, FAQ and fact in one plain-text file
// for AI assistants. Generated from the live database; cached briefly.
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await buildLlmsFullTxt();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
