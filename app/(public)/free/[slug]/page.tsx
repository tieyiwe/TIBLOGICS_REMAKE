import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CheckCircle2, ClipboardCheck, BookOpen, Gauge, LayoutGrid } from "lucide-react";
import { getPublishedMagnet } from "@/lib/growth/acquire/store";
import { magnetView } from "@/lib/growth/acquire/public";
import { fmt } from "@/lib/growth/acquire/fmt";
import type { MagnetType } from "@/lib/growth/acquire/types";
import CaptureForm from "../_components/CaptureForm";
import QuizRunner from "../_components/QuizRunner";
import PageBeacon from "../_components/PageBeacon";
import ProductRecommend from "../_components/ProductRecommend";

// Public lead magnet page: what you get, a peek inside, and the opt-in form
// (or, for a scorecard, the quiz with an instant result). Only published
// magnets exist here; drafts 404.
export const dynamic = "force-dynamic";

const load = cache(async (slug: string) => {
  const m = await getPublishedMagnet(slug);
  return m ? magnetView(m) : null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) return { title: "Not found", robots: { index: false, follow: false } };
  const title = v.content.headline || v.magnet.title;
  const description = v.content.subheadline || v.content.intro.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/free/${v.magnet.slug}` },
    robots: v.magnet.noindex ? { index: false, follow: true } : undefined,
    openGraph: { title, description, type: "website", url: `/free/${v.magnet.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

const ICON: Record<MagnetType, typeof ClipboardCheck> = { checklist: ClipboardCheck, guide: BookOpen, quiz: Gauge, templates: LayoutGrid };

export default async function FreeMagnetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) notFound();
  const { magnet, content: c, labels: L } = v;
  const type = magnet.type as MagnetType;
  const Icon = ICON[type] ?? ClipboardCheck;
  const inside =
    type === "checklist" ? c.checklist.map((s) => s.heading) : type === "guide" ? c.guide.map((s) => s.heading) : type === "templates" ? c.templates.map((t) => t.title) : [];

  return (
    <div lang={v.locale} className="min-h-screen bg-[#F4F7FB] pb-20 pt-[88px] sm:pt-[104px]">
      <PageBeacon refType="magnet" slug={magnet.slug} campaign={v.campaign} />
      <section className="relative overflow-hidden bg-[#0D1B2A]">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full bg-[#2251A3] opacity-30 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-[#F47C20] opacity-[0.12] blur-2xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="min-w-0 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-dm text-xs font-bold uppercase tracking-[0.08em] text-[#FFB98A]">
              <Icon size={14} aria-hidden /> {fmt(L, "acquire.tag")} · {fmt(L, `acquire.type.${type}`)}
            </span>
            <h1 className="mt-5 font-syne text-[34px] font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{c.headline || magnet.title}</h1>
            {c.subheadline && <p className="mt-4 max-w-xl font-dm text-lg leading-relaxed text-white/80">{c.subheadline}</p>}
            {c.bullets.length > 0 && (
              <div className="mt-7">
                <p className="font-dm text-xs font-bold uppercase tracking-[0.08em] text-white/60">{fmt(L, "acquire.whatYouGet")}</p>
                <ul className="mt-3 space-y-2.5">
                  {c.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 font-dm text-[15px] leading-snug text-white/90">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#F47C20]" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="rounded-[20px] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-7">
              {type === "quiz" ? (
                <QuizRunner slug={magnet.slug} locale={v.locale} labels={L} questions={c.questions} bands={c.bands} submitLabel={c.ctaLabel} />
              ) : (
                <>
                  <p className="mb-4 font-syne text-xl font-bold text-[#0D1B2A]">{fmt(L, "acquire.form.title")}</p>
                  <CaptureForm refType="magnet" slug={magnet.slug} locale={v.locale} labels={L} mode="magnet" submitLabel={c.ctaLabel} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-8 px-4 pt-10 sm:px-6 lg:px-8">
        {v.pendingNote && <p className="rounded-xl bg-[#EBF0FA] px-4 py-3 font-dm text-sm text-[#2251A3]">{v.pendingNote}</p>}
        {(c.intro || inside.length > 0) && (
          <section className="rounded-[20px] border border-[#D2DCE8] bg-white p-6 sm:p-8">
            {c.intro && <p className="font-dm text-[16px] leading-relaxed text-[#0D1B2A]">{c.intro}</p>}
            {inside.length > 0 && (
              <ol className="mt-5 grid gap-2 sm:grid-cols-2">
                {inside.map((h, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl bg-[#F4F7FB] px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white font-dm text-sm font-bold text-[#B8500A]" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="min-w-0 font-dm text-sm font-semibold text-[#0D1B2A]">{h}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
        {v.product && <ProductRecommend product={v.product} pitch={c.productPitch} cta={c.productCta} labels={L} refType="magnet" slug={magnet.slug} />}
      </div>
    </div>
  );
}
