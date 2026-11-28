import { academyMarkdown } from "@/lib/seo/markdown";
import { absUrl } from "@/lib/seo/site";
import { publicMarkdown } from "@/lib/seo/public-response";

// /learning-box.md: the ARFA catalog as Markdown for AI agents (what ARFA
// is, every track, prices, certificates). The /learning-box page links here
// with <link rel="alternate" type="text/markdown">.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return publicMarkdown(await academyMarkdown(), absUrl("/learning-box"));
  } catch (err) {
    console.error("[GET /learning-box.md]", err);
    return new Response("Temporarily unavailable\n", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
