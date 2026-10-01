import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import CertificateActions from "@/components/learn/CertificateActions";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import { getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ verificationId: string }>;
}): Promise<Metadata> {
  const { verificationId } = await params;
  const cert = await prisma.learnCertificate
    .findUnique({
      where: { verificationId },
      select: { recipientName: true, certificateName: true, revoked: true },
    })
    .catch(() => null);

  const t = await getT();
  if (!cert) return { title: t("learn.verify.notFoundMeta"), robots: { index: false, follow: false } };
  const vars = { cert: cert.certificateName, name: cert.recipientName };
  return pageMetadata({
    path: `/certificates/${verificationId}`,
    title: t("learn.verify.metaTitle", vars),
    description: t("learn.verify.metaDescription", vars),
    // A revoked certificate's page stays reachable for verifiers, but out
    // of search results.
    noindex: cert.revoked,
  });
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ verificationId: string }>;
}) {
  const { verificationId } = await params;

  const cert = await prisma.learnCertificate
    .findUnique({
      where: { verificationId },
      include: { track: { select: { title: true, accentColor: true, estimatedHours: true } } },
    })
    .catch(() => null);
  const t = await getT();

  // ── Not found ───────────────────────────────────────────────────────────
  if (!cert) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--s2)] px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
          <span aria-hidden="true" className="text-4xl">
            🔍
          </span>
          <h1 className="mt-4 text-xl font-black text-[var(--ink)]">{t("learn.cert.notFound")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.verify.notFoundBody")}</p>
          <Link
            href="/learning-box"
            className="mt-6 inline-block rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white"
          >
            {t("learn.verify.explore")} →
          </Link>
        </div>
      </div>
    );
  }

  // ── Revoked ─────────────────────────────────────────────────────────────
  if (cert.revoked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--s2)] px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-8 text-center">
          <span aria-hidden="true" className="text-4xl">
            ⚠️
          </span>
          <h1 className="mt-4 text-xl font-black text-red-700">{t("learn.cert.revoked")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.verify.revokedBody")}</p>
          <p className="mt-4 font-mono text-xs text-[var(--ink3)]">{cert.verificationId}</p>
        </div>
      </div>
    );
  }

  // ── Valid ───────────────────────────────────────────────────────────────
  // The certificate itself (#certificate, also what prints to PDF) stays in
  // English: it is the legal document, and its name is the award's name. The
  // page around it is translated.
  const issued = cert.issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-[var(--s2)] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800">
          ✓ {t("learn.cert.verified")}
        </div>

        {/* The certificate itself */}
        <article
          id="certificate"
          className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
        >
          <div className="h-2" style={{ background: cert.track.accentColor }} />
          <div className="px-8 py-10 text-center sm:px-12 sm:py-14">
            <ArfaWordmark size="md" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink3)]">
              Certificate of Completion
            </p>

            <p className="mt-10 text-xs uppercase tracking-wide text-[var(--ink3)]">
              This certifies that
            </p>
            <h1 className="mt-2 text-3xl font-black text-[var(--ink)] sm:text-4xl">
              {cert.recipientName}
            </h1>

            <p className="mt-6 text-xs uppercase tracking-wide text-[var(--ink3)]">
              has successfully completed
            </p>
            <h2 className="mt-2 text-xl font-bold" style={{ color: cert.track.accentColor }}>
              {cert.certificateName}
            </h2>

            {cert.distinction && (
              <p className="mt-4 inline-block rounded-full bg-[var(--orange-light)] px-4 py-1.5 text-sm font-black uppercase tracking-wide text-[var(--orange2)]">
                ★ With Distinction
              </p>
            )}

            <p className="mx-auto mt-8 max-w-md text-xs leading-relaxed text-[var(--ink2)]">
              Awarded on completion of all module assessments, a proctored timed final exam
              {cert.examScore != null && ` (scored ${cert.examScore}%)`}, and a capstone project
              assessed against a published rubric by a TIBLOGICS reviewer.
            </p>

            <div className="mt-10 flex flex-wrap items-end justify-center gap-x-12 gap-y-6 border-t border-[var(--border)] pt-8">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--ink3)]">Issued</p>
                <p className="mt-1 text-sm font-bold text-[var(--ink)]">{issued}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--ink3)]">Verification ID</p>
                <p className="mt-1 font-mono text-xs font-bold text-[var(--ink)]">
                  {cert.verificationId}
                </p>
              </div>
            </div>
            <p className="mt-8 text-xs font-semibold text-[var(--ink2)]">
              Issued by ARFA, the{" "}
              <span className="font-black tracking-tight text-[var(--ink)]">
                TIB<span className="text-[var(--orange)]">LOGICS</span>
              </span>{" "}
              AI Academy
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--ink3)]">
              ARFA: AI Readiness For All
            </p>
          </div>
        </article>

        <CertificateActions
          certificateName={cert.certificateName}
          verificationId={cert.verificationId}
          issuedAt={cert.issuedAt.toISOString()}
        />

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("learn.cert.whatRequired")}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ink2)]">
            {[1, 2, 3, 4].map((n) => (
              <li key={n}>✓ {t(`learn.verify.required.${n}`)}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--ink3)]">{t("learn.verify.permanent")}</p>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--ink3)]">
          <Link href="/learning-box" className="font-semibold text-[var(--blue2)] underline">
            {t("learn.verify.exploreBox")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
