import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { absUrl } from "@/lib/seo/site";
import { GLOSSARY, type GlossaryCategory } from "@/lib/learn/glossary/terms";
import { termDef, termName } from "@/lib/learn/glossary/match";
import GlossaryBrowser, { type BrowserTerm } from "@/components/learn/glossary/GlossaryBrowser";

// The ARFA glossary: every AI and tech term the tracks use, in plain
// language, in the reader's language. Lessons link here from their term
// pop-ups (/learning-box/glossary#term-id).

const CATS: GlossaryCategory[] = ["basics", "llm", "agents", "data", "safety", "governance", "dev", "business"];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = translatorFor(locale);
  return pageMetadata({
    path: "/learning-box/glossary",
    locale,
    title: t("learn.glossary.title"),
    description: t("learn.glossary.intro", { n: GLOSSARY.length }),
  });
}

export default async function GlossaryPage() {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const terms: BrowserTerm[] = GLOSSARY.map((g) => ({
    id: g.id,
    term: termName(g, locale),
    en: g.term,
    def: termDef(g, locale),
    category: g.category,
    related: (g.related ?? []).flatMap((r) => {
      const x = GLOSSARY.find((y) => y.id === r);
      return x ? [{ id: x.id, term: termName(x, locale) }] : [];
    }),
  })).sort((a, b) => a.term.localeCompare(b.term, locale));

  return (
    <div className="min-h-screen bg-[var(--s2,#F4F7FB)] pb-16 pt-28 sm:pt-32">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          "@id": absUrl("/learning-box/glossary"),
          name: t("learn.glossary.title"),
          inLanguage: locale,
          hasDefinedTerm: terms.map((x) => ({
            "@type": "DefinedTerm",
            "@id": absUrl(`/learning-box/glossary#${x.id}`),
            name: x.term,
            description: x.def,
          })),
        }}
      />
      <div className="mx-auto max-w-4xl px-4">
        <nav aria-label="Breadcrumb" className="text-sm text-[#5A6E84]">
          <Link href="/learning-box" className="hover:underline">ARFA</Link> / {t("learn.glossary.title")}
        </nav>
        <h1 className="mt-2 font-syne text-3xl font-black text-[#0D1B2A] sm:text-4xl">{t("learn.glossary.title")}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#3A4A5C]">{t("learn.glossary.intro", { n: terms.length })}</p>
        <div className="mt-6">
          <GlossaryBrowser
            terms={terms}
            categories={CATS.map((c) => ({ id: c, label: t(`learn.glossary.cat.${c}`) }))}
            labels={{ search: t("learn.glossary.search"), all: t("learn.glossary.all"), related: t("learn.glossary.related"), none: t("learn.glossary.none"), count: t("learn.glossary.count") }}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
