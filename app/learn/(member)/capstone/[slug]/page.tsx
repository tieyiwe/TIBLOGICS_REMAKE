import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { finalExamPassed } from "@/lib/learn/assessments";
import Markdown from "@/components/learn/Markdown";
import CapstoneSubmitForm from "@/components/learn/CapstoneSubmitForm";
import CapstoneStatus from "@/components/learn/CapstoneStatus";

export const dynamic = "force-dynamic";

interface RubricRow {
  criterion: string;
  weight: number;
  description?: string;
}

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
  const rubric: RubricRow[] = Array.isArray(capstone.rubric)
    ? (capstone.rubric as unknown as RubricRow[])
    : [];
  const canSubmit = !latest || latest.status === "revisions_requested" || latest.status === "failed";

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--ink3)]">
        <Link href={`/learn/track/${track.slug}`} className="hover:text-[var(--ink)]">
          {track.title}
        </Link>
      </nav>

      <h1 className="text-2xl font-black text-[var(--ink)]">Capstone project</h1>
      <p className="mt-1 text-sm text-[var(--ink3)]">
        The last requirement. A person reads this and writes you real feedback.
      </p>

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
        <h2 className="text-base font-bold text-[var(--ink)]">The brief</h2>
        <div className="mt-4">
          <Markdown source={capstone.briefMd} />
        </div>
      </section>

      {/* Rubric — published up front, never a surprise */}
      {rubric.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
          <h2 className="text-base font-bold text-[var(--ink)]">How it's scored</h2>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            You need {capstone.passThreshold}% overall to pass. This is the exact rubric your
            reviewer uses — there's nothing hidden.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="pb-2 font-semibold text-[var(--ink)]">Criterion</th>
                  <th className="pb-2 text-right font-semibold text-[var(--ink)]">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rubric.map((r) => (
                  <tr key={r.criterion}>
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
            <p className="text-sm font-semibold text-[var(--ink)]">
              Pass the final exam before submitting
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink2)]">
              You can read the brief and start building now — you just can't submit until the exam
              is behind you.
            </p>
            <Link
              href={`/learn/exam/${track.slug}`}
              className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-bold text-white"
              style={{ background: track.accentColor }}
            >
              Go to the final exam →
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
          <h2 className="text-sm font-bold text-[var(--ink)]">Submission history</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-[var(--ink2)]">{s.createdAt.toLocaleDateString()}</span>
                <span className="font-semibold capitalize text-[var(--ink)]">
                  {s.status.replace("_", " ")}
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
