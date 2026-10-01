import prisma from "@/lib/prisma";
import { hasTrackAccess } from "@/lib/learn/session";
import { communityTablesReady } from "@/lib/learn/community/db";
import { myCohorts } from "@/lib/learn/community/cohorts";
import { getProfile, isSuspended } from "@/lib/learn/community/discussion";
import { LIMITS } from "@/lib/learn/community/shared";
import Discussion from "./Discussion";

// Server wrapper for <Discussion>: works out which cohorts the learner may
// post to, whether they are suspended, and whether their account is too new
// to post links. Renders nothing if the community tables are unavailable, so
// it can never take a lesson page down.
export default async function DiscussionSection({
  studentId,
  trackId,
  lessonId,
  cohortId,
  lessonTitles,
  showContext,
  heading,
  initialOpen,
}: {
  studentId: string;
  trackId: string;
  lessonId?: string;
  cohortId?: string;
  lessonTitles?: Record<string, string>;
  showContext?: boolean;
  heading?: string;
  initialOpen?: string;
}) {
  // Discussion belongs to the track: a free-preview lesson shows none to a
  // learner who cannot open the track.
  if (!(await hasTrackAccess(studentId, trackId))) return null;
  if (!(await communityTablesReady())) return null;
  try {
    const [cohorts, profile, student] = await Promise.all([
      cohortId ? Promise.resolve([]) : myCohorts(studentId, trackId),
      getProfile(studentId),
      prisma.student.findUnique({ where: { id: studentId }, select: { createdAt: true } }),
    ]);
    const newAccount = !!student && Date.now() - student.createdAt.getTime() < LIMITS.newAccountDays * 86_400_000;
    return (
      <Discussion
        scope={cohortId ? { cohortId } : lessonId ? { lessonId } : { trackId }}
        cohortOptions={cohorts.map((c) => ({ id: c.id, name: c.name }))}
        lessonTitles={lessonTitles}
        showContext={showContext}
        heading={heading}
        suspendedUntil={isSuspended(profile) ? profile.suspendedUntil!.toISOString() : null}
        newAccount={newAccount}
        initialOpen={initialOpen}
      />
    );
  } catch (err) {
    console.error("[community] discussion section", err);
    return null;
  }
}
