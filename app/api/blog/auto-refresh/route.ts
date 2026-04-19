export const maxDuration = 120;
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { streamChat } from "@/lib/claude";

const REFRESH_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours

const AI_KEYWORDS = [
  "ai", "llm", "gpt", "claude", "gemini", "machine learning", "openai",
  "anthropic", "neural", "artificial intelligence", "chatgpt", "mistral",
  "generative", "transformer", "langchain", "agent", "rag",
];

const CATEGORY_MAP: Record<string, { emoji: string; gradient: string }> = {
  "breaking":    { emoji: "⚡", gradient: "from-red-600 to-orange-500" },
  "ai-business": { emoji: "💼", gradient: "from-[#1B3A6B] to-[#2251A3]" },
  "tips":        { emoji: "💡", gradient: "from-purple-600 to-violet-500" },
  "tools":       { emoji: "🔧", gradient: "from-teal-600 to-emerald-500" },
  "case-studies":{ emoji: "📊", gradient: "from-[#F47C20] to-yellow-500" },
  "industry":    { emoji: "🌐", gradient: "from-slate-600 to-gray-500" },
};

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
}

interface DevArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  tag_list: string[];
}

function isAIRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

async function fetchHackerNews(): Promise<HNStory[]> {
  try {
    const topIds: number[] = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { signal: AbortSignal.timeout(8000) }
    ).then((r) => r.json());

    const stories = await Promise.all(
      topIds.slice(0, 60).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        })
          .then((r) => r.json())
          .catch(() => null)
      )
    );

    return stories
      .filter((s): s is HNStory => s && s.title && isAIRelated(s.title))
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchDevTo(): Promise<DevArticle[]> {
  try {
    const articles: DevArticle[] = await fetch(
      "https://dev.to/api/articles?tag=ai&per_page=10&top=2",
      { signal: AbortSignal.timeout(8000) }
    ).then((r) => r.json());
    return articles.filter((a) => isAIRelated(a.title)).slice(0, 5);
  } catch {
    return [];
  }
}

async function generatePost(
  title: string,
  sourceUrl: string | undefined,
  sourceTitle: string
): Promise<{ excerpt: string; content: string; category: string; tags: string[] }> {
  const prompt = `Write an informative, engaging blog post for TIBLOGICS (an AI agency blog) based on this news:

Title: "${title}"
Source: ${sourceTitle}

Requirements:
- 450-600 words
- Start with a compelling opening sentence (no "Introduction" heading)
- Use 3-4 subheadings (## format)
- Include a "What This Means for Small Businesses" section
- End with a practical takeaway
- Tone: expert but accessible, no jargon without explanation
- Include HTML formatting: <h2>, <p>, <ul>, <li>, <strong>

Also determine:
- category: one of [breaking, ai-business, tips, tools, case-studies, industry]
- tags: 3-5 relevant lowercase tags as JSON array
- excerpt: 1 compelling sentence (max 160 chars)

Return a JSON object:
{
  "excerpt": "...",
  "content": "<h2>...</h2><p>...</p>...",
  "category": "...",
  "tags": ["...", "..."]
}`;

  try {
    const raw = await streamChat(
      [{ role: "user", content: prompt }],
      "You are a professional AI technology journalist writing for an AI agency blog. Write engaging, accurate, practical content.",
      900
    );
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      excerpt: `${title} — the latest development in AI worth knowing about.`,
      content: `<p>${title}</p>`,
      category: "industry",
      tags: ["ai", "technology"],
    };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkOnly = searchParams.get("check") === "true";
  const force = searchParams.get("force") === "true";

  try {
    const lastRefreshSetting = await prisma.adminSettings.findUnique({
      where: { key: "blog_last_refresh" },
    });
    const lastRefresh = lastRefreshSetting
      ? new Date(lastRefreshSetting.value)
      : null;
    const needsRefresh =
      force || !lastRefresh || Date.now() - lastRefresh.getTime() > REFRESH_INTERVAL_MS;

    if (checkOnly) {
      return NextResponse.json({
        needsRefresh,
        lastRefresh: lastRefresh?.toISOString() ?? null,
        nextRefresh: lastRefresh
          ? new Date(lastRefresh.getTime() + REFRESH_INTERVAL_MS).toISOString()
          : null,
      });
    }

    if (!needsRefresh) {
      return NextResponse.json({ message: "Content is up to date", postsAdded: 0 });
    }

    // Fetch from external sources in parallel
    const [hnStories, devArticles] = await Promise.all([
      fetchHackerNews(),
      fetchDevTo(),
    ]);

    const sources: Array<{ title: string; url?: string; source: string }> = [
      ...hnStories.map((s) => ({
        title: s.title,
        url: s.url,
        source: "Hacker News",
      })),
      ...devArticles.map((a) => ({
        title: a.title,
        url: a.url,
        source: "DEV.to",
      })),
    ];

    let postsAdded = 0;
    const errors: string[] = [];

    for (const item of sources.slice(0, 5)) {
      try {
        // Skip duplicates
        const existing = await prisma.blogPost.findFirst({
          where: { title: { contains: item.title.slice(0, 40) } },
        });
        if (existing) continue;

        const generated = await generatePost(item.title, item.url, item.source);
        const meta = CATEGORY_MAP[generated.category] ?? CATEGORY_MAP["industry"];

        const baseSlug = item.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 70);

        let slug = baseSlug;
        let i = 1;
        while (await prisma.blogPost.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${i++}`;
        }

        await prisma.blogPost.create({
          data: {
            slug,
            title: item.title,
            excerpt: generated.excerpt,
            content: generated.content,
            category: generated.category,
            tags: generated.tags,
            coverEmoji: meta.emoji,
            coverGradient: meta.gradient,
            author: "Echelon AI",
            readingTime: Math.ceil(generated.content.replace(/<[^>]*>/g, "").split(" ").length / 200),
            featured: postsAdded === 0, // first post is featured
            published: true,
            aiGenerated: true,
            sourceUrl: item.url,
            sourceTitle: item.source,
          },
        });
        postsAdded++;
      } catch (e) {
        errors.push(String(e));
      }
    }

    // Update last refresh timestamp
    await prisma.adminSettings.upsert({
      where: { key: "blog_last_refresh" },
      create: { key: "blog_last_refresh", value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });

    await prisma.blogRefreshLog.create({
      data: {
        success: errors.length === 0,
        postsAdded,
        message: errors.length > 0 ? errors.slice(0, 3).join("; ") : null,
      },
    });

    return NextResponse.json({ message: `Added ${postsAdded} new posts`, postsAdded });
  } catch (err) {
    console.error("Auto-refresh error:", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
