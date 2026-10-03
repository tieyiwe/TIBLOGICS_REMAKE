import type { Metadata } from "next";
import { ClipboardList, Workflow, CalendarRange, BadgeDollarSign } from "lucide-react";
import { blueprintPrice, creditDays, formatMoney } from "@/lib/blueprint/config";
import { getLocale, getT } from "@/lib/i18n/server";
import BlueprintForm from "./BlueprintForm";
import { ownerSession } from "@/lib/admin/test-access";
import { pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { FaqBlock, KeyTakeaways } from "@/components/seo/AnswerBlocks";
import { breadcrumbNode, softwareAppNode } from "@/lib/seo/jsonld";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/tools/automation-blueprint",
    locale,
    title: t("seo.meta.blueprint.title"),
    socialTitle: t("tools.bp.meta.title"),
    description: t("tools.bp.meta.description"),
  });
}

export const dynamic = "force-dynamic";

const WHAT = [
  { icon: ClipboardList, n: 1 },
  { icon: Workflow, n: 2 },
  { icon: CalendarRange, n: 3 },
  { icon: BadgeDollarSign, n: 4 },
];

export default async function AutomationBlueprintPage({ searchParams }: { searchParams: Promise<{ paid?: string; canceled?: string; test?: string }> }) {
  const sp = await searchParams;
  const price = blueprintPrice();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  // ?test=1 from the admin Test access page; ignored for everyone else.
  const testMode = sp.test === "1" && !!(await ownerSession());

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {sp.paid && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5 font-dm text-sm text-green-800">
            <strong>{t("tools.common.paymentReceived")}</strong> {t("tools.bp.paid")}
          </div>
        )}
        {sp.canceled && (
          <div className="mb-8 rounded-2xl border border-[#D2DCE8] bg-white p-5 font-dm text-sm text-[#3A4A5C]">
            {t("tools.common.canceled")}
          </div>
        )}

        <div className="max-w-3xl">
          <span className="section-tag">Automation Blueprint</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2 leading-tight break-words">
            {t("tools.bp.title")}
          </h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-4">
            {price ? t("tools.bp.lead.price", { price: formatMoney(price, locale) }) : t("tools.bp.lead.noPrice")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {WHAT.map((w) => (
            <div key={w.n} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
              <w.icon size={20} className="text-[#B8500A]" aria-hidden />
              <h2 className="font-syne font-bold text-base text-[#0D1B2A] mt-3">{t(`tools.bp.what.${w.n}.title`)}</h2>
              <p className="font-dm text-sm text-[#7A8FA6] mt-1 leading-relaxed">{t(`tools.bp.what.${w.n}.body`)}</p>
            </div>
          ))}
        </div>

        <KeyTakeaways
          className="mt-10 max-w-3xl"
          title={t("seo.takeaways")}
          items={[
            t("seo.bp.tldr.1"),
            t("seo.bp.tldr.2"),
            price
              ? t("seo.bp.tldr.price", { price: formatMoney(price, locale), days: creditDays() })
              : t("seo.bp.tldr.noPrice", { days: creditDays() }),
          ]}
        />

        <div className="mt-12">
          <BlueprintForm price={price ? formatMoney(price, locale) : null} creditDays={creditDays()} testMode={testMode} />
        </div>

        <FaqBlock
          className="mt-12 max-w-3xl"
          title={t("seo.faq")}
          path="/tools/automation-blueprint"
          items={[
            { q: t("seo.bp.faq.get.q"), a: t("seo.bp.faq.get.a") },
            { q: t("seo.bp.faq.time.q"), a: t("seo.bp.faq.time.a") },
            { q: t("seo.bp.faq.credit.q"), a: t("seo.bp.faq.credit.a", { days: creditDays() }) },
          ]}
        />
        <JsonLd
          data={[
            softwareAppNode({
              name: "Automation Blueprint",
              description: t("tools.bp.meta.description"),
              path: "/tools/automation-blueprint",
              priceCents: price,
            }),
            breadcrumbNode([
              { name: t("seo.home"), path: "/" },
              { name: t("seo.tools"), path: "/tools" },
              { name: "Automation Blueprint", path: "/tools/automation-blueprint" },
            ]),
          ]}
        />
      </div>
    </div>
  );
}
