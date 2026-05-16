import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans, Cormorant_Garamond, Cinzel } from "next/font/google";
import "./globals.css";

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

const SITE_URL = "https://tiblogics.com";
const SITE_NAME = "TIBLOGICS";
const DEFAULT_TITLE = "TIBLOGICS — AI Implementation & Digital Solutions";
const DEFAULT_DESC =
  "TIBLOGICS builds AI agents, workflow automation, and full-stack digital products for businesses in North America, Africa, and beyond. AI-first. Tech-complete.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESC,
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
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    images: [{ url: `${SITE_URL}/Main_domain_preview.png`, width: 1200, height: 630, alt: "TIBLOGICS — AI Solutions. Real Business Impact." }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    creator: "@tiblogics",
    site: "@tiblogics",
    images: [`${SITE_URL}/Main_domain_preview.png`],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  verification: {
    google: "tiblogics-google-verify",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: "TIBLOGICS",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": `${SITE_URL}/#logo`,
        url: `${SITE_URL}/icon.svg`,
        contentUrl: `${SITE_URL}/icon.svg`,
        width: 512, height: 512,
        caption: "TIBLOGICS",
      },
      image: `${SITE_URL}/Main_domain_preview.png`,
      description: DEFAULT_DESC,
      email: "ai@tiblogics.com",
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "ai@tiblogics.com",
          contactType: "customer service",
          availableLanguage: ["English", "French"],
          areaServed: ["US", "CA", "FR", "SN", "CI", "CM"],
        },
        {
          "@type": "ContactPoint",
          contactType: "sales",
          url: `${SITE_URL}/book`,
          availableLanguage: ["English", "French"],
        },
      ],
      sameAs: [
        "https://linkedin.com/company/tiblogics",
        "https://twitter.com/tiblogics",
      ],
      founder: {
        "@type": "Person",
        name: "Tieyiwe Bassole",
        jobTitle: "Founder & CEO",
        worksFor: { "@id": `${SITE_URL}/#organization` },
      },
      knowsAbout: [
        "Artificial Intelligence", "Machine Learning", "Workflow Automation",
        "Web Development", "Mobile App Development", "Cybersecurity",
        "Data Analytics", "AI Agents", "Natural Language Processing",
        "RAG Systems", "LLM Integration",
      ],
      priceRange: "$$",
      areaServed: [
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "Canada" },
        { "@type": "Continent", name: "Africa" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "AI & Digital Solutions",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Implementation", description: "Custom AI agents, LLM integration, and intelligent automation." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Workflow Automation", description: "End-to-end automation using n8n, Make, and custom pipelines." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Strategy Consulting", description: "AI readiness audits and implementation roadmaps." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Web & Mobile Development", description: "Full-stack web and mobile applications." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Cybersecurity", description: "Security audits and implementation for AI-driven businesses." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Data Analytics", description: "Business intelligence and AI-powered analytics dashboards." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Agent Development", description: "Autonomous AI agents that complete real tasks around the clock." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "SaaS Product Development", description: "From idea to launch-ready SaaS products." } },
        ],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESC,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["en-US", "fr"],
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/ai-times?search={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}/Main_domain_preview.png` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }],
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What does TIBLOGICS do?",
          acceptedAnswer: { "@type": "Answer", text: "TIBLOGICS is an AI implementation and digital solutions agency that builds custom AI agents, workflow automation, web and mobile applications, and data analytics solutions for businesses in North America, Africa, and beyond." },
        },
        {
          "@type": "Question",
          name: "How do I get started with TIBLOGICS?",
          acceptedAnswer: { "@type": "Answer", text: "Book a free 30-minute discovery meeting at tiblogics.com/book. We'll assess your business needs and recommend the right AI and automation solutions for your specific situation." },
        },
        {
          "@type": "Question",
          name: "Does TIBLOGICS work with small businesses?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. One of our core commitments is making AI accessible to businesses of every size. We work with solo operators, small businesses, and large enterprises alike." },
        },
        {
          "@type": "Question",
          name: "What markets does TIBLOGICS serve?",
          acceptedAnswer: { "@type": "Answer", text: "TIBLOGICS primarily serves the United States and African markets, with bilingual English and French delivery, and is equipped to serve clients across the globe." },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${display.variable} ${masthead.variable}`} suppressHydrationWarning>
      <head>
        {/* Resource hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

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
        <meta name="language" content="en, fr" />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
      </head>
      <body className="font-dm antialiased">{children}</body>
    </html>
  );
}
