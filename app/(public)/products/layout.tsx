import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("pages.products.meta.title"),
    description: t("pages.products.meta.description"),
    keywords: [
      "TIBLOGICS products", "AI startup products", "InStory AI", "CareFlow AI",
      "ShipFrica", "AI SaaS products", "custom AI product development", "Ember AI",
      "AI apps portfolio", "AI product agency",
    ],
    alternates: { canonical: "https://tiblogics.com/products" },
    openGraph: {
      title: t("pages.products.meta.ogTitle"),
      description: t("pages.products.meta.ogDescription"),
      url: "https://tiblogics.com/products",
      type: "website",
      images: [{ url: "https://tiblogics.com/opengraph-image?v=3", width: 1200, height: 630, alt: t("pages.products.meta.ogTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pages.products.meta.ogTitle"),
      description: t("pages.products.meta.twitterDescription"),
      creator: "@tiblogics",
      images: ["https://tiblogics.com/opengraph-image?v=3"],
    },
  };
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
