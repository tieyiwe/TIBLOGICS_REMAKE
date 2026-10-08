import type { Metadata } from "next";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ClientMessages from "@/components/i18n/ClientMessages";
import { PortalChildActions, PortalLogin, PortalLogout } from "@/components/learn/youth/PortalClient";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtDate } from "@/lib/learn/format";
import { readYouthProfile, youthGate } from "@/lib/learn/youth-account";
import { parentSummary } from "@/lib/learn/youth-dashboard";
import { ENCOURAGE_PRESETS, childrenFor, portalAuth, sponsorsOf } from "@/lib/learn/youth-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ARFA · Parent & Sponsor Portal",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

// AI-Empowered Youth: the Parent & Sponsor Portal. One sign-in (email link)
// shows every youth learner linked to the address: as parent (settings,
// consent and deletion stay on each child's parent dashboard) or as sponsor
// (progress only). ?encourage=<id> opens that child's "Encourage" panel (the
// one-tap link in the pause email).
export default async function PortalPage({ searchParams }: { searchParams: Promise<{ encourage?: string }> }) {
  const sp = await searchParams;
  const [t, locale, email] = await Promise.all([getT(), getLocale(), portalAuth()]);

  const shell = (body: React.ReactNode, signedIn = false) => (
    <ClientMessages area="learn">
      <div className="min-h-screen bg-[var(--s2)]">
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
            <div className="flex items-center gap-2">
              {signedIn && <PortalLogout />}
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-4xl px-4 py-8">{body}</main>
      </div>
    </ClientMessages>
  );

  if (!email) {
    return shell(
      <section className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="portal-login">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">{t("learn.youth.program")}</p>
        <h1 className="mt-1 text-xl font-black text-[var(--ink)]">{t("learn.portal.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.portal.login.body")}</p>
        <PortalLogin />
      </section>,
    );
  }

  const links = await childrenFor(email);
  const cards = await Promise.all(
    links.map(async (link) => {
      const child = await readYouthProfile(link.studentId);
      if (!child) return null;
      const gate = youthGate(child);
      const [summary, sponsors] = await Promise.all([
        gate ? Promise.resolve(null) : parentSummary(child),
        link.role === "parent" ? sponsorsOf(child.studentId) : Promise.resolve([]),
      ]);
      return { link, child, gate, summary, sponsors };
    }),
  );

  return shell(
    <div className="space-y-6" data-testid="portal">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">{t("learn.youth.program")}</p>
        <h1 className="mt-1 text-2xl font-black text-[var(--ink)] sm:text-3xl">{t("learn.portal.title")}</h1>
        <p className="mt-1 break-all text-sm text-[var(--ink3)]">{t("learn.portal.signedInAs", { email })}</p>
      </header>
      {cards.filter(Boolean).length === 0 && (
        <p className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--ink2)]" data-testid="portal-empty">{t("learn.portal.empty")}</p>
      )}
      {cards.map((c) => {
        if (!c) return null;
        const first = c.child.name.trim().split(/\s+/)[0] || "";
        const s = c.summary;
        return (
          <section key={c.child.studentId} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" data-testid={`portal-child-${c.child.studentId}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-black text-[var(--ink)]">{first}</h2>
              <span className="rounded-full bg-[var(--s2)] px-3 py-1 text-xs font-bold text-[var(--ink2)]">
                {t(c.link.role === "parent" ? "learn.portal.role.parent" : "learn.portal.role.sponsor")}
              </span>
            </div>
            {c.gate ? (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                {t(c.gate === "revoked" ? "learn.portal.state.revoked" : "learn.portal.state.pending", { name: first })}
              </p>
            ) : s ? (
              <>
                {s.lane && <p className="text-sm text-[var(--ink2)]">{t("learn.parent.lane", { lane: s.lane.title })}</p>}
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["learn.parent.stat.lessons", s.lessonsDone],
                    ["learn.parent.stat.lessonsWeek", s.lessonsThisWeek],
                    ["learn.parent.stat.quizzes", s.quizzesPassed],
                    ["learn.parent.stat.minutesWeek", t("learn.parent.minutes", { n: s.minutesThisWeek })],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-xl bg-[var(--s2)] p-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink3)]">{t(k as string)}</dt>
                      <dd className="mt-1 text-xl font-black text-[var(--ink)]">{v}</dd>
                    </div>
                  ))}
                </dl>
                {s.recent.length > 0 && (
                  <ul className="space-y-1 text-sm text-[var(--ink2)]">
                    {s.recent.slice(0, 3).map((r, i) => (
                      <li key={i} className="flex flex-wrap justify-between gap-x-3">
                        <span className="min-w-0 break-words"><span className="text-xs font-semibold uppercase text-[var(--ink3)]">{t(`learn.parent.kind.${r.kind}`)}</span> {r.title}</span>
                        <span className="text-xs text-[var(--ink3)]">{fmtDate(r.at, locale)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}
            <PortalChildActions
              studentId={c.child.studentId}
              firstName={first}
              role={c.link.role}
              canEncourage={!c.gate}
              openEncourage={sp.encourage === c.child.studentId}
              presets={ENCOURAGE_PRESETS.map((k) => ({ key: k, text: t(`learn.youth.enc.preset.${k}`, { name: first }) }))}
              sponsors={c.sponsors.map((x) => ({ id: x.id, email: x.email, name: x.name }))}
              dashboardHref={c.link.role === "parent" && c.child.parentToken ? `/parent/${c.child.parentToken}` : null}
              weeklyOptOut={c.link.weeklyOptOut}
            />
          </section>
        );
      })}
    </div>,
    true,
  );
}
