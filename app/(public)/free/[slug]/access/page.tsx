import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { isLocale } from "@/lib/i18n/config";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { magnetView } from "@/lib/growth/acquire/public";
import { verifyAccessToken } from "@/lib/growth/acquire/security";
import { fmt } from "@/lib/growth/acquire/fmt";
import { scoreQuiz, type MagnetType, type QuizResult } from "@/lib/growth/acquire/types";
import MagnetBody from "../../_components/MagnetBody";
import PrintButton from "../../_components/PrintButton";
import ProductRecommend from "../../_components/ProductRecommend";

// The delivered asset, opened from the email (or right after the form) with a
// signed link. Print-optimised: "Save as PDF" uses the browser's print dialog,
// and the site header, footer and floating buttons are hidden on paper.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

const PRINT_CSS = `
.acq-print-only{display:none}
@media print{
  @page{margin:16mm}
  body{background:#fff!important}
  header,footer,nav,[class*="fixed"],.acq-no-print{display:none!important}
  main{padding:0!important}
  .acq-sheet{padding-top:0!important;background:#fff!important}
  .acq-sheet *{box-shadow:none!important}
  .acq-print-only{display:block}
  .acq-avoid-break{break-inside:avoid}
  a{color:#0D1B2A!important;text-decoration:none!important}
}`;

async function load(slug: string, k: string | undefined) {
  const id = verifyAccessToken(k);
  if (!id) return null;
  try {
    await ensureAcquireTables();
    const cap = await prisma.acquireCapture.findUnique({ where: { id } });
    if (!cap || cap.refType !== "magnet" || cap.slug !== slug) return null;
    const magnet = await prisma.acquireMagnet.findUnique({ where: { id: cap.refId } });
    if (!magnet) return null;
    const visitor = await getLocale();
    const v = await magnetView(magnet, isLocale(cap.locale) && cap.locale !== "en" ? cap.locale : visitor);
    return { cap, v };
  } catch (err) {
    console.error("[free/access]", err);
    return null;
  }
}

export default async function MagnetAccessPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ k?: string }> }) {
  const [{ slug }, { k }] = await Promise.all([params, searchParams]);
  const hit = await load(slug, typeof k === "string" ? k : undefined);
  if (!hit) {
    const t = translatorFor(await getLocale());
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F4F7FB] px-4 pb-16 pt-32">
        <div className="w-full max-w-md rounded-2xl border border-[#D2DCE8] bg-white p-8 text-center">
          <h1 className="font-syne text-xl font-bold text-[#0D1B2A]">{t("acquire.asset.invalidTitle")}</h1>
          <p className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t("acquire.asset.invalidBody")}</p>
          <Link href={`/free/${encodeURIComponent(slug)}`} className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-[#1B3A6B] px-5 font-dm text-sm font-bold text-white">
            {t("acquire.asset.back")}
          </Link>
        </div>
      </div>
    );
  }
  const { cap, v } = hit;
  const { magnet, content: c, labels: L } = v;
  const type = magnet.type as MagnetType;
  let result: QuizResult | null = null;
  if (type === "quiz" && cap.result && typeof cap.result === "object") {
    const stored = cap.result as unknown as QuizResult;
    result = stored;
    // Re-derive the band and tips in the shown language when possible.
    const answers = (cap.result as { answers?: number[] }).answers;
    if (Array.isArray(answers)) result = scoreQuiz(c, answers) ?? stored;
  }

  return (
    <div lang={v.locale} className="acq-sheet min-h-screen bg-[#F4F7FB] pb-20 pt-[88px] sm:pt-[104px]">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <article className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <div className="acq-avoid-break border-b-4 border-[#F47C20] pb-6">
          <p className="font-dm text-xs font-bold uppercase tracking-[0.08em] text-[#B8500A]">
            TIBLOGICS · {fmt(L, `acquire.type.${type}`)}
          </p>
          <h1 className="mt-2 font-syne text-3xl font-extrabold leading-tight text-[#0D1B2A] sm:text-4xl">{c.headline || magnet.title}</h1>
          {c.subheadline && <p className="mt-3 font-dm text-lg leading-relaxed text-[#3A4A5C]">{c.subheadline}</p>}
          {type !== "quiz" && (
            <div className="acq-no-print mt-5 flex flex-wrap items-center gap-3">
              <PrintButton label={fmt(L, "acquire.asset.print")} />
              <span className="font-dm text-xs text-[#5A6E84]">{fmt(L, "acquire.asset.printHint")}</span>
            </div>
          )}
        </div>

        {v.pendingNote && <p className="acq-no-print mt-6 rounded-xl bg-[#EBF0FA] px-4 py-3 font-dm text-sm text-[#2251A3]">{v.pendingNote}</p>}

        <div className="mt-8">
          {type === "quiz" ? (
            result ? (
              <section className="rounded-[20px] border border-[#D2DCE8] bg-white p-6 sm:p-8">
                <p className="font-dm text-xs font-bold uppercase tracking-[0.08em] text-[#5A6E84]">{fmt(L, "acquire.quiz.result")}</p>
                <p className="mt-2 font-syne text-5xl font-extrabold tabular-nums text-[#0D1B2A]">
                  {result.score}
                  <span className="font-dm text-lg font-semibold text-[#5A6E84]"> / 100</span>
                </p>
                {result.band && <p className="mt-2 font-syne text-xl font-bold text-[#0D1B2A]">{result.band.title}</p>}
                {result.band?.body && <p className="mt-2 font-dm text-[15px] leading-relaxed text-[#3A4A5C]">{result.band.body}</p>}
                {result.tips.length > 0 && (
                  <>
                    <h2 className="mt-6 font-syne text-lg font-bold text-[#0D1B2A]">{fmt(L, "acquire.quiz.tips")}</h2>
                    <ol className="mt-2 space-y-2 pl-5 font-dm text-[15px] leading-relaxed text-[#3A4A5C] [list-style:decimal]">
                      {result.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ol>
                  </>
                )}
              </section>
            ) : (
              <p className="font-dm text-sm text-[#3A4A5C]">{c.intro}</p>
            )
          ) : (
            <MagnetBody type={type} content={c} labels={L} />
          )}
        </div>

        {v.product && (
          <div className="mt-10">
            <ProductRecommend product={v.product} pitch={c.productPitch} cta={c.productCta} labels={L} refType="magnet" slug={magnet.slug} />
          </div>
        )}
        <p className="acq-print-only mt-8 font-dm text-xs text-[#5A6E84]">tiblogics.com/free/{magnet.slug}</p>
      </article>
    </div>
  );
}
