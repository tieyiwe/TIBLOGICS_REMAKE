import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("pages.events.meta.title"),
    description: t("pages.events.meta.description"),
    openGraph: {
      title: t("pages.events.meta.title"),
      description: t("pages.events.meta.ogDescription"),
      type: "website",
      url: "https://tiblogics.com/events",
      images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pages.events.meta.title"),
      description: t("pages.events.meta.ogDescription"),
    },
    alternates: { canonical: "https://tiblogics.com/events" },
  };
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
