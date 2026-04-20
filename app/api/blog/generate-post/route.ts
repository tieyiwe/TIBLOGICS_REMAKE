export const maxDuration = 120;
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { streamChat } from "@/lib/claude";

const CATEGORY_MAP: Record<string, { emoji: string; gradient: string }> = {
  "breaking":    { emoji: "⚡", gradient: "from-red-600 to-orange-500" },
  "ai-business": { emoji: "💼", gradient: "from-[#1B3A6B] to-[#2251A3]" },
  "tips":        { emoji: "💡", gradient: "from-purple-600 to-violet-500" },
  "tools":       { emoji: "🔧", gradient: "from-teal-600 to-emerald-500" },
  "case-studies":{ emoji: "📊", gradient: "from-[#F47C20] to-yellow-500" },
  "industry":    { emoji: "🌐", gradient: "from-slate-600 to-gray-500" },
};

const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_MAP));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, sourceUrl, source } = body;

    // Input validation with strict length limits
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    if (title.length > 300) {
      return NextResponse.json({ error: "title too long (max 300 chars)" }, { status: 400 });
    }
    if (sourceUrl !== undefined && (typeof sourceUrl !== "string" || sourceUrl.length > 500)) {
      return NextResponse.json({ error: "sourceUrl too long" }, { status: 400 });
    }
    if (source !== undefined && (typeof source !== "string" || source.length > 200)) {
      return NextResponse.json({ error: "source too long" }, { status: 400 });
    }

    const prompt = `Write an informative, engaging blog post for TIBLOGICS (an AI consultancy blog) based on this topic:

Title: "${title}"
${source ? `Source: ${source}` : ""}

Requirements:
- 450-600 words
- Opening paragraph (no heading needed at start)
- 3-4 subheadings using <h2> tags
- Include a "What This Means for Small Businesses" section
- End with one actionable takeaway
- Tone: expert but accessible
- Use HTML tags: <h2>, <p>, <ul>, <li>, <strong>
- Do NOT use markdown — only HTML tags

Return ONLY a valid JSON object (no markdown fences, no extra text):
{
  "excerpt": "One compelling sentence, max 160 chars",
  "content": "<p>...</p><h2>...</h2>...",
  "category": "ai-business",
  "tags": ["ai", "business"]
}

category must be one of: breaking, ai-business, tips, tools, case-studies, industry`;

    let generated: { excerpt: string; content: string; category: string; tags: string[] };

    try {
      const raw = await streamChat(
        [{ role: "user", content: prompt }],
        "You are a professional AI technology journalist. Return only valid JSON — no markdown, no extra commentary.",
        1200
      );
      const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      generated = JSON.parse(jsonMatch[0]);
      if (!generated.content || generated.content.length < 100) throw new Error("Content too short");
      // Enforce category whitelist
      if (!VALID_CATEGORIES.has(generated.category)) generated.category = "industry";
    } catch {
      generated = {
        excerpt: `${title.slice(0, 155)} — a key development in AI worth knowing about.`,
        content: `<p>${title}</p><h2>Overview</h2><p>This topic is rapidly evolving. Stay tuned for our full coverage.</p>`,
        category: "industry",
        tags: ["ai", "technology"],
      };
    }

    const meta = CATEGORY_MAP[generated.category] ?? CATEGORY_MAP["industry"];

    const baseSlug = title
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

    const wordCount = generated.content.replace(/<[^>]*>/g, "").split(/\s+/).length;

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: title.slice(0, 300),
        excerpt: (generated.excerpt ?? "").slice(0, 300),
        content: generated.content,
        category: generated.category,
        tags: (Array.isArray(generated.tags) ? generated.tags : []).slice(0, 10),
        coverEmoji: meta.emoji,
        coverGradient: meta.gradient,
        author: "Echelon AI",
        readingTime: Math.max(1, Math.ceil(wordCount / 200)),
        featured: false,
        published: true,
        aiGenerated: true,
        sourceUrl: sourceUrl ? sourceUrl.slice(0, 500) : null,
        sourceTitle: source ? source.slice(0, 200) : null,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("Generate post error:", err);
    return NextResponse.json({ error: "Failed to generate post" }, { status: 500 });
  }
}
