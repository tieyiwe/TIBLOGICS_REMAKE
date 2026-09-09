import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import CertificateActions from "@/components/learn/CertificateActions";

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
      select: { recipientName: true, certificateName: true },
    })
    .catch(() => null);

  if (!cert) return { title: "Certificate not found | TIBLOGICS" };
  return {
    title: `${cert.certificateName} — ${cert.recipientName} | TIBLOGICS`,
    description: `Verify ${cert.recipientName}'s ${cert.certificateName} certificate from TIBLOGICS.`,
  };
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

  // ── Not found ───────────────────────────────────────────────────────────
  if (!cert) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--s2)] px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
          <span aria-hidden="true" className="text-4xl">
            🔍
          </span>
          <h1 className="mt-4 text-xl font-black text-[var(--ink)]">No certificate found</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
            This verification code doesn't match any certificate we've issued. Check the code and
            try again — codes are case-sensitive.
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-block rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white"
          >
            Explore our courses →
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
          <h1 className="mt-4 text-xl font-black text-red-700">Certificate revoked</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
            This certificate was issued but has since been revoked and is no longer valid.
          </p>
          <p className="mt-4 font-mono text-xs text-[var(--ink3)]">{cert.verificationId}</p>
        </div>
      </div>
    );
  }

  // ── Valid ───────────────────────────────────────────────────────────────
  const issued = cert.issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-[var(--s2)] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800">
          ✓ Verified — this is a genuine TIBLOGICS certificate
        </div>

        {/* The certificate itself */}
        <article
          id="certificate"
          className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
        >
          <div className="h-2" style={{ background: cert.track.accentColor }} />
          <div className="px-8 py-10 text-center sm:px-12 sm:py-14">
            <p className="text-lg font-black tracking-tight text-[var(--ink)]">
              TIB<span className="text-[var(--orange)]">LOGICS</span>
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink3)]">
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
          </div>
        </article>

        <CertificateActions
          certificateName={cert.certificateName}
          verificationId={cert.verificationId}
          issuedAt={cert.issuedAt.toISOString()}
        />

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">What this certificate required</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ink2)]">
            <li>✓ A quick check completed after every lesson in the track</li>
            <li>✓ A passing score on the quiz in every module</li>
            <li>✓ A timed, randomized final exam sat under a server-enforced clock</li>
            <li>✓ A capstone project reviewed and approved by a person, against a published rubric</li>
          </ul>
          <p className="mt-4 text-xs text-[var(--ink3)]">
            Anyone can verify this certificate at this URL. It stays valid permanently, whether or
            not the holder remains a subscriber.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--ink3)]">
          <Link href="/courses" className="font-semibold text-[var(--blue2)] underline">
            Explore TIBLOGICS courses →
          </Link>
        </p>
      </div>
    </div>
  );
}
