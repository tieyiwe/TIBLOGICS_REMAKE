export const maxDuration = 300;
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { streamChat } from "@/lib/claude";

const VALID_CATEGORIES = new Set([
  "breaking", "ai-business", "tips", "tools", "case-studies", "industry",
]);

async function regenerate(title: string, sourceTitle?: string | null) {
  const prompt = `Write an informative, engaging blog post for TIBLOGICS (an AI consultancy blog) based on this topic:

Title: "${title}"
${sourceTitle ? `Source: ${sourceTitle}` : ""}

Requirements:
- 450-600 words
- Opening paragraph (no heading needed at start)
- 3-4 subheadings using <h2> tags
- Include a "What This Means for Small Businesses" section
- End with one actionable takeaway in <strong> tags
- Tone: expert but accessible, no jargon without explanation
- Use HTML only: <h2>, <p>, <ul>, <li>, <strong>

Return ONLY a valid JSON object (no markdown, no fences):
{
  "excerpt": "One compelling sentence, max 160 chars",
  "content": "<p>...</p><h2>...</h2>...",
  "category": "industry",
  "tags": ["ai", "business"]
}

category must be exactly one of: breaking, ai-business, tips, tools, case-studies, industry`;

  const raw = await streamChat(
    [{ role: "user", content: prompt }],
    "You are a professional AI technology journalist. Return only valid JSON — no markdown, no extra commentary.",
    1200
  );
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.content || parsed.content.length < 200) throw new Error("Content too short");
  if (!VALID_CATEGORIES.has(parsed.category)) parsed.category = "industry";
  return parsed as { excerpt: string; content: string; category: string; tags: string[] };
}

export async function GET() {
  try {
    // Find posts with thin content (placeholder fallback or very short)
    const allPosts = await prisma.blogPost.findMany({
      select: { id: true, title: true, content: true, sourceTitle: true },
      where: { published: true },
    });

    const thinPosts = allPosts.filter((p) => {
      const text = p.content.replace(/<[^>]*>/g, "").trim();
      return text.length < 400;
    });

    if (thinPosts.length === 0) {
      return NextResponse.json({ message: "All posts have complete content", fixed: 0 });
    }

    let fixed = 0;
    const errors: string[] = [];

    for (const post of thinPosts) {
      try {
        const generated = await regenerate(post.title, post.sourceTitle);
        const wordCount = generated.content.replace(/<[^>]*>/g, "").split(/\s+/).length;

        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            excerpt: generated.excerpt.slice(0, 300),
            content: generated.content,
            category: generated.category,
            tags: Array.isArray(generated.tags) ? generated.tags.slice(0, 10) : [],
            readingTime: Math.max(1, Math.ceil(wordCount / 200)),
          },
        });
        fixed++;
      } catch (e) {
        errors.push(`"${post.title.slice(0, 50)}": ${String(e).slice(0, 100)}`);
      }
    }

    return NextResponse.json({
      message: `Repaired ${fixed} of ${thinPosts.length} thin posts`,
      fixed,
      total: thinPosts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Repair posts error:", err);
    return NextResponse.json({ error: "Repair failed" }, { status: 500 });
  }
}
