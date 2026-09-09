import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudent } from "@/lib/learn/session";
import { getAllTrackProgress } from "@/lib/learn/progress";
import { formatMinutes } from "@/lib/learn/types";
import ProgressRing from "@/components/learn/ProgressRing";

export const dynamic = "force-dynamic";

export default async function MyTracksPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const tracks = await getAllTrackProgress(student.id);

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--ink)]">My tracks</h1>
      <p className="mt-1 text-sm text-[var(--ink3)]">
        Every track is included in your subscription. Start as many as you like.
      </p>

      {tracks.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--ink3)]">
          No tracks are published yet.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {tracks.map(({ track, progress }) => (
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
