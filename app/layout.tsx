import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const syne = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const SITE_URL = "https://tiblogics.com";
const SITE_NAME = "TIBLOGICS";
const DEFAULT_TITLE = "TIBLOGICS — AI Implementation & Digital Solutions | Washington D.C.";
const DEFAULT_DESC =
  "TIBLOGICS builds AI agents, workflow automation, and full-stack digital products for businesses in North America, Africa, and beyond. AI-first. Tech-complete.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESC,
  keywords: [
    "AI implementation", "AI agency", "AI agents", "workflow automation",
    "machine learning", "Washington DC AI", "AI consulting",
    "digital transformation", "AI for small business", "LLM integration",
    "RAG systems", "n8n automation", "Next.js development", "AI readiness",
    "Francophone Africa tech", "TIBLOGICS",
  ],
  authors: [{ name: "Tieyiwe Bassole", url: SITE_URL }],
  creator: "TIBLOGICS",
  publisher: "TIBLOGICS",
  category: "Technology",
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
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "TIBLOGICS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    creator: "@tiblogics",
    images: [`${SITE_URL}/og-image.png`],
  },
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 200, height: 60 },
      description: DEFAULT_DESC,
      address: { "@type": "PostalAddress", addressLocality: "Wheaton", addressRegion: "MD", addressCountry: "US" },
      contactPoint: { "@type": "ContactPoint", email: "ai@tiblogics.com", contactType: "customer service" },
      sameAs: ["https://linkedin.com/company/tiblogics", "https://twitter.com/tiblogics"],
      founder: { "@type": "Person", name: "Tieyiwe Bassole" },
      knowsAbout: ["Artificial Intelligence", "Machine Learning", "Workflow Automation", "Web Development"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/blog?search={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: SITE_NAME,
      image: `${SITE_URL}/og-image.png`,
      url: SITE_URL,
      priceRange: "$$",
      address: { "@type": "PostalAddress", addressLocality: "Wheaton", addressRegion: "MD", postalCode: "20902", addressCountry: "US" },
      geo: { "@type": "GeoCoordinates", latitude: 39.0343, longitude: -77.0531 },
      areaServed: ["Washington DC", "Maryland", "Virginia", "Francophone Africa"],
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00", closes: "18:00",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${display.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <meta name="theme-color" content="#1B3A6B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-dm antialiased">{children}</body>
    </html>
  );
}
