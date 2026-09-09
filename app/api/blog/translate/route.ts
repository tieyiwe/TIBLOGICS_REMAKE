import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";

export const maxDuration = 60;

const haiku = new Anthropic().messages;

const LANG_NAMES: Record<string, string> = {
  fr: "French",
  sw: "Swahili",
};

export async function POST(req: NextRequest) {
  try {
    const { slug, language } = await req.json();

    if (!slug || !LANG_NAMES[language]) {
      return NextResponse.json({ error: "slug and language (fr|sw) required" }, { status: 400 });
    }

    // Check DB cache first — instant if already translated
    const cacheKey = `tx:${slug}:${language}`;
    try {
      const cached = await prisma.adminSettings.findUnique({ where: { key: cacheKey } });
      if (cached?.value) {
        return NextResponse.json(JSON.parse(cached.value));
      }
    } catch { /* cache miss — proceed */ }

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { title: true, excerpt: true, content: true },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const langName = LANG_NAMES[language];

    const prompt = `Translate the following article into ${langName}.

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
${post.content}`;

    const response = await haiku.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    const translated = JSON.parse(jsonStr);

    // Save to DB cache so future requests for this slug+language are instant
    try {
      await prisma.adminSettings.upsert({
        where: { key: cacheKey },
        create: { key: cacheKey, value: JSON.stringify(translated) },
        update: { value: JSON.stringify(translated) },
      });
    } catch { /* non-blocking */ }

    return NextResponse.json(translated);
  } catch (err) {
    console.error("[POST /api/blog/translate]", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
