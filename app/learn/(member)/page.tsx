import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { getAllTrackProgress } from "@/lib/learn/progress";
import { computeStreak, getTotalPoints, levelFor } from "@/lib/learn/points";
import { formatMinutes } from "@/lib/learn/types";
import ProgressRing from "@/components/learn/ProgressRing";

export const dynamic = "force-dynamic";

export default async function LearnDashboard() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const [tracks, total, streak, certificates] = await Promise.all([
    getAllTrackProgress(student.id),
    getTotalPoints(student.id),
    computeStreak(student.id),
    prisma.learnCertificate
      .findMany({
        where: { studentId: student.id, revoked: false },
        orderBy: { issuedAt: "desc" },
        select: { id: true, certificateName: true, verificationId: true, distinction: true, issuedAt: true },
      })
      .catch(() => []),
  ]);

  const level = levelFor(total);
  const started = tracks.filter((t) => t.progress.completedLessons > 0);
  const continueWith = started.sort((a, b) => b.progress.percent - a.progress.percent)[0] ?? tracks[0];

  return (
    <div className="space-y-8">
      {/* Greeting + stats */}
      <section>
        <h1 className="text-2xl font-black text-[var(--ink)]">
          {started.length > 0 ? "Welcome back" : "Welcome"}, {student.name.split(" ")[0]}
        </h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">Points</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{total.toLocaleString()}</p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              <strong>{level.name}</strong>
              {level.next != null && ` · ${level.pointsToNext} to next level`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738]"
                style={{ width: `${Math.round(level.progress * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">Streak</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">
              {streak} day{streak === 1 ? "" : "s"}
            </p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              {streak === 0
                ? "Finish a lesson today to start one."
                : streak < 7
                ? `${7 - streak} more for a +25 bonus.`
                : "Bonus earned — keep it going."}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
              Certificates
            </p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{certificates.length}</p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              {certificates.length === 0 ? "Earn your first one." : "Verifiable and permanent."}
            </p>
          </div>
        </div>
      </section>

      {/* Continue learning */}
      {continueWith && continueWith.progress.nextLessonId && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--ink)] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">
            {continueWith.progress.completedLessons > 0 ? "Continue learning" : "Start here"}
          </p>
          <h2 className="mt-2 text-xl font-bold">{continueWith.track.title}</h2>
          <p className="mt-1 text-sm text-white/60">
            {continueWith.progress.completedLessons} of {continueWith.progress.totalLessons} lessons
            done · {formatMinutes(continueWith.progress.minutesRemaining)} remaining
          </p>
          <Link
            href={`/learn/lesson/${continueWith.progress.nextLessonId}`}
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-6 py-3 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
          >
            {continueWith.progress.completedLessons > 0 ? "Resume →" : "Begin →"}
          </Link>
        </section>
      )}

      {/* Track progress */}
      <section>
        <h2 className="text-lg font-bold text-[var(--ink)]">Your tracks</h2>
        {tracks.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--ink3)]">
            No tracks are published yet. They'll appear here as soon as they open.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map(({ track, progress }) => (
              <Link
                key={track.id}
                href={`/learn/track/${track.slug}`}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <ProgressRing percent={progress.percent} color={track.accentColor} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[var(--ink)]">
                    {track.title}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--ink3)]">
                    {progress.completedLessons}/{progress.totalLessons} lessons
                  </span>
                  {progress.minutesRemaining > 0 && (
                    <span className="mt-0.5 block text-xs text-[var(--ink3)]">
                      {formatMinutes(progress.minutesRemaining)} left
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Certificate shelf */}
      {certificates.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[var(--ink)]">Your certificates</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {certificates.map((c) => (
              <Link
                key={c.id}
                href={`/certificates/${c.verificationId}`}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-bold text-[var(--ink)]">{c.certificateName}</p>
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  Issued {c.issuedAt.toLocaleDateString()}
                  {c.distinction && (
                    <span className="ml-2 rounded bg-[var(--orange-light)] px-1.5 py-0.5 font-bold text-[var(--orange2)]">
                      With Distinction
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
