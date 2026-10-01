import { redirect } from "next/navigation";
import LearnNav from "@/components/learn/LearnNav";
import SkipLink from "@/components/a11y/SkipLink";
import GraceBanner from "@/components/learn/GraceBanner";
import GameCelebrations from "@/components/learn/game/GameCelebrations";
import PwaShell from "@/components/learn/pwa/PwaShell";
import { getLearnContext } from "@/lib/learn/session";
import { getTotalPoints, levelFor } from "@/lib/learn/points";

// Server-side access gate. The proxy only blocks signed-out visitors; this is
// where a learner with no open track (no subscription, nothing bought) is
// sent to the plan step. A learner who bought one track gets in: each page
// and API then checks the track itself (lib/learn/session.ts).
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const { student, entitlement, access } = await getLearnContext();
  if (!student) redirect("/learn/login");
  if (!access.any) redirect("/learn/subscribe");

  const total = await getTotalPoints(student.id);

  return (
    // data-a11y drives the accessibility styles in globals.css: ~25% larger
    // text, higher-contrast tokens, 48px targets, visible focus rings and
    // reduced motion. Scoped here so it never leaks into the marketing site.
    <div
      className="min-h-screen bg-[var(--s2)]"
      data-a11y={student.accessibilityMode ? "true" : undefined}
    >
      <SkipLink />
      <LearnNav
        studentName={student.name}
        points={total}
        level={levelFor(total)}
        savedLocale={student.locale}
      />
      {entitlement.inGrace && <GraceBanner graceUntil={entitlement.graceUntil} />}
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none">{children}</main>
      <GameCelebrations />
      {/* Offline app: service worker, offline indicator, queued completions */}
      <PwaShell studentId={student.id} />
    </div>
  );
}
