import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { dictionary } from "@/lib/i18n/messages";
import { I18nProvider } from "@/lib/i18n/client";
import JsonLd from "@/components/seo/JsonLd";
import { founderNode, organizationNode, websiteNode } from "@/lib/seo/jsonld";
import { OG_IMAGE, OG_LOCALE, SITE_NAME, SITE_URL } from "@/lib/seo/site";

const syne = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-syne",
  display: "swap",
  preload: true,
});

const dmSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const masthead = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-masthead",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

// Search engine ownership checks, from the environment so no placeholder is
// ever published: GOOGLE_SITE_VERIFICATION (Search Console, "HTML tag"
// method: the content value only) and BING_SITE_VERIFICATION (Bing Webmaster
// Tools, the msvalidate.01 value).
function verification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

// Title and description follow the visitor's language; the JSON-LD below
// stays in English (lib/seo/jsonld.ts).
//
// No canonical here, deliberately: a canonical set in the root layout is
// inherited by every page that does not set its own, which pointed all of
// them at the home page. Each public page sets its own (lib/seo/meta.ts).
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const title = t("site.meta.title");
  const description = t("site.meta.description");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    keywords: [
      "AI implementation", "AI agency", "AI agents", "workflow automation",
      "machine learning", "AI consulting", "AI chatbot development",
      "digital transformation", "AI for small business", "LLM integration",
      "RAG systems", "n8n automation", "Next.js development", "AI readiness",
      "AI implementation North America", "AI implementation Africa",
      "Francophone Africa tech", "TIBLOGICS", "AI strategy consulting",
      "custom AI solutions", "business automation", "AI productivity tools",
    ],
    authors: [{ name: "Tieyiwe Bassole", url: SITE_URL }],
    creator: "TIBLOGICS",
    publisher: "TIBLOGICS",
    category: "Technology",
    classification: "AI Implementation & Digital Solutions Agency",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: Object.values(OG_LOCALE).filter((l) => l !== OG_LOCALE[locale]),
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t("site.meta.ogImageAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@tiblogics",
      site: "@tiblogics",
      images: [OG_IMAGE],
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      shortcut: "/icon.svg",
      apple: "/pwa/apple-touch-icon.png",
    },
    verification: verification(),
  };
}

// Site-wide entities only: the organisation, its founder and the website.
// Page-specific data (FAQ, courses, products, articles, breadcrumbs) lives on
// the page it describes; an FAQPage here used to be repeated on every URL.
const siteJsonLd = [organizationNode(), founderNode(), websiteNode()];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${syne.variable} ${dmSans.variable} ${display.variable} ${masthead.variable}`} suppressHydrationWarning>
      <head>
        {/* Resource hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Machine-readable summaries for AI engines (llms.txt convention)
            and the AI Times feed. Here rather than in metadata.alternates,
            which a page's own canonical would replace. */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
        <link rel="alternate" type="application/rss+xml" href="/ai-times/feed.xml" title="AI Times by TIBLOGICS" />

        {/* PWA / mobile */}
        <meta name="theme-color" content="#1B3A6B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />

        {/* AI agent & live chat signals (machine-readable) */}
        <meta name="ai-chat-agent" content="Echelon by TIBLOGICS" />
        <meta name="chatbot" content="active" />
        <meta name="automation-platform" content="TIBLOGICS AI Platform" />
        <meta name="live-chat" content="Echelon AI Assistant" />

        {/* Geo targeting */}
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        <meta name="language" content="en, fr, sw" />

        {/* Structured data */}
        <JsonLd data={siteJsonLd} />
      </head>
      <body className="font-dm antialiased">
        <I18nProvider locale={locale} dict={dictionary(locale)}>{children}</I18nProvider>
      </body>
    </html>
  );
}
