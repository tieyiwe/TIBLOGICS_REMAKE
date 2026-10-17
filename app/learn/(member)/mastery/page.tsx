import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accessibleTrackIds, getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import MasteryGrid from "@/components/learn/mastery/MasteryGrid";
import MasteryDashboard from "@/components/learn/mastery/MasteryDashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("mastery.grid.title") };
}

// "My mastery": every started track, module by module.
export default async function MasteryPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [t, open] = await Promise.all([getT(), accessibleTrackIds(student.id)]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--ink)]">{t("mastery.grid.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">{t("mastery.grid.intro")}</p>
      </div>
      <MasteryDashboard studentId={student.id} />
      <MasteryGrid studentId={student.id} trackIds={open} />
    </div>
  );
}
