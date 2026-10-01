import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("pages.book.meta.title"),
    description: t("pages.book.meta.description"),
    keywords: [
      "book AI consultation", "free AI discovery meeting", "AI strategy session",
      "TIBLOGICS booking", "AI implementation consultation", "book AI expert",
    ],
    alternates: { canonical: "https://tiblogics.com/book" },
    openGraph: {
      title: t("pages.book.meta.ogTitle"),
      description: t("pages.book.meta.ogDescription"),
      url: "https://tiblogics.com/book",
      type: "website",
      images: [{ url: "https://tiblogics.com/opengraph-image?v=3", width: 1200, height: 630, alt: t("pages.book.meta.ogTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pages.book.meta.ogTitle"),
      description: t("pages.book.meta.ogDescription"),
      creator: "@tiblogics",
      images: ["https://tiblogics.com/opengraph-image?v=3"],
    },
  };
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <div className="pt-16 min-h-screen bg-[#F4F7FB]">{children}</div>;
}
