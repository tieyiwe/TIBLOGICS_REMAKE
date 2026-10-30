import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { findCertificate } from "@/lib/learn/cert/ref";
import ClaimForm from "@/components/learn/cert/ClaimForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.claim.title") };
}

// After the track is complete: type the name to print, confirm, receive the certificate.
export default async function ClaimCertificatePage({ params }: { params: Promise<{ ref: string }> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const { ref } = await params;
  const c = await findCertificate(decodeURIComponent(ref)).catch(() => null);
  if (!c || c.studentId !== student.id || c.revoked) notFound();
  if (c.nameConfirmedAt) redirect(`/learn/certificates/${encodeURIComponent(c.reference)}`);
  const t = await getT();
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm text-[var(--ink3)]">
        <Link href="/learn/certificates" className="hover:text-[var(--ink)]">{t("learn.certview.back")}</Link>
      </p>
      <h1 className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">🎓 {t("learn.claim.title")}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--ink2)]">{t("learn.claim.intro", { cert: c.certificateName })}</p>
      <div className="mt-6">
        <ClaimForm reference={c.reference} initialName={student.name} />
      </div>
    </div>
  );
}
