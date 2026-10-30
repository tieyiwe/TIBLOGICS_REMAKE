import { getT } from "@/lib/i18n/server";
import ToolsHub from "./ToolsHub";
import JsonLd from "@/components/seo/JsonLd";
import { FaqBlock, KeyTakeaways } from "@/components/seo/AnswerBlocks";
import { breadcrumbNode, itemListNode } from "@/lib/seo/jsonld";

// The tool cards are interactive (ToolsHub, a client component). The short
// answers below are rendered on the server so crawlers and AI engines that
// do not run JavaScript still read what each tool is and what it costs.
const LISTED = [
  { id: "scanner", href: "/tools/scanner" },
  { id: "toolkit", href: "/tools/toolkit-live" },
  { id: "blueprint", href: "/tools/automation-blueprint" },
  { id: "monitor", href: "/tools/readiness-monitor" },
  { id: "calculator", href: "/tools/calculator" },
];

export default async function ToolsPage() {
  const t = await getT();
  return (
    <>
      <ToolsHub />
      <div className="bg-[#F4F7FB] pb-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 lg:px-8">
          <KeyTakeaways title={t("seo.takeaways")} items={[t("seo.tools.tldr.1"), t("seo.tools.tldr.2")]} />
          <FaqBlock
            title={t("seo.faq")}
            path="/tools"
            items={[
              { q: t("seo.tools.faq.free.q"), a: t("seo.tools.faq.free.a") },
              { q: t("seo.tools.faq.scanner.q"), a: t("seo.tools.faq.scanner.a") },
              { q: t("seo.tools.faq.monitor.q"), a: t("seo.tools.faq.monitor.a") },
              { q: t("seo.bp.faq.get.q"), a: t("tools.index.blueprint.desc") },
            ]}
          />
        </div>
      </div>
      <JsonLd
        data={[
          itemListNode({
            name: t("tools.meta.title"),
            path: "/tools",
            items: LISTED.map((x) => ({ url: x.href, name: t(`tools.index.${x.id}.name`) })),
          }),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("seo.tools"), path: "/tools" },
          ]),
        ]}
      />
    </>
  );
}
