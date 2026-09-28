import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("pages.contact.meta.title"),
    description: t("pages.contact.meta.description"),
    keywords: [
      "contact TIBLOGICS", "AI agency contact", "get AI quote", "AI implementation inquiry",
      "hire AI agency", "AI consulting contact",
    ],
    alternates: { canonical: "https://tiblogics.com/contact" },
    openGraph: {
      title: t("pages.contact.meta.ogTitle"),
      description: t("pages.contact.meta.ogDescription"),
      url: "https://tiblogics.com/contact",
      type: "website",
      images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630, alt: t("pages.contact.meta.ogTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pages.contact.meta.ogTitle"),
      description: t("pages.contact.meta.ogDescription"),
      creator: "@tiblogics",
      images: ["https://tiblogics.com/og-image.png"],
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
