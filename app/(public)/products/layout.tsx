import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Products & Startups — Built by TIBLOGICS",
  description:
    "Explore AI-powered products built by TIBLOGICS: InStory (EdTech), CareFlow AI (HealthTech), ShipFrica (Logistics), Ember (Mental Health), and more. Custom builds available.",
  keywords: [
    "TIBLOGICS products", "AI startup products", "InStory AI", "CareFlow AI",
    "ShipFrica", "AI SaaS products", "custom AI product development", "Ember AI",
    "AI apps portfolio", "AI product agency",
  ],
  alternates: { canonical: "https://tiblogics.com/products" },
  openGraph: {
    title: "AI Products Built by TIBLOGICS",
    description: "A portfolio of AI-powered products across EdTech, HealthTech, Logistics, and more. All available as custom builds for your industry.",
    url: "https://tiblogics.com/products",
    type: "website",
    images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630, alt: "TIBLOGICS Products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Products Built by TIBLOGICS",
    description: "InStory, CareFlow AI, ShipFrica, Ember — AI-powered products across every vertical, available as custom builds.",
    creator: "@tiblogics",
    images: ["https://tiblogics.com/og-image.png"],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
