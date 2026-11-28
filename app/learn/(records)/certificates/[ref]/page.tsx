import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { findCertificate, linkedInCertUrl } from "@/lib/learn/cert/ref";
import { verifyUrlFor } from "@/lib/learn/cert/data";
import CertificateView from "@/components/learn/cert/CertificateView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.certview.title") };
}

// The learner's certificate, with confetti: view, download (PDF or image),
// add to LinkedIn, copy the verification link.
export default async function MyCertificatePage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ celebrate?: string }> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const { ref } = await params;
  const sp = await searchParams;
  const c = await findCertificate(decodeURIComponent(ref)).catch(() => null);
  if (!c || c.studentId !== student.id) notFound();
  if (!c.nameConfirmedAt) redirect(`/learn/certificates/${encodeURIComponent(c.reference)}/claim`);
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const base = `/certificates/${encodeURIComponent(c.reference)}`;
  const verifyUrl = verifyUrlFor(c.reference);
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm text-[var(--ink3)]">
        <Link href="/learn/certificates" className="hover:text-[var(--ink)]">{t("learn.certview.back")}</Link>
      </p>
      <h1 className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">{t("learn.certview.congrats", { name: c.recipientName.split(" ")[0] })}</h1>
      {sp.celebrate === "1" && <p className="mt-1 text-sm text-[var(--ink3)]">{t("learn.certview.sent")}</p>}
      <div className="mt-6">
        <CertificateView
          reference={c.reference}
          imageUrl={`${base}/image?lang=${locale}`}
          pdfUrl={`${base}/pdf?lang=${locale}`}
          pngUrl={`${base}/image?download=1&lang=${locale}`}
          verifyUrl={verifyUrl}
          linkedInUrl={linkedInCertUrl(c, verifyUrl)}
          alt={`${c.certificateName}: ${c.recipientName}`}
          celebrate
        />
      </div>
    </div>
  );
}
