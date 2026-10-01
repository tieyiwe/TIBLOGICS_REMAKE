import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPublishedPage } from "@/lib/growth/acquire/store";
import { pageView } from "@/lib/growth/acquire/public";
import PageBeacon from "../../free/_components/PageBeacon";
import PageSections from "../_components/PageSections";

// Public campaign landing page. Only published pages exist; the noindex
// toggle keeps paid-ad or private-offer pages out of search engines.
export const dynamic = "force-dynamic";

const load = cache(async (slug: string) => {
  const p = await getPublishedPage(slug);
  return p ? pageView(p) : null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) return { title: "Not found", robots: { index: false, follow: false } };
  const hero = v.content.sections.find((s) => s.type === "hero" && s.enabled);
  const title = hero?.title || v.page.title;
  const description = v.content.description || hero?.body || "";
  return {
    title,
    description,
    alternates: { canonical: `/lp/${v.page.slug}` },
    robots: v.page.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, type: "website", url: `/lp/${v.page.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) notFound();
  return (
    <div lang={v.locale} className="min-h-screen bg-white pt-[88px] sm:pt-[104px]">
      <PageBeacon refType="page" slug={v.page.slug} campaign={v.campaign} />
      {v.pendingNote && <p className="bg-[#EBF0FA] px-4 py-2 text-center font-dm text-sm text-[#2251A3]">{v.pendingNote}</p>}
      <PageSections content={v.content} labels={v.labels} slug={v.page.slug} locale={v.locale} ctaHref={v.ctaHref} />
    </div>
  );
}
