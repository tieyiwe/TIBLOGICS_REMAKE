import { getT } from "@/lib/i18n/server";
import ServicesClient from "./ServicesClient";
import JsonLd from "@/components/seo/JsonLd";
import { FaqBlock, KeyTakeaways } from "@/components/seo/AnswerBlocks";
import { breadcrumbNode, serviceNode } from "@/lib/seo/jsonld";

// The service cards are interactive (ServicesClient). The takeaways, FAQ and
// Service structured data are rendered on the server so crawlers and AI
// engines that do not run JavaScript read them too. All answers restate what
// the page and the rest of the site already say.
const SERVICES = ["agents", "automation", "strategy", "web", "security", "data", "mobile", "training", "iot"];

export default async function ServicesPage() {
  const t = await getT();
  const faq = [
    { q: t("seo.home.faq.1.q"), a: t("seo.home.faq.1.a") },
    { q: t("seo.home.faq.2.q"), a: t("seo.home.faq.2.a") },
    { q: t("seo.home.faq.3.q"), a: t("seo.home.faq.3.a") },
    { q: t("seo.home.faq.4.q"), a: t("seo.home.faq.4.a") },
    { q: t("seo.services.faq.automation.q"), a: t("seo.services.faq.automation.a") },
    { q: t("seo.services.faq.training.q"), a: t("seo.services.faq.training.a") },
    { q: t("seo.services.faq.after.q"), a: t("seo.services.faq.after.a") },
  ];
  return (
    <>
      <ServicesClient />
      <div className="pb-20">
        <div className="mx-auto grid max-w-4xl gap-6 px-4 sm:px-6 lg:px-8">
          <KeyTakeaways
            title={t("seo.takeaways")}
            items={[1, 2, 3, 4].map((n) => t(`seo.services.tldr.${n}`))}
          />
          <FaqBlock title={t("seo.faq")} path="/services" items={faq} />
        </div>
      </div>
      <JsonLd
        data={[
          ...SERVICES.map((id) =>
            serviceNode({
              name: t(`pages.services.svc.${id}.name`),
              description: t(`pages.services.svc.${id}.desc`),
              path: id === "training" ? "/learning-box" : "/services",
            }),
          ),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("pages.services.hero.tag"), path: "/services" },
          ]),
        ]}
      />
    </>
  );
}
