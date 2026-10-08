import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ClientMessages from "@/components/i18n/ClientMessages";
import SkillsRadarCard from "@/components/learn/skills/SkillsRadarCard";
import ParentControls from "@/components/learn/youth/ParentControls";
import { getLocale, getT } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { fmtDate } from "@/lib/learn/format";
import { ARFA_EMAIL } from "@/lib/learn/emails";
import { loadSkillProfile } from "@/lib/learn/skills/radar";
import { needsParentConsent, parentFromToken } from "@/lib/learn/youth-account";
import { parentSummary } from "@/lib/learn/youth-dashboard";

export const dynamic = "force-dynamic";

// The link is the credential: never indexed, never sent on as a Referer.
export const metadata: Metadata = {
  title: "ARFA · Parent dashboard",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

// AI-Empowered Youth parent dashboard, reached from the link in the parent
// emails (no sign-in). Under 13 it first asks the parent to read the notice
// and confirm; then it shows the child's learning and the settings.
export default async function ParentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [t, locale, h] = await Promise.all([getT(), getLocale(), headers()]);
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const allowed = await checkRateLimit(`parent-view:${ip}`, 60, 600_000);
  const child = allowed ? await parentFromToken(token) : null;

  const shell = (body: React.ReactNode) => (
    <ClientMessages area="learn">
      <div className="min-h-screen bg-[var(--s2)]">
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
            <LanguageSwitcher />
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-4xl px-4 py-8">{body}</main>
      </div>
    </ClientMessages>
  );

  if (!child) {
    return shell(
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="parent-invalid">
        <h1 className="text-xl font-black text-[var(--ink)]">{t(allowed ? "learn.parent.invalid.title" : "learn.parent.invalid.busy")}</h1>
        <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.parent.invalid.body", { email: ARFA_EMAIL })}</p>
      </section>,
    );
  }

  const first = child.name.trim().split(/\s+/)[0] || "";
  const consentNeeded = needsParentConsent(child) && child.parentConsent !== "granted";
  const stage: "consent" | "revoked" | "active" = child.parentConsent === "revoked" ? "revoked" : consentNeeded ? "consent" : "active";
  const showData = stage === "active";
  const [summary, skills] = showData
    ? await Promise.all([parentSummary(child), loadSkillProfile(child.studentId).catch(() => null)])
    : [null, null];

  const stat = (label: string, value: string | number, id: string) => (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4" data-testid={`parent-stat-${id}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--ink)]">{value}</p>
    </div>
  );

  return shell(
    <div className="space-y-6" data-testid="parent-dashboard">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">{t("learn.youth.program")}</p>
        <h1 className="mt-1 text-2xl font-black text-[var(--ink)] sm:text-3xl">{t("learn.parent.title", { name: first })}</h1>
        {summary?.lane && (
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {t("learn.parent.lane", { lane: summary.lane.title })} · {t(summary.band === "explorer" ? "learn.youth.band.explorer" : "learn.youth.band.builder")}
          </p>
        )}
      </header>

      {child.parentDeleteRequestedAt && (
        <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900" data-testid="parent-deleting">
          {t("learn.parent.deleting", { date: fmtDate(child.parentDeleteRequestedAt, locale) })}
        </p>
      )}

      {stage !== "active" && (
        <section className="rounded-2xl border-2 border-[var(--orange)] bg-white p-5 sm:p-6" data-testid="parent-consent">
          <h2 className="text-lg font-black text-[var(--ink)]">
            {t(stage === "revoked" ? "learn.parent.consent.revokedTitle" : "learn.parent.consent.title", { name: first })}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.parent.consent.intro", { name: first })}</p>
          <h3 className="mt-4 text-sm font-bold text-[var(--ink)]">{t("learn.email.youth.collect.title")}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--ink2)]">
            {[1, 2, 3, 4].map((n) => <li key={n}>{t(`learn.email.youth.collect.${n}`)}</li>)}
          </ul>
          <h3 className="mt-4 text-sm font-bold text-[var(--ink)]">{t("learn.email.youth.why.title")}</h3>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("learn.email.youth.why.body")}</p>
          <h3 className="mt-4 text-sm font-bold text-[var(--ink)]">{t("learn.email.youth.safety.title")}</h3>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("learn.email.youth.safety.body")}</p>
          <h3 className="mt-4 text-sm font-bold text-[var(--ink)]">{t("learn.email.youth.delete.title")}</h3>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("learn.email.youth.delete.body", { email: ARFA_EMAIL })}</p>
          <p className="mt-3 text-xs text-[var(--ink3)]">
            <Link href="/privacy" className="underline" rel="noreferrer">{t("learn.parent.privacyLink")}</Link>
          </p>
        </section>
      )}

      {summary && (
        <>
          <section aria-labelledby="parent-progress" className="space-y-3">
            <h2 id="parent-progress" className="text-base font-bold text-[var(--ink)]">{t("learn.parent.progress")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stat(t("learn.parent.stat.lessons"), summary.lessonsDone, "lessons")}
              {stat(t("learn.parent.stat.quizzes"), summary.quizzesPassed, "quizzes")}
              {stat(t("learn.parent.stat.labs"), summary.labsPassed, "labs")}
              {stat(t("learn.parent.stat.lessonsWeek"), summary.lessonsThisWeek, "week")}
              {stat(t("learn.parent.stat.minutesWeek"), t("learn.parent.minutes", { n: summary.minutesThisWeek }), "minutes")}
              {stat(t("learn.parent.stat.certificates"), summary.certificates.length, "certificates")}
            </div>
            <p className="text-xs text-[var(--ink3)]">{t("learn.parent.minutesNote")}</p>
          </section>

          <section aria-labelledby="parent-recent" className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 id="parent-recent" className="text-base font-bold text-[var(--ink)]">{t("learn.parent.recent")}</h2>
            {summary.recent.length ? (
              <ul className="mt-3 divide-y divide-[var(--border)]">
                {summary.recent.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2 text-sm">
                    <span className="min-w-0 break-words text-[var(--ink)]">
                      <span className="text-xs font-semibold uppercase text-[var(--ink3)]">{t(`learn.parent.kind.${r.kind}`)}</span> {r.title}
                      {r.passed === true && <span className="ml-1 text-green-700">✓</span>}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--ink3)]">{fmtDate(r.at, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--ink3)]">{t("learn.parent.noActivity", { name: first })}</p>
            )}
          </section>

          {skills && skills.results > 0 && <SkillsRadarCard profile={skills} publicView idPrefix="parent-skills" />}

          <section aria-labelledby="parent-certs" className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 id="parent-certs" className="text-base font-bold text-[var(--ink)]">{t("learn.parent.certificates")}</h2>
            {summary.certificates.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {summary.certificates.map((c) => (
                  <li key={c.verificationId} className="flex flex-wrap justify-between gap-2">
                    <a href={`/certificates/${c.verificationId}`} rel="noreferrer" className="font-semibold text-[var(--blue2)] underline">{c.name}</a>
                    <span className="text-xs text-[var(--ink3)]">{fmtDate(c.issuedAt, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--ink3)]">{t("learn.parent.noCertificates")}</p>
            )}
          </section>
        </>
      )}

      <ParentControls
        token={token}
        stage={stage}
        firstName={first}
        boards={child.parentBoardsOptIn}
        deleteRequested={!!child.parentDeleteRequestedAt}
      />
    </div>,
  );
}
