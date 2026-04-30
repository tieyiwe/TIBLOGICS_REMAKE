export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamChat } from "@/lib/claude";

type Platform = "linkedin" | "twitter" | "facebook" | "instagram";

async function postToLinkedIn(text: string, imageUrl?: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const urn = process.env.LINKEDIN_PERSON_URN; // urn:li:person:xxx or urn:li:organization:xxx
  if (!token || !urn) return { success: false, error: "LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_URN not set" };

  const body: Record<string, unknown> = {
    author: urn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
        ...(imageUrl ? { media: [{ status: "READY", description: { text: "TIBLOGICS" }, media: imageUrl, title: { text: "TIBLOGICS" } }] } : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }
  return { success: true };
}

async function postToTwitter(text: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!bearerToken && !(apiKey && apiSecret && accessToken && accessSecret)) {
    return { success: false, error: "Twitter API credentials not configured" };
  }

  // Use OAuth 1.0a with user access token for posting
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }
  const data = await res.json();
  return { success: true, url: `https://twitter.com/tiblogics/status/${data.data?.id}` };
}

async function postToFacebook(text: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !pageToken) return { success: false, error: "FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN not set" };

  const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: pageToken }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }
  return { success: true };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platforms, topic, tone, customContent, generate } = await req.json() as {
    platforms: Platform[];
    topic?: string;
    tone?: string;
    customContent?: string;
    generate?: boolean;
  };

  if (!platforms?.length) return NextResponse.json({ error: "At least one platform required" }, { status: 400 });

  const results: Record<string, { success: boolean; content?: string; url?: string; error?: string }> = {};

  for (const platform of platforms) {
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
