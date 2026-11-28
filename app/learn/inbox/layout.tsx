import { redirect } from "next/navigation";
import LearnNav from "@/components/learn/LearnNav";
import SkipLink from "@/components/a11y/SkipLink";
import { getStudent } from "@/lib/learn/session";
import { getTotalPoints, levelFor } from "@/lib/learn/points";

// The Inbox sits outside the (member) group on purpose: every signed-in
// learner can read messages from the ARFA team, including one without an
// open track (the member layout would send them to the plan step).
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login?next=/learn/inbox");
  if (student.mustChangePassword) redirect("/learn/change-password");
  const total = await getTotalPoints(student.id);
  return (
    <div className="min-h-screen bg-[var(--s2)]" data-a11y={student.accessibilityMode ? "true" : undefined}>
      <SkipLink />
      <LearnNav studentName={student.name} points={total} level={levelFor(total)} savedLocale={student.locale} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
