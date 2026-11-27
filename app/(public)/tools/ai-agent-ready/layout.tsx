import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode, softwareAppNode } from "@/lib/seo/jsonld";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/tools/ai-agent-ready",
    locale,
    title: t("tools.agent.meta.title"),
    description: t("tools.agent.meta.description"),
    keywords: ["AI agent ready", "robots.txt AI", "GPTBot", "ClaudeBot", "llms.txt", "AI SEO", "agentic commerce", "AI shopping agents"],
  });
}

export default async function AgentReadyLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <>
      <JsonLd
        data={[
          softwareAppNode({
            name: t("tools.agent.name"),
            description: t("tools.agent.meta.description"),
            path: "/tools/ai-agent-ready",
            category: "WebApplication",
            free: true,
          }),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("seo.tools"), path: "/tools" },
            { name: t("tools.agent.name"), path: "/tools/ai-agent-ready" },
          ]),
        ]}
      />
      {children}
    </>
  );
}
