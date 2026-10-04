import type { Metadata } from "next";
import Link from "next/link";
import CertificateView from "@/components/learn/cert/CertificateView";
import { getLocale, getT } from "@/lib/i18n/server";
import { findCertificate } from "@/lib/learn/cert/ref";
import { verifyUrlFor } from "@/lib/learn/cert/data";
import { pageMetadata } from "@/lib/seo/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ verificationId: string }>;
}): Promise<Metadata> {
  const { verificationId } = await params;
  const found = await findCertificate(verificationId).catch(() => null);
  const cert = found && found.nameConfirmedAt ? found : null;

  const t = await getT();
  if (!cert) return { title: t("learn.verify.notFoundMeta"), robots: { index: false, follow: false } };
  const vars = { cert: cert.certificateName, name: cert.recipientName };
  return pageMetadata({
    path: `/certificates/${cert.reference}`,
    // The certificate itself as the share preview.
    image: { url: `/certificates/${cert.reference}/image`, width: 2000, height: 1414 },
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

  // By reference (ARFA-...) or the older verification id. A certificate whose
  // name is not confirmed yet is not public.
  const found = await findCertificate(decodeURIComponent(verificationId)).catch(() => null);
  const cert = found && found.nameConfirmedAt ? found : null;
  const [t, locale] = await Promise.all([getT(), getLocale()]);

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
          <p className="mt-4 font-mono text-xs text-[var(--ink3)]">{cert.reference}</p>
        </div>
      </div>
    );
  }

  // ── Valid ───────────────────────────────────────────────────────────────
  const base = `/certificates/${encodeURIComponent(cert.reference)}`;
  return (
    <div className="bg-[var(--s2)] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800" data-testid="cert-verified">
          ✓ {t("learn.cert.verified")}: {cert.recipientName} · {cert.certificateName}
          {cert.distinction ? ` · ${t("learn.cert.withDistinction")}` : ""}
        </div>
        <div className="mt-5">
          <CertificateView
            reference={cert.reference}
            imageUrl={`${base}/image?lang=${locale}`}
            pdfUrl={`${base}/pdf?lang=${locale}`}
            pngUrl={`${base}/image?download=1&lang=${locale}`}
            verifyUrl={verifyUrlFor(cert.reference)}
            alt={`${cert.certificateName}: ${cert.recipientName}`}
          />
        </div>

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
