import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("pages.services.meta.title"),
    description: t("pages.services.meta.description"),
    keywords: [
      "AI implementation services", "workflow automation", "AI strategy consulting",
      "web development DC", "cybersecurity", "data analytics", "mobile development",
      "AI training", "AI academy", "IoT systems",
    ],
    alternates: { canonical: "https://tiblogics.com/services" },
    openGraph: {
      title: t("pages.services.meta.ogTitle"),
      description: t("pages.services.meta.ogDescription"),
      url: "https://tiblogics.com/services",
      type: "website",
      images: [{ url: "https://tiblogics.com/opengraph-image?v=3", width: 1200, height: 630, alt: t("pages.services.meta.ogTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pages.services.meta.ogTitle"),
      description: t("pages.services.meta.ogDescription"),
      creator: "@tiblogics",
      images: ["https://tiblogics.com/opengraph-image?v=3"],
    },
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
