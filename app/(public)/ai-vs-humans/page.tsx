import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode } from "@/lib/seo/jsonld";
import { absUrl } from "@/lib/seo/site";
import { trafficEntries } from "@/lib/ai-traffic";
import AiVsHumans from "@/components/public/AiVsHumans";

// /ai-vs-humans: a reference page for the bots-and-AI vs people share of web
// traffic. Every reading is a published figure with its source (lib/ai-traffic.ts).

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/ai-vs-humans",
    locale,
    title: t("aivh.page.metaTitle"),
    description: t("aivh.page.metaDescription"),
    keywords: ["AI agent traffic", "bot traffic vs human traffic", "AI agents vs humans", "bot traffic statistics 2026", "agentic web"],
  });
}

export default async function AiVsHumansPage() {
  const [t, locale, entries] = await Promise.all([getT(), getLocale(), trafficEntries()]);
  const latest = entries[0];
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const fmt = (d: string) => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(`${d}T12:00:00Z`));
  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20 pt-32 sm:pt-44">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="mx-auto mb-6 max-w-2xl text-center font-dm text-base text-[#3A4A5C] sm:text-lg">{t("aivh.page.intro")}</p>
        <AiVsHumans entry={latest} variant="page" />

        <section className="mt-10 rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-7" aria-labelledby="aivh-history">
          <h2 id="aivh-history" className="font-syne text-xl font-bold text-[#0D1B2A]">{t("aivh.page.history")}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] font-dm text-sm" data-testid="aivh-history">
              <thead>
                <tr className="border-b border-[#EEF2F7] text-left text-xs text-[#7A8FA6]">
                  <th className="py-2 pr-3">{t("aivh.page.col.date")}</th>
                  <th className="py-2 pr-3">{t("aivh.page.col.bots")}</th>
                  <th className="py-2 pr-3">{t("aivh.page.col.humans")}</th>
                  <th className="py-2">{t("aivh.page.col.source")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-[#0D1B2A]">{fmt(e.date)}</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#C25E12]">{nf.format(e.botsPct)}%</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#2251A3]">{nf.format(e.humansPct)}%</td>
                    <td className="py-2.5 text-[#3A4A5C]">
                      <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#2251A3] hover:underline">{e.source}</a>
                      {e.scope ? <span className="block text-xs text-[#7A8FA6]">{e.scope}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-6">
            <h2 className="font-syne text-lg font-bold text-[#0D1B2A]">{t("aivh.page.what")}</h2>
            <p className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t("aivh.page.whatBody")}</p>
          </div>
          <div className="rounded-2xl border border-[#D2DCE8] bg-white p-5 sm:p-6">
            <h2 className="font-syne text-lg font-bold text-[#0D1B2A]">{t("aivh.page.why")}</h2>
            <p className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t("aivh.page.whyBody")}</p>
          </div>
        </section>
      </div>
      <JsonLd
        data={[
          {
            "@type": "Dataset",
            "@id": `${absUrl("/ai-vs-humans")}#dataset`,
            name: t("aivh.page.metaTitle"),
            description: t("aivh.page.metaDescription"),
            url: absUrl("/ai-vs-humans"),
            dateModified: latest.date,
            creator: { "@type": "Organization", name: "TIBLOGICS" },
            isBasedOn: entries.map((e) => e.sourceUrl),
          },
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("aivh.tag"), path: "/ai-vs-humans" },
          ]),
        ]}
      />
    </div>
  );
}
