import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/claude";
import prisma from "@/lib/prisma";

export const maxDuration = 120;

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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    const translated = JSON.parse(jsonStr);
    return NextResponse.json(translated);
  } catch (err) {
    console.error("[POST /api/blog/translate]", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
