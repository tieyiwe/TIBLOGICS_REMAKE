import prisma from "@/lib/prisma";
import { plain } from "@/lib/seo/meta";
import { articleLanguages, articleUrl } from "@/lib/seo/articles";
import { SITE_URL, absUrl } from "@/lib/seo/site";
import type { Locale } from "@/lib/i18n/config";

// RSS 2.0 feed of AI Times: the 50 latest published articles, each with its
// summary and full text (content:encoded), for feed readers, aggregators and
// AI engines that follow feeds. Translations are listed per item as
// alternate-language links. Cached briefly.
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Characters XML 1.0 forbids (control codes) would make the feed invalid.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

export async function GET() {
  const posts = await prisma.blogPost
    .findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { slug: true, title: true, excerpt: true, content: true, category: true, tags: true, author: true, coverImage: true, createdAt: true, updatedAt: true },
    })
    .catch(() => []);
  const langs = await articleLanguages(posts.map((p) => p.slug)).catch(() => new Map<string, Locale[]>());
  const feedUrl = absUrl("/ai-times/feed.xml");
  const lastBuild = posts.reduce((d, p) => (p.updatedAt > d ? p.updatedAt : d), new Date(0));

  const items = posts.map((p) => {
    const url = articleUrl(p.slug);
    const image = p.coverImage && /^https?:\/\//.test(p.coverImage) ? p.coverImage : p.coverImage?.startsWith("/") ? absUrl(p.coverImage) : null;
    const others = (langs.get(p.slug) ?? []).filter((l) => l !== "en");
    return [
      "    <item>",
      `      <title>${esc(p.title)}</title>`,
      `      <link>${esc(url)}</link>`,
      `      <guid isPermaLink="true">${esc(url)}</guid>`,
      `      <pubDate>${p.createdAt.toUTCString()}</pubDate>`,
      `      <dc:creator>${esc(p.author)}</dc:creator>`,
      `      <dc:language>en</dc:language>`,
      `      <category>${esc(p.category)}</category>`,
      ...p.tags.map((tag) => `      <category>${esc(tag)}</category>`),
      `      <description>${esc(plain(p.excerpt))}</description>`,
      `      <content:encoded>${cdata(p.content)}</content:encoded>`,
      ...(image ? [`      <media:content url="${esc(image)}" medium="image" />`] : []),
      ...others.map((l) => `      <atom:link rel="alternate" hreflang="${l}" href="${esc(articleUrl(p.slug, l))}" />`),
      "    </item>",
    ].join("\n");
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>AI Times by TIBLOGICS</title>
    <link>${SITE_URL}/ai-times</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <description>Practical articles on AI for business from TIBLOGICS, an AI implementation agency. Also available in French and Swahili.</description>
    <language>en</language>
    <copyright>© ${new Date().getUTCFullYear()} TIBLOGICS</copyright>
    <lastBuildDate>${(posts.length ? lastBuild : new Date()).toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${SITE_URL}/pwa/icon-192.png</url>
      <title>AI Times by TIBLOGICS</title>
      <link>${SITE_URL}/ai-times</link>
    </image>
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
