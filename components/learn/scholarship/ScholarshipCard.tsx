import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtDate } from "@/lib/learn/format";
import { scholarshipsFor } from "@/lib/learn/scholarship/service";
import ScholarSeal from "./ScholarSeal";

/**
 * The learner's Tilo Vision Scholarship. "account": the profile section
 * (always shown to a scholar). "nudge": a reminder on the dashboard and the
 * plans page, only while tracks are left to choose. Renders nothing for
 * anyone else.
 */
export default async function ScholarshipCard({ studentId, variant }: { studentId: string; variant: "account" | "nudge" }) {
  const mine = await scholarshipsFor(studentId);
  if (!mine.length) return null;
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const remaining = mine.reduce((n, s) => n + s.remaining, 0);

  if (variant === "nudge") {
    if (remaining === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#F4C9A0] bg-gradient-to-r from-[#FFFBF6] to-white p-5" data-testid="scholar-nudge">
        <ScholarSeal size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-black text-[var(--ink)]">{t("learn.scholar.nudge.title")}</p>
          <p className="text-sm text-[var(--ink2)]">
            {remaining === 1 ? t("learn.scholar.nudge.one") : t("learn.scholar.nudge.other", { n: String(remaining) })}
            {mine.find((s) => s.pickBy && s.remaining > 0)?.pickBy ? ` ${t("learn.scholar.welcome.pickBy", { date: fmtDate(mine.find((s) => s.pickBy && s.remaining > 0)!.pickBy!, locale) })}` : ""}
          </p>
        </div>
        <Link href="/scholarship" className="inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white hover:opacity-90">
          {t("learn.scholar.nudge.cta")} →
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#F4C9A0] bg-white" data-testid="account-scholarship">
      <div className="flex items-center gap-4 bg-gradient-to-br from-[#1B2A5E] to-[#27407F] px-6 py-4 text-white">
        <ScholarSeal size={48} />
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#F9A738]">{t("learn.scholar.badge")}</p>
          <h2 className="text-base font-black">{t("learn.scholar.account.title")}</h2>
        </div>
      </div>
      {mine.map((s) => (
        <dl key={s.id} className="space-y-3 px-6 py-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">{t("learn.scholar.account.coverage")}</dt>
            <dd className="text-right font-semibold text-[var(--ink)]">{s.coveragePct >= 100 ? t("learn.scholar.coverage.full") : t("learn.scholar.coverage.part", { pct: String(s.coveragePct) })}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">{t("learn.scholar.account.tracks")}</dt>
            <dd className="font-semibold text-[var(--ink)]">{t("learn.scholar.page.used", { used: String(s.picks.length), total: String(s.trackCount) })}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ink3)]">{t("learn.scholar.account.code")}</dt>
            <dd className="font-mono text-xs font-semibold text-[var(--ink)]">{s.code}</dd>
          </div>
          {s.claimedAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">{t("learn.scholar.account.since")}</dt>
              <dd className="font-semibold text-[var(--ink)]">{fmtDate(s.claimedAt, locale)}</dd>
            </div>
          )}
          {s.partner && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">{t("learn.scholar.partner.label")}</dt>
              <dd className="break-words text-right font-semibold text-[var(--ink)]">{s.partner.name}</dd>
            </div>
          )}
          {s.sponsorName && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">{t("learn.scholar.letter.sponsor")}</dt>
              <dd className="break-words text-right font-semibold text-[var(--ink)]">{s.sponsorName}</dd>
            </div>
          )}
          {s.pickBy && !s.picksClosed && s.remaining > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">{t("learn.scholar.account.pickBy")}</dt>
              <dd className="font-semibold text-[var(--ink)]">{fmtDate(s.pickBy, locale)}</dd>
            </div>
          )}
          {s.completeBy && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink3)]">{t("learn.scholar.account.completeBy")}</dt>
              <dd className="font-semibold text-[var(--ink)]">{fmtDate(s.completeBy, locale)}</dd>
            </div>
          )}
        </dl>
      ))}
      <div className="flex flex-wrap gap-2 px-6 pb-5">
        {mine[0] && (
          <a href={`/api/learn/scholarship/letter?id=${encodeURIComponent(mine[0].id)}`} className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)]">
            ↓ {t("learn.scholar.page.letter")}
          </a>
        )}
        <Link href="/scholarship" className="inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white hover:opacity-90">
          {remaining > 0 ? t("learn.scholar.account.choose") : t("learn.scholar.account.view")} →
        </Link>
      </div>
    </section>
  );
}
