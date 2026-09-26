import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";

export const dynamic = "force-dynamic";

export default async function MyCertificatesPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const certs = await prisma.learnCertificate
    .findMany({
      where: { studentId: student.id },
      orderBy: { issuedAt: "desc" },
      include: { track: { select: { title: true, accentColor: true } } },
    })
    .catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--ink)]">Certificates</h1>
      <p className="mt-1 text-sm text-[var(--ink3)]">
        Each one carries a public verification link that stays valid even if you cancel.
      </p>

      {certs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
          <p className="text-sm font-semibold text-[var(--ink)]">No certificates yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink2)]">
            To earn one you'll need to pass every module quiz, clear the timed final exam, and have
            your capstone approved by a reviewer.
          </p>
          <Link
            href="/learn/tracks"
            className="mt-5 inline-block rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white"
          >
            Go to my tracks →
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
                {c.track.title} · issued {c.issuedAt.toLocaleDateString()}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {c.distinction && (
                  <span className="rounded bg-[var(--orange-light)] px-2 py-0.5 text-xs font-bold text-[var(--orange2)]">
                    With Distinction
                  </span>
                )}
                {c.revoked && (
                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                    Revoked
                  </span>
                )}
              </div>

              {!c.revoked && (
                <Link
                  href={`/certificates/${c.verificationId}`}
                  className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-bold text-white"
                  style={{ background: c.track.accentColor }}
                >
                  View & share →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
