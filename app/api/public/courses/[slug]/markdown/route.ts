import { trackMarkdown } from "@/lib/seo/markdown";
import { absUrl } from "@/lib/seo/site";
import { isPublicSlug, publicNotFound, publicOptions, publicMarkdown } from "@/lib/seo/public-response";

// One track as Markdown for AI agents. Public URL: /learning-box/<slug>.md
// (a rewrite in next.config.js); the track page links here with
// <link rel="alternate" type="text/markdown">.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPublicSlug(slug)) return publicNotFound("markdown");
  try {
    const body = await trackMarkdown(slug);
    return body ? publicMarkdown(body, absUrl(`/learning-box/${slug}`)) : publicNotFound("markdown");
  } catch (err) {
    console.error("[GET /learning-box/:slug.md]", err);
    return new Response("Temporarily unavailable\n", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

export const OPTIONS = publicOptions;
