import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import { localTitles } from "@/lib/learn/team/titles";
import { liveTracks } from "@/lib/learn/scholarship/service";
import { applicationsOpen } from "@/lib/learn/scholarship/applications";
import ScholarSeal from "@/components/learn/scholarship/ScholarSeal";
import ApplyForm from "@/components/learn/scholarship/ApplyForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/tilo-vision-scholarship",
    locale,
    title: t("learn.scholarApply.meta.title"),
    description: t("learn.scholarApply.meta.description"),
    cardKicker: "ARFA · AI Academy",
    keywords: ["AI scholarship", "AI course scholarship", "free AI training", "ARFA", "TIBLOGICS", "Tilo Vision Scholarship"],
  });
}

// The public face of the Tilo Vision Scholarship: what it is, who it is
// for, how it works, and the application (lib/learn/scholarship/applications).
export default async function TiloVisionScholarshipPage() {
  const [t, locale, open, tracks] = await Promise.all([getT(), getLocale(), applicationsOpen(), liveTracks().catch(() => [])]);
  const titles = await localTitles(locale).catch(() => null);
  const options = tracks.map((x) => ({ id: x.id, title: titles?.map[x.id] ?? x.title }));
  const card = "rounded-2xl border border-[var(--border)] bg-white p-6";

  return (
    <div className="bg-[var(--s2)] pb-20 pt-28 sm:pt-36">
      <section className="mx-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B2A5E] to-[#27407F] text-white sm:mx-auto sm:max-w-6xl">
        <div className="grid items-center gap-8 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F9A738]">{t("learn.scholarApply.kicker")}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">The Tilo Vision Scholarship</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">{t("learn.scholarApply.hero")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {open ? (
                <a href="#apply" className="inline-flex min-h-12 items-center rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-6 text-sm font-black text-[#131A1B] hover:brightness-105">
                  {t("learn.scholarApply.cta")} →
                </a>
              ) : null}
              <Link href="/learning-box" className="inline-flex min-h-12 items-center rounded-full border border-white/30 px-6 text-sm font-bold text-white hover:bg-white/10">
                {t("learn.scholarApply.seeTracks")}
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <ScholarSeal size={180} />
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className={card}>
              <p className="text-2xl font-black text-[var(--orange2)]">{t(`learn.scholarApply.cover.${n}.big`)}</p>
              <p className="mt-1 font-bold text-[var(--ink)]">{t(`learn.scholarApply.cover.${n}.title`)}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{t(`learn.scholarApply.cover.${n}.body`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="text-xl font-black text-[var(--ink)]">{t("learn.scholarApply.who.title")}</h2>
            <ul className="mt-4 space-y-2.5">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex gap-2 text-sm leading-relaxed text-[var(--ink2)]">
                  <span aria-hidden="true" className="font-bold text-[var(--orange2)]">✓</span>
                  {t(`learn.scholarApply.who.${n}`)}
                </li>
              ))}
            </ul>
          </section>
          <section className={card}>
            <h2 className="text-xl font-black text-[var(--ink)]">{t("learn.scholarApply.how.title")}</h2>
            <ol className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex gap-3 text-sm leading-relaxed text-[var(--ink2)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B2A5E] text-xs font-black text-white">{n}</span>
                  <span>
                    <strong className="text-[var(--ink)]">{t(`learn.scholarApply.how.${n}.title`)}</strong> {t(`learn.scholarApply.how.${n}.body`)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section id="apply" className="mt-10 scroll-mt-28 rounded-3xl border border-[#F4C9A0] bg-[#FFFBF6] p-6 sm:p-10">
          {open ? (
            <>
              <h2 className="text-2xl font-black text-[var(--ink)]">{t("learn.scholarApply.form.title")}</h2>
              <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.scholarApply.form.intro")}</p>
              <div className="mt-6">
                <ApplyForm tracks={options} locale={locale} />
              </div>
            </>
          ) : (
            <div className="text-center" data-testid="apply-closed">
              <h2 className="text-2xl font-black text-[var(--ink)]">{t("learn.scholarApply.closedTitle")}</h2>
              <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.scholarApply.closedBody")}</p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black text-[var(--ink)]">{t("learn.scholarApply.faq.title")}</h2>
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <details key={n} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <summary className="cursor-pointer font-bold text-[var(--ink)]">{t(`learn.scholarApply.faq.${n}.q`)}</summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t(`learn.scholarApply.faq.${n}.a`)}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
