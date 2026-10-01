export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";
import { requireAdmin } from "@/lib/require-admin";
import { postToFacebook, postToLinkedIn, postToTwitter } from "@/lib/growth/content/publish";

const PLATFORMS = ["linkedin", "twitter", "facebook", "instagram"] as const;
type Platform = (typeof PLATFORMS)[number];

// The publishing functions live in lib/growth/content/publish.ts, shared with
// the Growth scheduler.

export async function POST(req: NextRequest) {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { platforms, topic, tone, customContent, generate } = await req.json() as {
    platforms: Platform[];
    topic?: string;
    tone?: string;
    customContent?: string;
    generate?: boolean;
  };

  // Each entry is one Claude completion plus one live post to a company social
  // account, so an unbounded or repeated `platforms` array was both a spend and
  // a reputation problem. Accept each platform at most once.
  const targets = Array.isArray(platforms)
    ? [...new Set(platforms.filter((p): p is Platform => PLATFORMS.includes(p)))]
    : [];
  if (targets.length === 0) {
    return NextResponse.json({ error: "At least one valid platform required" }, { status: 400 });
  }
  if (typeof topic === "string" && topic.length > 500) {
    return NextResponse.json({ error: "topic too long" }, { status: 400 });
  }
  if (typeof tone === "string" && tone.length > 200) {
    return NextResponse.json({ error: "tone too long" }, { status: 400 });
  }
  if (typeof customContent === "string" && customContent.length > 5000) {
    return NextResponse.json({ error: "customContent too long" }, { status: 400 });
  }

  const results: Record<string, { success: boolean; content?: string; url?: string; error?: string }> = {};

  for (const platform of targets) {
    let content = customContent ?? "";

    if (generate || !customContent) {
      const platformGuide: Record<Platform, string> = {
        linkedin: "Professional tone. 150-250 words. Use relevant emojis sparingly. End with a question to drive engagement. No hashtags in body, 3-5 hashtags at the end.",
        twitter: "Punchy, under 280 characters. One strong hook. 1-2 hashtags max. No fluff.",
        facebook: "Conversational. 100-200 words. Include a call to action. 2-3 hashtags at end.",
        instagram: "Engaging caption 100-150 words. Storytelling approach. 8-15 relevant hashtags at end.",
      };

      const prompt = `Write a social media post for TIBLOGICS for ${platform}.

Topic: ${topic ?? "AI implementation for small businesses"}
Tone: ${tone ?? "professional but approachable"}
Platform guidelines: ${platformGuide[platform]}

TIBLOGICS is an AI implementation agency that builds custom AI agents, workflow automation, and digital solutions for businesses. Website: tiblogics.com

Write only the post content — no labels, no explanations.`;

      content = await streamChat(
        [{ role: "user", content: prompt }],
        "You are a social media expert for a tech agency. Write only the post content.",
        600,
        "social",
      );
    }

    // Attempt to post
    let postResult: { success: boolean; url?: string; error?: string };
    if (platform === "linkedin") postResult = await postToLinkedIn(content);
    else if (platform === "twitter") postResult = await postToTwitter(content);
    else if (platform === "facebook") postResult = await postToFacebook(content);
    else postResult = { success: false, error: "Instagram posting requires manual or third-party tool (e.g. Buffer)" };

    results[platform] = { ...postResult, content };
  }

  return NextResponse.json({ results });
}
