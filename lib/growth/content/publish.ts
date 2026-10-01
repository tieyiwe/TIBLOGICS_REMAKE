// Publishing to company social accounts. Moved here from the Aria route
// (app/api/admin/agents/aria/post) so Aria and the Growth scheduler share one
// implementation. Server only: reads tokens from the environment.
//
//   LinkedIn: LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN (urn:li:person:… or urn:li:organization:…)
//   X:        TWITTER_BEARER_TOKEN (or the TWITTER_API_KEY/SECRET + ACCESS_TOKEN/SECRET set)
//   Facebook: FACEBOOK_PAGE_ID + FACEBOOK_PAGE_ACCESS_TOKEN
//   Instagram and WhatsApp Status have no publishing API here: the queue
//   marks them "ready to post" with a copy button and deep link.

import type { Platform } from "./platforms";

export interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function postToLinkedIn(text: string, imageUrl?: string): Promise<PublishResult> {
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
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err.slice(0, 1000) };
  }
  const id = res.headers.get("x-restli-id");
  return { success: true, url: id ? `https://www.linkedin.com/feed/update/${id}` : undefined };
}

export async function postToTwitter(text: string): Promise<PublishResult> {
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
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err.slice(0, 1000) };
  }
  const data = await res.json().catch(() => ({}));
  return { success: true, url: data?.data?.id ? `https://twitter.com/tiblogics/status/${data.data.id}` : undefined };
}

export async function postToFacebook(text: string): Promise<PublishResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !pageToken) return { success: false, error: "FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN not set" };

  const res = await fetch(`https://graph.facebook.com/${encodeURIComponent(pageId)}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: pageToken }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err.slice(0, 1000) };
  }
  const data = await res.json().catch(() => ({}));
  return { success: true, url: data?.id ? `https://www.facebook.com/${data.id}` : undefined };
}

/** Whether the server holds the credentials to publish to this platform. */
export function platformConfigured(platform: Platform): boolean {
  const e = process.env;
  switch (platform) {
    case "linkedin":
      return !!(e.LINKEDIN_ACCESS_TOKEN && e.LINKEDIN_PERSON_URN);
    case "x":
      return !!(e.TWITTER_BEARER_TOKEN || (e.TWITTER_API_KEY && e.TWITTER_API_SECRET && e.TWITTER_ACCESS_TOKEN && e.TWITTER_ACCESS_TOKEN_SECRET));
    case "facebook":
      return !!(e.FACEBOOK_PAGE_ID && e.FACEBOOK_PAGE_ACCESS_TOKEN);
    default:
      return false;
  }
}

export function configuredPlatforms(): Record<Platform, boolean> {
  return {
    linkedin: platformConfigured("linkedin"),
    x: platformConfigured("x"),
    facebook: platformConfigured("facebook"),
    instagram: false,
    whatsapp: false,
  };
}

/** Publish one post. Only call after platformConfigured() is true. */
export async function publishTo(platform: Platform, text: string): Promise<PublishResult> {
  try {
    if (platform === "linkedin") return await postToLinkedIn(text);
    if (platform === "x") return await postToTwitter(text);
    if (platform === "facebook") return await postToFacebook(text);
    return { success: false, error: `${platform} has no publishing API; post it by hand` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
