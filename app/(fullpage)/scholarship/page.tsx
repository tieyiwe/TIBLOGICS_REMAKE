import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAccess, getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtDate, fmtPrice } from "@/lib/learn/format";
import { localTitles } from "@/lib/learn/team/titles";
import { eligibleTracks, liveTracks, scholarshipPriceCents, scholarshipsFor } from "@/lib/learn/scholarship/service";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import ScholarSeal from "@/components/learn/scholarship/ScholarSeal";
import { PickTrackButton } from "@/components/learn/scholarship/ScholarshipActions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.scholar.page.metaTitle"), robots: { index: false, follow: false } };
}

// The scholar's own page: the award, what is used, and the tracks left to
// choose. Outside the member area so a scholar with no track yet can reach it
// (the member layout would send them to the plans page).
export default async function MyScholarshipPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const student = await getStudent();
  if (!student) redirect(`/learn/login?next=${encodeURIComponent("/scholarship")}`);
  const { welcome } = await searchParams;
  const [mine, access, all, t, locale] = await Promise.all([scholarshipsFor(student.id), getAccess(student.id), liveTracks(), getT(), getLocale()]);
  const titles = await localTitles(locale).catch(() => null);
  const title = (id: string, fallback: string) => titles?.map[id] ?? fallback;

  return (
    <div className="min-h-screen bg-[var(--s2)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/learn" className="inline-block">
            <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        {mine.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-7">
            <h1 className="text-xl font-black text-[var(--ink)]">{t("learn.scholar.page.title")}</h1>
            <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.scholar.page.none")}</p>
          </div>
        ) : (
          mine.map((s) => {
            const pool = eligibleTracks(all, s.trackIds);
            const picked = new Set(s.picks.map((p) => p.trackId));
            const used = s.picks.length;
            return (
              <section key={s.id} className="mb-8">
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                  <div className="bg-gradient-to-br from-[#1B2A5E] to-[#27407F] px-6 py-6 text-white sm:px-8">
                    <div className="flex flex-wrap items-center gap-4">
                      <ScholarSeal size={64} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#F9A738]">{t("learn.scholar.badge")}</p>
                        <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl">{t("learn.scholar.page.title")}</h1>
                        <p className="mt-1 break-words text-sm text-white/80">
                          {student.name}
                          {s.claimedAt ? ` · ${t("learn.scholar.page.since", { date: fmtDate(s.claimedAt, locale, true) })}` : ""}
                        </p>
                      </div>
                    </div>
                    <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-xl bg-white/10 px-4 py-3">
                        <dt className="text-xs text-white/70">{t("learn.scholar.award.coverage")}</dt>
                        <dd className="mt-0.5 font-bold">{s.coveragePct >= 100 ? t("learn.scholar.coverage.full") : t("learn.scholar.coverage.part", { pct: String(s.coveragePct) })}</dd>
                      </div>
                      <div className="rounded-xl bg-white/10 px-4 py-3">
                        <dt className="text-xs text-white/70">{t("learn.scholar.award.tracks")}</dt>
                        <dd className="mt-0.5 font-bold">{t("learn.scholar.page.used", { used: String(used), total: String(s.trackCount) })}</dd>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
                          <div className="h-full rounded-full bg-[#F9A738]" style={{ width: `${Math.round((used / Math.max(1, s.trackCount)) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/10 px-4 py-3">
                        <dt className="text-xs text-white/70">{t("learn.scholar.award.code")}</dt>
                        <dd className="mt-0.5 font-mono text-xs font-bold">{s.code}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="px-6 py-5 sm:px-8">
                    {welcome === "1" && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{t("learn.scholar.page.welcome")}</p>}
                    {s.partner && <p className="mb-1 text-sm font-bold text-[#B4530F]" data-testid="scholar-partner">{t(`learn.scholar.partner.${s.partner.role}`, { partner: s.partner.name })}</p>}
                    {s.sponsorName && <p className="mb-3 text-sm font-semibold text-[var(--ink)]">{t("learn.scholar.letter.sponsorLine", { sponsor: s.sponsorName })}</p>}
                    {(s.pickBy || s.completeBy) && (
                      <ul className="mb-4 space-y-1 rounded-xl border border-[#F4C9A0] bg-[#FFFBF6] px-4 py-3 text-sm" data-testid="scholar-deadlines">
                        {s.pickBy && (
                          <li className={s.picksClosed ? "text-[var(--ink3)]" : "font-semibold text-[var(--ink)]"}>
                            {s.picksClosed ? t("learn.scholar.page.pickClosed", { date: fmtDate(s.pickBy, locale, true) }) : t("learn.scholar.welcome.pickBy", { date: fmtDate(s.pickBy, locale, true) })}
                          </li>
                        )}
                        {s.completeBy && <li className="font-semibold text-[var(--ink)]">{t("learn.scholar.welcome.completeBy", { date: fmtDate(s.completeBy, locale, true) })}</li>}
                      </ul>
                    )}
                    {s.remaining > 0 ? (
                      <>
                        <h2 className="text-base font-black text-[var(--ink)]">
                          {s.remaining === 1 ? t("learn.scholar.page.chooseOne") : t("learn.scholar.page.chooseOther", { n: String(s.remaining) })}
                        </h2>
                        <p className="mt-1 text-xs text-[var(--ink3)]">{t("learn.scholar.page.final")}</p>
                      </>
                    ) : (
                      <p className="text-sm text-[var(--ink2)]">{s.picksClosed && s.picks.length < s.trackCount ? t("learn.scholar.page.closedBody") : t("learn.scholar.page.allUsed")}</p>
                    )}
                    <p className="mt-2 text-xs text-[var(--ink3)]">{t("learn.scholar.scope")}</p>
                    <a href={`/api/learn/scholarship/letter?id=${encodeURIComponent(s.id)}`} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)]" data-testid="letter-download">
                      ↓ {t("learn.scholar.page.letter")}
                    </a>
                  </div>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {pool.map((tr) => {
                    const name = title(tr.id, tr.title);
                    const pay = scholarshipPriceCents(tr.priceCents, s.coveragePct);
                    const isPicked = picked.has(tr.id);
                    const owned = !isPicked && access.purchased.includes(tr.id);
                    return (
                      <li key={tr.id} className={`flex flex-col justify-between gap-3 rounded-2xl border bg-white p-5 ${isPicked ? "border-[#F4C9A0]" : "border-[var(--border)]"}`}>
                        <div>
                          <p className="break-words font-bold text-[var(--ink)]">{name}</p>
                          <p className="mt-1 text-sm">
                            <span className="text-[var(--ink3)] line-through">{fmtPrice(tr.priceCents, locale)}</span>{" "}
                            <span className="font-bold text-[var(--orange2)]">{pay === 0 ? t("learn.scholar.page.free") : t("learn.scholar.page.youPay", { price: fmtPrice(pay, locale) })}</span>
                          </p>
                          {pay > 0 && !isPicked && !owned && (
                            <p className="mt-1 text-xs font-semibold text-emerald-800">{t("learn.scholar.sum.save", { amount: fmtPrice(tr.priceCents - pay, locale) })}</p>
                          )}
                        </div>
                        {isPicked ? (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-[#FFF1E3] px-3 py-1 text-xs font-bold text-[#B4530F]">✓ {t("learn.scholar.page.picked")}</span>
                            <Link href={`/learn/track/${tr.slug}`} className="text-sm font-semibold text-[var(--blue2)] underline">{t("learn.scholar.page.open")}</Link>
                          </div>
                        ) : owned ? (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-[var(--s2)] px-3 py-1 text-xs font-bold text-[var(--ink2)]">{t("learn.scholar.page.owned")}</span>
                            <Link href={`/learn/track/${tr.slug}`} className="text-sm font-semibold text-[var(--blue2)] underline">{t("learn.scholar.page.open")}</Link>
                          </div>
                        ) : s.remaining > 0 ? (
                          <PickTrackButton
                            scholarshipId={s.id}
                            trackId={tr.id}
                            trackTitle={name}
                            label={pay === 0 ? t("learn.scholar.page.unlockFree") : t("learn.scholar.page.payAmount", { price: fmtPrice(pay, locale) })}
                            price={fmtPrice(tr.priceCents, locale)}
                            covered={fmtPrice(tr.priceCents - pay, locale)}
                            pay={fmtPrice(pay, locale)}
                            pct={s.coveragePct}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {used > 0 && (
                  <p className="mt-5 text-center">
                    <Link href="/learn" className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--ink)]">
                      {t("learn.scholar.page.myLearning")} →
                    </Link>
                  </p>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
