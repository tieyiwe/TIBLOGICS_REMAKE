import { redirect } from "next/navigation";
import LearnNav from "@/components/learn/LearnNav";
import GraceBanner from "@/components/learn/GraceBanner";
import { getLearnContext } from "@/lib/learn/session";
import { getTotalPoints, levelFor } from "@/lib/learn/points";

// Server-side entitlement gate. The proxy only blocks signed-out visitors;
// this is where a lapsed subscription is actually caught.
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const { student, entitlement } = await getLearnContext();
  if (!student) redirect("/learn/login");
  if (!entitlement.entitled) redirect("/learn/subscribe");

  const total = await getTotalPoints(student.id);

  return (
    <div className="min-h-screen bg-[var(--s2)]">
      <LearnNav studentName={student.name} points={total} level={levelFor(total)} />
      {entitlement.inGrace && <GraceBanner graceUntil={entitlement.graceUntil} />}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
