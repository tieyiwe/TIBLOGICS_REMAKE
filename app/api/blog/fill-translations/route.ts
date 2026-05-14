import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";

export const maxDuration = 300;

const anthropic = new Anthropic();

async function translateOne(
  slug: string,
  post: { title: string; excerpt: string; content: string },
  language: "fr" | "sw"
): Promise<boolean> {
  const cacheKey = `tx:${slug}:${language}`;
  const existing = await prisma.adminSettings.findUnique({ where: { key: cacheKey } });
  if (existing) return false;

  const langNames = { fr: "French", sw: "Swahili" };
  const prompt = `Translate the following article into ${langNames[language]}.

Rules:
- For the "content" field (HTML): preserve ALL HTML tags, attributes, and inline styles exactly. Only translate the visible text inside tags.
- For "title" and "excerpt": translate directly.
- Return ONLY a valid JSON object with exactly these three keys: title, excerpt, content.
- No markdown fences, no explanation, just raw JSON.

---
TITLE:
${post.title}

EXCERPT:
${post.excerpt}

CONTENT (HTML – preserve all tags and attributes):
${post.content.slice(0, 6000)}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  const translated = JSON.parse(jsonStr);
  await prisma.adminSettings.upsert({
    where: { key: cacheKey },
    create: { key: cacheKey, value: JSON.stringify(translated) },
    update: { value: JSON.stringify(translated) },
  });
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== (process.env.CRON_SECRET ?? "fill")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.blogPost.findMany({
    select: { slug: true, title: true, excerpt: true, content: true },
    orderBy: { createdAt: "desc" },
  });

  let translated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const article of articles) {
    for (const lang of ["fr", "sw"] as const) {
      try {
        const done = await translateOne(article.slug, article, lang);
        if (done) translated++;
        else skipped++;
      } catch (e) {
        errors.push(`${article.slug}:${lang} — ${String(e).slice(0, 100)}`);
      }
    }
  }

  return NextResponse.json({ translated, skipped, errors: errors.slice(0, 10) });
}
