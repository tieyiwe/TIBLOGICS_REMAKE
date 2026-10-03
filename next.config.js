/** @type {import('next').NextConfig} */

// Auto-detect production URL on Replit if NEXTAUTH_URL isn't explicitly set.
// NextAuth requires this to match the actual hostname for cookie domain and
// CSRF validation to work correctly in production.
if (!process.env.NEXTAUTH_URL) {
  if (process.env.NODE_ENV !== "production" && process.env.REPLIT_DEV_DOMAIN) {
    // Dev workspace: auth must point at the dev URL, not the production domain
    process.env.NEXTAUTH_URL = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    // Production with explicitly configured custom domain (set in Replit Secrets)
    process.env.NEXTAUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    // Production on Replit without a custom domain configured
    process.env.NEXTAUTH_URL = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  } else if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = "https://tiblogics.com";
  }
}

// Crawlers that must get the page's <title>, meta tags and canonical in the
// <head> of the first response (blocking metadata) rather than streamed in
// later. Next's default list covers the classic search engines; the AI
// crawlers that read pages for ChatGPT, Claude, Perplexity, Meta AI, Copilot
// and others are added here. Keep the default list first: setting this
// option replaces it (next/dist/shared/lib/router/utils/html-bots.js).
const DEFAULT_HTML_LIMITED_BOTS =
  "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";
const AI_CRAWLERS =
  "GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|CCBot|Meta-ExternalAgent|Meta-ExternalFetcher|Amazonbot|DuckAssistBot|MistralAI-User|Bytespider|cohere-ai|YouBot|Diffbot|PetalBot|Applebot-Extended";

// The commit this build was made from, shown in the admin so the owner can
// see which version is live (empty when git is not available). Worked out
// only while building (it is baked into the client code), not on every start.
function buildSha() {
  if (process.env.BUILD_SHA) return process.env.BUILD_SHA;
  try {
    return require("child_process").execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return ""; // not a git checkout
  }
}

const nextConfig = {
  htmlLimitedBots: new RegExp(`${DEFAULT_HTML_LIMITED_BOTS}|${AI_CRAWLERS}`, "i"),
  allowedDevOrigins: [process.env.REPLIT_DEV_DOMAIN].filter(Boolean),
  compress: true,
  poweredByHeader: false,
  // ffmpeg-static resolves its binary from its own folder, and Replit Object
  // Storage pulls in the Google Cloud SDK: both stay plain Node requires.
  serverExternalPackages: ["@prisma/client", "prisma", "ffmpeg-static", "@replit/object-storage"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "fonts.gstatic.com" },
      { protocol: "https", hostname: "image.thum.io" },
    ],
  },
  experimental: {
    // @radix-ui/react-icons was listed here but was never a dependency.
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      // One canonical host: www.tiblogics.com → tiblogics.com (301-equivalent
      // 308, path and query kept), so search engines never split signals
      // between two hosts.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tiblogics.com" }],
        destination: "https://tiblogics.com/:path*",
        permanent: true,
      },
      { source: "/blog", destination: "/ai-times", permanent: true },
      { source: "/blog/:slug", destination: "/ai-times/:slug", permanent: true },
      // "Courses" became "Learning Box". Certificates issued before the rename
      // link to /courses, so these have to keep working indefinitely.
      { source: "/courses", destination: "/learning-box", permanent: true },
      { source: "/courses/:slug", destination: "/learning-box/:slug", permanent: true },
      // The catalog is presented as the AI Academy (ARFA); its URL stays /learning-box.
      { source: "/ai-academy", destination: "/learning-box", permanent: true },
      { source: "/academy", destination: "/learning-box", permanent: true },
      // "Shop" became "Store". Order matters: the more specific paths first,
      // so /shop/:slug does not swallow them. /shop/covers/* is a public asset
      // directory, two segments deep, so /shop/:slug never matches it.
      { source: "/shop", destination: "/store", permanent: true },
      { source: "/shop/success", destination: "/store/success", permanent: true },
      { source: "/shop/collections/:slug", destination: "/store/collections/:slug", permanent: true },
      { source: "/shop/:slug", destination: "/store/:slug", permanent: true },
    ];
  },
  async rewrites() {
    return {
      // IndexNow key file: /<INDEXNOW_KEY>.txt (lib/seo/indexnow.ts). An
      // afterFiles rewrite, so real files and routes (robots.txt, llms.txt)
      // always win; the route 404s for any other key.
      afterFiles: [
        { source: "/:key([A-Za-z0-9-]{8,128}).txt", destination: "/api/indexnow-key/:key" },
      ],
    };
  },
  async headers() {
    return [
      // Private and machine-only paths never belong in search results,
      // whatever their content type (JSON, redirects, PDFs). Article cover
      // images under /api/blog/cover stay indexable for image search.
      {
        source: "/api/:path((?!blog/cover/).*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      ...["/admin_pro", "/admin_pro/:path*", "/learn", "/learn/:path*", "/go/:path*", "/r/:path*", "/toolkit", "/blueprint/:path*", "/monitor/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*\\.{jpg,jpeg,png,gif,svg,ico,webp,avif}",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' https: data: blob:",
              "connect-src 'self' https://api.anthropic.com https://api.resend.com https://api.stripe.com",
              // Lesson videos embed YouTube/Vimeo (see components/learn/LessonVideo.tsx).
              // Without these the iframes are silently blocked in production.
              "frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
              // Self-hosted lesson videos served as <video> files
              "media-src 'self' https: blob:",
              "object-src 'none'",
              "base-uri 'self'",
              // Defence-in-depth against forms being repointed off-site
              "form-action 'self'",
              // Stronger than X-Frame-Options, and honoured by modern browsers
              "frame-ancestors 'self'",
              // TIBLOGICS Learn app: the service worker (public/sw.js) and the
              // web app manifest (app/arfa.webmanifest) are both same-origin.
              "worker-src 'self'",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/((?!_next/static|_next/image|fonts|favicon)(?:[^.]*|.*\\.html))",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
      {
        // Generated lesson video files set their own (private, long) caching:
        // their ids change with every regeneration.
        source: "/api/:path((?!learn/video/asset/).*)",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
      {
        // The Learn service worker. Listed after "/:path*" so its CSP replaces
        // the page one: the worker only fetches, and saves lesson images that
        // may live on other https hosts (img-src https: on the pages).
        // Never cached by the browser, so an update reaches learners at once.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; connect-src 'self' https:; img-src 'self' https: data:" },
        ],
      },
    ];
  },
};

module.exports = (phase) => ({
  ...nextConfig,
  env: { NEXT_PUBLIC_BUILD_SHA: phase === "phase-production-build" ? buildSha() : process.env.NEXT_PUBLIC_BUILD_SHA || "" },
});
