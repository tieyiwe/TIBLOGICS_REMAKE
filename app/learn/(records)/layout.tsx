import { redirect } from "next/navigation";
import LearnNav from "@/components/learn/LearnNav";
import SkipLink from "@/components/a11y/SkipLink";
import { getStudent } from "@/lib/learn/session";
import { getTotalPoints, levelFor } from "@/lib/learn/points";

// The learner's records (their certificates): signed in, but no open track
// needed. A certificate is earned for good, so a learner whose plan has
// ended still views, downloads and shares it. The lessons stay behind the
// access gate in app/learn/(member)/layout.tsx; each page here checks the
// certificate belongs to the learner.
export default async function RecordsLayout({ children }: { children: React.ReactNode }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
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
