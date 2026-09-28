import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { finalExamPassed } from "@/lib/learn/assessments";
import Markdown from "@/components/learn/Markdown";
import CapstoneSubmitForm from "@/components/learn/CapstoneSubmitForm";
import CapstoneStatus from "@/components/learn/CapstoneStatus";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack } from "@/lib/i18n/sources/learn";
import { localizeCapstone } from "@/lib/i18n/sources/labs";

export const dynamic = "force-dynamic";

export default async function CapstonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const track = await prisma.learnTrack
    .findUnique({
      where: { slug },
      select: {
        id: true, slug: true, title: true, accentColor: true,
        capstone: { select: { id: true, briefMd: true, rubric: true, passThreshold: true } },
      },
    })
    .catch(() => null);

  if (!track?.capstone) notFound();
  const capstone = track.capstone;

  const [submissions, examOk] = await Promise.all([
    prisma.capstoneSubmission.findMany({
      where: { studentId: student.id, capstoneId: capstone.id },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    finalExamPassed(student.id, track.id),
  ]);

  const latest = submissions[0] ?? null;
  const locale = await getLocale();
  const t = translatorFor(locale);
  // Brief and rubric in the learner's language; the reviewer's own notes stay
  // as the reviewer wrote them.
  const [shown, [source]] = await Promise.all([
    localizeCapstone(capstone, locale),
    loadTrackSources({ id: track.id }),
  ]);
  const trackTitle = source ? (await localizedTrack(source, locale)).text.title : track.title;
  const rubric = shown.rubric;
  const canSubmit = !latest || latest.status === "revisions_requested" || latest.status === "failed";

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${track.slug}`} className="hover:text-[var(--ink)]">
          {trackTitle}
        </Link>
      </nav>

      <h1 className="text-2xl font-black text-[var(--ink)]">{t("labs.capstone.title")}</h1>
      <p className="mt-1 text-sm text-[var(--ink3)]">{t("labs.capstone.subtitle")}</p>
      {shown.pending && (
        <p className="mt-3 rounded-lg bg-[var(--s2)] px-4 py-2.5 text-sm text-[var(--ink2)]">{t("common.translationPending")}</p>
      )}

      {latest && (
        <div className="mt-6">
          <CapstoneStatus
            status={latest.status}
            score={latest.score}
            reviewerNotes={latest.reviewerNotes}
            submittedAt={latest.createdAt.toISOString()}
            reviewedAt={latest.reviewedAt?.toISOString() ?? null}
            passThreshold={capstone.passThreshold}
            accentColor={track.accentColor}
          />
        </div>
      )}

      {/* Brief */}
      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
        <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.capstone.brief")}</h2>
        <div className="mt-4">
          <Markdown source={shown.briefMd} />
        </div>
      </section>

      {/* Rubric — published up front, never a surprise */}
      {rubric.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
          <h2 className="text-base font-bold text-[var(--ink)]">{t("labs.capstone.howScored")}</h2>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {t("labs.capstone.howScoredBody", { pass: capstone.passThreshold })}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="pb-2 font-semibold text-[var(--ink)]">{t("labs.capstone.criterion")}</th>
                  <th className="pb-2 text-right font-semibold text-[var(--ink)]">{t("labs.capstone.weight")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rubric.map((r, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-[var(--ink)]">{r.criterion}</span>
                      {r.description && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink3)]">
                          {r.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right align-top font-bold text-[var(--ink2)]">
                      {r.weight}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Submission */}
      <section className="mt-6">
        {!examOk ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
            <p className="text-sm font-semibold text-[var(--ink)]">{t("labs.capstone.examFirst")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink2)]">{t("labs.capstone.examFirstBody")}</p>
            <Link
              href={`/learn/exam/${track.slug}`}
              className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-bold text-white"
              style={{ background: track.accentColor }}
            >
              {t("labs.capstone.goExam")}
            </Link>
          </div>
        ) : canSubmit ? (
          <CapstoneSubmitForm
            capstoneId={capstone.id}
            accentColor={track.accentColor}
            isResubmission={!!latest}
          />
        ) : null}
      </section>

      {submissions.length > 1 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("labs.capstone.history")}</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-[var(--ink2)]">{s.createdAt.toLocaleDateString(locale)}</span>
                <span className="font-semibold text-[var(--ink)]">
                  {t(`labs.capstone.status.${s.status}`)}
                  {s.score != null && ` · ${s.score}%`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
