import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtDate, fmtNumber } from "@/lib/learn/format";
import { badgeNameKey } from "@/lib/learn/badge-defs";
import type { PortfolioData, PortfolioSection } from "@/lib/learn/method/portfolio";

// The portfolio itself, shared by the learner's own page and the public page.
// What it receives is already filtered to what may be shown; `hidden` only
// decides which empty sections to leave out on the public page.
export default async function PortfolioView({
  data,
  publicView,
  hidden = [],
}: {
  data: PortfolioData;
  publicView: boolean;
  hidden?: PortfolioSection[];
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const show = (s: PortfolioSection) => !publicView || !hidden.includes(s);
  // The public page leaves out empty sections as well as hidden ones.
  const vis = (s: PortfolioSection, n: number) => show(s) && (!publicView || n > 0);
  const card = "rounded-2xl border border-[var(--border)] bg-white p-5";
  const h2 = "flex items-center gap-2 text-lg font-bold text-[var(--ink)]";
  const empty = (key: string) => <p className="mt-3 text-sm text-[var(--ink3)]">{t(key)}</p>;

  return (
    <div className="space-y-8">
      {vis("labs", data.labs.length) && (
        <section aria-labelledby="pf-labs">
          <h2 id="pf-labs" className={h2}>
            <span aria-hidden="true">🧪</span> {t("method.portfolio.labs")}
          </h2>
          {data.labs.length === 0 ? (
            empty("method.portfolio.labsEmpty")
          ) : (
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {data.labs.map((l) => (
                <li key={l.id} className={card}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--orange2)]">
                    {t(`labs.type.${l.labType}.label`)}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-[var(--ink)]">{l.title}</h3>
                  <p className="mt-1 text-xs text-[var(--ink3)]">
                    {l.score != null && <strong className="text-green-700">{t("method.portfolio.score", { n: l.score })}</strong>}
                    {l.score != null && " · "}
                    {t("method.portfolio.passedOn", { date: fmtDate(l.date, locale) })}
                  </p>
                  {l.checks && l.checks.total > 0 && (
                    <p className="mt-1 text-xs font-semibold text-[var(--ink2)]">
                      ✓ {t("method.portfolio.checks", { passed: l.checks.passed, total: l.checks.total })}
                    </p>
                  )}
                  {l.excerpt && (
                    <blockquote className="mt-3 border-l-2 border-[var(--border)] pl-3 text-xs leading-relaxed text-[var(--ink2)]">
                      <span className="sr-only">{t("method.portfolio.workSample")}: </span>
                      {l.excerpt}
                    </blockquote>
                  )}
                  {l.artifactUrl && (
                    <a
                      href={l.artifactUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                      className="mt-2 inline-block text-xs font-semibold text-[var(--blue2)] underline"
                    >
                      {t("method.portfolio.artifact")} ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {vis("studio", data.studio.length) && (
        <section aria-labelledby="pf-studio">
          <h2 id="pf-studio" className={h2}>
            <span aria-hidden="true">🎮</span> {t("method.portfolio.studio")}
          </h2>
          {data.studio.length === 0 ? (
            empty("method.portfolio.studioEmpty")
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.studio.map((s) => (
                <li key={s.toolId} className={`${card} flex items-start gap-3`}>
                  <span aria-hidden="true" className="text-2xl">
                    {s.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--ink)]">{t(`studio.${s.toolId}.name`)}</span>
                    <span className="mt-0.5 block text-xs text-[var(--ink2)]">
                      {t(s.challenges === 1 ? "method.portfolio.studioCount.one" : "method.portfolio.studioCount.other", { n: s.challenges })}
                      {s.perfect > 0 && ` · ${t("method.portfolio.studioPerfect", { n: s.perfect })}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {vis("capstone", data.capstones.length) && (
        <section aria-labelledby="pf-capstone">
          <h2 id="pf-capstone" className={h2}>
            <span aria-hidden="true">🏗️</span> {t("method.portfolio.capstone")}
          </h2>
          {data.capstones.length === 0 ? (
            empty("method.portfolio.capstoneEmpty")
          ) : (
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {data.capstones.map((c, i) => (
                <li key={i} className={card}>
                  <h3 className="text-sm font-bold text-[var(--ink)]">{c.trackTitle}</h3>
                  <p className="mt-1 text-xs text-[var(--ink2)]">
                    <strong className={c.status === "passed" ? "text-green-700" : "text-[var(--ink)]"}>
                      {t(`labs.capstone.status.${c.status}`)}
                    </strong>
                    {c.score != null && ` · ${t("method.portfolio.capstoneScore", { n: c.score })}`} · {fmtDate(c.date, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {vis("certificates", data.certificates.length) && (
        <section aria-labelledby="pf-certs">
          <h2 id="pf-certs" className={h2}>
            <span aria-hidden="true">🎓</span> {t("method.portfolio.certificates")}
          </h2>
          {data.certificates.length === 0 ? (
            empty("method.portfolio.certificatesEmpty")
          ) : (
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {data.certificates.map((c) => (
                <li key={c.verificationId} className={card}>
                  <h3 className="text-sm font-bold text-[var(--ink)]">{c.name}</h3>
                  <p className="mt-1 text-xs text-[var(--ink3)]">
                    {t("learn.cert.issuedOn", { date: fmtDate(c.issuedAt, locale) })}
                    {c.distinction && (
                      <span className="ml-2 rounded bg-[var(--orange-light)] px-1.5 py-0.5 font-bold text-[var(--orange2)]">
                        {t("learn.cert.withDistinction")}
                      </span>
                    )}
                  </p>
                  <Link
                    href={`/certificates/${c.verificationId}`}
                    className="mt-2 inline-block text-xs font-semibold text-[var(--blue2)] underline"
                  >
                    {t("method.portfolio.verify")} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {vis("badges", data.badges.length) && (
        <section aria-labelledby="pf-badges">
          <h2 id="pf-badges" className={h2}>
            <span aria-hidden="true">🏅</span> {t("method.portfolio.badges")}
          </h2>
          {data.badges.length === 0 ? (
            empty("method.portfolio.badgesEmpty")
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.badges.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
                >
                  <span aria-hidden="true">{b.icon}</span> {t(badgeNameKey(b.id))}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {show("memory") && data.memory.cards > 0 && (
        <section aria-labelledby="pf-memory">
          <h2 id="pf-memory" className={h2}>
            <span aria-hidden="true">🧠</span> {t("method.portfolio.memory")}
          </h2>
          <p className={`${card} mt-3 text-sm text-[var(--ink2)]`}>
            {t("method.portfolio.memoryBody", { cards: fmtNumber(data.memory.cards, locale), mastered: fmtNumber(data.memory.mastered, locale) })}
          </p>
        </section>
      )}

      {(!publicView || data.reflections.length > 0) && (
        <section aria-labelledby="pf-reflections">
          <h2 id="pf-reflections" className={h2}>
            <span aria-hidden="true">✍️</span> {t("method.portfolio.reflections")}
            {!publicView && (
              <span className="rounded-full bg-[var(--s2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ink3)]">
                🔒 {t("method.portfolio.privateTag")}
              </span>
            )}
          </h2>
          {data.reflections.length === 0 ? (
            empty("method.portfolio.reflectionsEmpty")
          ) : (
            <ul className="mt-3 space-y-3">
              {data.reflections.map((r) => (
                <li key={r.lessonId} className={card}>
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {publicView ? (
                      r.lessonTitle
                    ) : (
                      <Link href={`/learn/lesson/${r.lessonId}#reflect`} className="hover:underline">
                        {r.lessonTitle}
                      </Link>
                    )}
                  </h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--ink2)]">{r.text}</p>
                  <p className="mt-2 text-[11px] text-[var(--ink3)]">{fmtDate(r.updatedAt, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
