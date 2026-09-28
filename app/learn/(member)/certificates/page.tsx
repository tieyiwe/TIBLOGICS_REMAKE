import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import type { Metadata } from "next";
import { fmtDate } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.nav.certificates") };
}

export default async function MyCertificatesPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const certs = await prisma.learnCertificate
    .findMany({
      where: { studentId: student.id },
      orderBy: { issuedAt: "desc" },
      include: { track: { select: { id: true, slug: true, title: true, accentColor: true } } },
    })
    .catch(() => []);
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  // Track titles are translated; certificate names stay in English (they are
  // the legal name of the award).
  const { texts } = await localizedTracks(
    locale === "en" || certs.length === 0 ? [] : await loadTrackSources({ id: { in: certs.map((c) => c.track.id) } }),
    locale,
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--ink)]">{t("learn.nav.certificates")}</h1>
      <p className="mt-1 text-sm text-[var(--ink3)]">{t("learn.certs.intro")}</p>

      {certs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
          <p className="text-sm font-semibold text-[var(--ink)]">{t("learn.cert.noneYet")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink2)]">{t("learn.certs.howToEarn")}</p>
          <Link
            href="/learn/tracks"
            className="mt-5 inline-block rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white"
          >
            {t("learn.certs.goToTracks")} →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {certs.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-[var(--border)] bg-white p-6"
              style={{ borderTopWidth: 4, borderTopColor: c.track.accentColor }}
            >
              <h2 className="text-base font-bold text-[var(--ink)]">{c.certificateName}</h2>
              <p className="mt-1 text-xs text-[var(--ink3)]">
                {texts.get(c.track.slug)?.title ?? c.track.title} · {t("learn.cert.issuedOn", { date: fmtDate(c.issuedAt, locale) })}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {c.distinction && (
                  <span className="rounded bg-[var(--orange-light)] px-2 py-0.5 text-xs font-bold text-[var(--orange2)]">
                    {t("learn.cert.withDistinction")}
                  </span>
                )}
                {c.revoked && (
                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                    {t("learn.certs.revoked")}
                  </span>
                )}
              </div>

              {!c.revoked && (
                <Link
                  href={`/certificates/${c.verificationId}`}
                  className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-bold text-white"
                  style={{ background: c.track.accentColor }}
                >
                  {t("learn.certs.viewShare")} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
