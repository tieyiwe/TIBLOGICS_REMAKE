import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

// The AI Project Advisor is retired (hidden from /tools in production), so it
// stays out of search results and the sitemap.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return pageMetadata({
    path: "/tools/advisor",
    title: t("seo.meta.advisor.title"),
    description: t("tools.index.advisor.desc"),
    noindex: true,
  });
}

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
