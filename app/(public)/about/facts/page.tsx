import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import { academySummary } from "@/lib/seo/academy";
import { fmtPrice } from "@/lib/learn/format";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode, webPageNode } from "@/lib/seo/jsonld";
import { ORG, ORG_ID } from "@/lib/seo/site";

// The company fact sheet: short, self-contained, quotable sentences about
// who TIBLOGICS is and what it offers. AI engines (ChatGPT, Perplexity,
// Gemini, Claude, Copilot) lift answers from pages like this one, so every
// line must be true and consistent with the rest of the site and with the
// company's profiles elsewhere. Prices and counts come from the code and the
// database. Update FACTS_REVIEWED when you review the page.
const FACTS_REVIEWED = new Date(Date.UTC(2026, 9, 1));

export const dynamic = "force-dynamic";

const SERVICES = ["agents", "automation", "strategy", "web", "mobile", "security", "data", "iot", "training"];

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/about/facts",
    locale,
    title: t("seo.meta.facts.title"),
    description: t("seo.meta.facts.description"),
  });
}

export default async function FactsPage() {
  const [t, locale, academy] = await Promise.all([getT(), getLocale(), academySummary()]);
  const money = (c: number) => fmtPrice(c, locale);
  const reviewed = FACTS_REVIEWED.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

  const products: Array<{ text: string; href: string }> = [
    ...(academy.live.length
      ? [{ text: t("seo.facts.p.arfa", { n: academy.live.length, from: money(academy.minPriceCents), monthly: money(academy.monthlyCents) }), href: "/learning-box" }]
      : []),
    { text: t("seo.facts.p.toolkit"), href: "/tools/toolkit-live" },
    { text: t("seo.facts.p.blueprint"), href: "/tools/automation-blueprint" },
    { text: t("seo.facts.p.monitor"), href: "/tools/readiness-monitor" },
    { text: t("seo.facts.p.free"), href: "/tools" },
    { text: t("seo.facts.p.store"), href: "/store" },
    { text: t("seo.facts.p.aitimes"), href: "/ai-times" },
    { text: t("seo.facts.p.events"), href: "/events" },
  ];

  const rows: Array<{ k: string; v: React.ReactNode }> = [
    { k: t("seo.facts.who.k"), v: t("seo.facts.who.v") },
    { k: t("seo.facts.founder.k"), v: t("seo.facts.founder.v") },
    { k: t("seo.facts.where.k"), v: t("seo.facts.where.v") },
    { k: t("seo.facts.lang.k"), v: t("seo.facts.lang.v") },
    {
      k: t("seo.facts.services.k"),
      v: (
        <ul className="list-disc space-y-1 pl-5">
          {SERVICES.map((s) => (
            <li key={s}>
              <strong className="text-[#0D1B2A]">{t(`pages.services.svc.${s}.name`)}</strong>: {t(`pages.services.svc.${s}.desc`)}
            </li>
          ))}
        </ul>
      ),
    },
    { k: t("seo.facts.start.k"), v: t("seo.facts.start.v") },
    {
      k: t("seo.facts.products.k"),
      v: (
        <ul className="list-disc space-y-1 pl-5">
          {products.map((p) => (
            <li key={p.href}>
              {p.text}{" "}
              <Link href={p.href} className="text-[#2251A3] underline underline-offset-2">
                tiblogics.com{p.href}
              </Link>
            </li>
          ))}
        </ul>
      ),
    },
    {
      k: t("seo.facts.contact.k"),
      v: (
        <ul className="space-y-1">
          <li>{t("seo.facts.contact.general")}: <a className="text-[#2251A3] underline underline-offset-2" href={`mailto:${ORG.email}`}>{ORG.email}</a></li>
          <li>{t("seo.facts.contact.founder")}: <a className="text-[#2251A3] underline underline-offset-2" href={`mailto:${ORG.founderEmail}`}>{ORG.founderEmail}</a></li>
          <li>{t("seo.facts.contact.academy")}: <a className="text-[#2251A3] underline underline-offset-2" href={`mailto:${ORG.academyEmail}`}>{ORG.academyEmail}</a></li>
          <li><Link className="text-[#2251A3] underline underline-offset-2" href="/book">{t("seo.facts.contact.book")}</Link></li>
        </ul>
      ),
    },
    {
      k: t("seo.facts.online.k"),
      v: (
        <ul className="space-y-1">
          <li><a className="text-[#2251A3] underline underline-offset-2" href="https://tiblogics.com">tiblogics.com</a></li>
          {ORG.sameAs.map((u) => (
            <li key={u}><a className="text-[#2251A3] underline underline-offset-2" href={u} rel="me noopener" target="_blank">{u.replace(/^https:\/\//, "")}</a></li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20 pt-32 sm:pt-44">
      <JsonLd
        data={[
          webPageNode({ path: "/about/facts", type: "AboutPage", name: t("seo.meta.facts.title"), description: t("seo.meta.facts.description"), about: ORG_ID, inLanguage: locale }),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("seo.about"), path: "/about" },
            { name: t("seo.facts.h1"), path: "/about/facts" },
          ]),
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="font-dm text-sm text-[#7A8FA6]">
          <Link href="/about" className="hover:text-[#2251A3]">{t("seo.about")}</Link> / <span aria-current="page">{t("seo.facts.h1")}</span>
        </nav>
        <h1 className="mt-3 font-syne text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl">{t("seo.facts.h1")}</h1>
        <p className="mt-3 font-dm text-[#3A4A5C]">{t("seo.facts.intro", { date: reviewed })}</p>

        <dl className="mt-8 divide-y divide-[#E8EFF8] rounded-2xl border border-[#D2DCE8] bg-white">
          {rows.map((r) => (
            <div key={r.k} className="grid gap-2 p-5 sm:grid-cols-[180px_1fr] sm:gap-6 sm:p-6">
              <dt className="font-syne text-sm font-bold uppercase tracking-wide text-[#1B3A6B]">{r.k}</dt>
              <dd className="font-dm text-[15px] leading-relaxed text-[#3A4A5C]">{r.v}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 font-dm text-sm text-[#7A8FA6]">
          {t("seo.facts.more")}{" "}
          <a href="/llms.txt" className="text-[#2251A3] underline underline-offset-2">llms.txt</a> ·{" "}
          <a href="/llms-full.txt" className="text-[#2251A3] underline underline-offset-2">llms-full.txt</a>
        </p>
      </article>
    </div>
  );
}
