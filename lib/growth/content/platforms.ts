// Social platforms the Growth queue knows about. Client-safe: no server
// imports, so the calendar UI shares the same limits and deep links.

export const PLATFORMS = ["linkedin", "x", "facebook", "instagram", "whatsapp"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const LANGUAGES = ["en", "fr", "sw"] as const;
export type Language = (typeof LANGUAGES)[number];
export const LANGUAGE_LABEL: Record<Language, string> = { en: "English", fr: "French", sw: "Swahili" };

export interface PlatformInfo {
  id: Platform;
  label: string;
  color: string;
  /** Hard character limit for the whole post (text + link + hashtags). */
  maxChars: number;
  /** Writing guidance sent to the model. */
  guide: string;
  /** Hashtag range the model aims for. */
  hashtags: [number, number];
  /** Can the server publish it (when its tokens are set)? */
  api: boolean;
  /** Suggested local posting times ("HH:MM"), weekdays 1=Mon..7=Sun. */
  bestTimes: { days: number[]; times: string[] };
}

export const PLATFORM_INFO: Record<Platform, PlatformInfo> = {
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    maxChars: 3000,
    guide: "Professional, first-person business voice. 120-220 words. Strong first line (it shows before 'see more'). Short paragraphs. End with a question or a clear call to action.",
    hashtags: [3, 5],
    api: true,
    bestTimes: { days: [2, 3, 4], times: ["08:30", "12:00"] },
  },
  x: {
    id: "x",
    label: "X",
    color: "#0D1B2A",
    maxChars: 280,
    guide: "One punchy idea. The whole post, including the link (count it as 24 characters) and hashtags, must fit in 280 characters. No thread.",
    hashtags: [1, 2],
    api: true,
    bestTimes: { days: [1, 2, 3, 4, 5], times: ["09:00", "12:30", "17:00"] },
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    maxChars: 5000,
    guide: "Warm and conversational. 60-150 words. One clear call to action.",
    hashtags: [2, 3],
    api: true,
    bestTimes: { days: [1, 2, 3, 4, 5], times: ["09:00", "13:00"] },
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    color: "#C13584",
    maxChars: 2200,
    guide: "Caption for an image or carousel. Story-led hook in the first line, 60-150 words, line breaks, a call to action pointing to the link in bio.",
    hashtags: [6, 12],
    api: false,
    bestTimes: { days: [1, 2, 3, 4, 5, 6], times: ["11:00", "19:00"] },
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp Status",
    color: "#25D366",
    maxChars: 700,
    guide: "WhatsApp Status text: very short (under 60 words), personal and direct, one emoji at most, the link on its own line. No hashtags.",
    hashtags: [0, 0],
    api: false,
    bestTimes: { days: [1, 2, 3, 4, 5, 6, 7], times: ["07:30", "20:00"] },
  },
};

export function isPlatform(v: unknown): v is Platform {
  return typeof v === "string" && (PLATFORMS as readonly string[]).includes(v);
}
export function isLanguage(v: unknown): v is Language {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

export const POST_STATUSES = ["draft", "scheduled", "publishing", "published", "ready", "failed", "rejected"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  ready: "Ready to post",
  failed: "Failed",
  rejected: "Rejected",
};

/** The text that goes out: body, then the tracked link, then hashtags. */
export function composePost(p: { platform: string; body: string; hashtags?: unknown; shortUrl?: string | null }): string {
  const tags = Array.isArray(p.hashtags)
    ? p.hashtags.filter((h): h is string => typeof h === "string" && h.trim() !== "").map((h) => (h.startsWith("#") ? h : `#${h}`))
    : [];
  const parts = [p.body.trim()];
  if (p.shortUrl) parts.push(p.shortUrl);
  if (tags.length && p.platform !== "whatsapp") parts.push(tags.join(" "));
  return parts.filter(Boolean).join("\n\n");
}

/** A share/compose URL that opens the platform with the text ready (where possible). */
export function deepLink(platform: Platform, text: string, url?: string | null): string {
  const t = encodeURIComponent(text);
  switch (platform) {
    case "linkedin":
      return `https://www.linkedin.com/feed/?shareActive=true&text=${t}`;
    case "x":
      return `https://x.com/intent/post?text=${t}`;
    case "facebook":
      return url ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` : "https://www.facebook.com/";
    case "instagram":
      return "https://www.instagram.com/";
    case "whatsapp":
      return `https://wa.me/?text=${t}`;
  }
}
