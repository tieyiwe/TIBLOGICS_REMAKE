import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { cardUrl } from "@/lib/seo/og-card";

// Its own share preview (an ARFA card with this page's heading), not the academy default.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("learn.auth.signInTitle");
  const description = t("learn.auth.signInToContinue");
  const image = { url: cardUrl({ title, description, kicker: "ARFA · AI Academy", brand: "arfa" }), width: 1200, height: 630 };
  return {
    title: "Sign in",
    openGraph: { siteName: "TIBLOGICS", type: "website", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
