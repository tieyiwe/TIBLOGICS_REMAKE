import type { MetadataRoute } from "next";
import { SITE_HOST, SITE_URL } from "@/lib/seo/site";

// robots.txt. Public content is open to search engines AND to AI crawlers:
// being readable by ChatGPT, Perplexity, Claude, Gemini, Copilot and Apple
// Intelligence is how TIBLOGICS gets cited in AI answers, so they are named
// explicitly and allowed. Private areas are closed to everyone.
//
// A crawler that matches a named group ignores the "*" group, so every
// group repeats the same Disallow list.
//
// Prefixes are written with care: "/learn" alone would also block
// "/learning-box", and "/toolkit" would block nothing public today but is
// anchored anyway.

const PRIVATE = [
  "/admin_pro",
  "/api/",
  "/learn/",
  "/learn$",
  "/go/",
  "/r/",
  "/toolkit$",
  "/toolkit/",
  "/blueprint/",
  "/monitor/",
  "/join-team/",
  "/store/success",
  "/book/success",
  "/events/*/confirmed",
  "/free/*/access",
  "/_next/data/",
  "/*?*payment=",
  "/*?*canceled=",
];

// Article cover images are served from here; keep them crawlable for image
// search and rich results even though the rest of /api is closed.
const ALLOW = ["/", "/api/blog/cover/"];

/** Search engines and AI crawlers, by their published user-agent tokens. */
const CRAWLERS = [
  // Search engines
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "YandexBot",
  // OpenAI: ChatGPT search, user-initiated browsing, training
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Anthropic: Claude search, user-initiated fetches, training
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "anthropic-ai",
  // Google Gemini / AI Overviews grounding and Apple Intelligence (control tokens)
  "Google-Extended",
  "Applebot-Extended",
  // Microsoft Copilot uses Bingbot; Meta AI; Common Crawl (feeds many models);
  // Mistral; DuckDuckGo AI answers; Amazon (Alexa/Rufus); ByteDance
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "CCBot",
  "MistralAI-User",
  "DuckAssistBot",
  "Amazonbot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: CRAWLERS, allow: ALLOW, disallow: PRIVATE },
      { userAgent: "*", allow: ALLOW, disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_HOST,
  };
}
