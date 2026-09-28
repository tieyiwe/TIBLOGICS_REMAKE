import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudent } from "@/lib/learn/session";
import { getAllTrackProgress } from "@/lib/learn/progress";
import { formatMinutes } from "@/lib/learn/types";
import ProgressRing from "@/components/learn/ProgressRing";
import CertificationLadder from "@/components/learn/CertificationLadder";
import { LEVEL_SLUGS } from "@/lib/learn/levels";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MyTracksPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const [tracks, certs] = await Promise.all([
    getAllTrackProgress(student.id),
    prisma.learnCertificate.findMany({
      where: { studentId: student.id, revoked: false },
      select: { track: { select: { slug: true } } },
    }),
  ]);
  const certified = new Set(certs.map((c) => c.track.slug));
  const progress = Object.fromEntries(
    tracks.map(({ track, progress: pr }) => [
      track.slug,
      { percent: pr.percent, started: pr.completedLessons > 0, certified: certified.has(track.slug) },
    ]),
  );
  // The three levels are shown as a path; anything else is listed below it.
  const others = tracks.filter(({ track }) => !LEVEL_SLUGS.has(track.slug));

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--ink)]">My tracks</h1>
      <p className="mt-1 text-sm text-[var(--ink3)]">
        Every level is included in your subscription. Start wherever fits you best.
      </p>

      <div className="mt-6">
        <CertificationLadder
          mode="learner"
          progress={progress}
          tracks={tracks.map(({ track }) => ({
            slug: track.slug,
            title: track.title,
            accentColor: track.accentColor,
            certificateName: track.certificateName,
            estimatedHours: track.estimatedHours,
          }))}
        />
      </div>

      {others.length > 0 && <h2 className="mt-10 text-lg font-bold text-[var(--ink)]">More tracks</h2>}

      {others.length > 0 && (
        <div className="mt-4 space-y-4">
          {others.map(({ track, progress }) => (
            <Link
              key={track.id}
              href={`/learn/track/${track.slug}`}
              className="flex flex-wrap items-center gap-5 rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md"
            >
              <ProgressRing percent={progress.percent} color={track.accentColor} size={64} />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-[var(--ink)]">{track.title}</h2>
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  {progress.completedLessons}/{progress.totalLessons} lessons
                  {progress.minutesRemaining > 0 &&
                    ` · ${formatMinutes(progress.minutesRemaining)} remaining`}
                </p>
                <p className="mt-1 text-xs text-[var(--ink3)]">{track.certificateName}</p>
              </div>
              <span className="text-sm font-bold" style={{ color: track.accentColor }}>
                {progress.completedLessons === 0 ? "Start →" : "Continue →"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
