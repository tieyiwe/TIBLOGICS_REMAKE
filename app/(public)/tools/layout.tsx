import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tools.meta.title"),
    description: t("tools.meta.description"),
    keywords: [
      "website AI scanner", "AI readiness test", "website speed test",
      "AI cost calculator", "AI project advisor", "platform testing",
      "website analysis tool", "free AI tools",
    ],
    alternates: { canonical: "https://tiblogics.com/tools" },
    openGraph: {
      title: t("tools.meta.ogTitle"),
      description: t("tools.meta.ogDescription"),
      url: "https://tiblogics.com/tools",
      type: "website",
      images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630, alt: t("tools.meta.ogAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("tools.meta.ogTitle"),
      description: t("tools.meta.ogDescription"),
      creator: "@tiblogics",
      images: ["https://tiblogics.com/og-image.png"],
    },
  };
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
