import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { STUDIO_BY_ID } from "@/lib/learn/studio/catalog";
import { studioProgress } from "@/lib/learn/studio/progress";
import { getT } from "@/lib/i18n/server";
import StudioHost from "@/components/learn/studio/StudioHost";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const [{ tool }, t] = await Promise.all([params, getT()]);
  return { title: STUDIO_BY_ID.has(tool) ? `${t(`studio.${tool}.name`)} | ${t("studio.title")}` : t("studio.title") };
}

export default async function StudioToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ tool: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [{ tool }, { c }, t] = await Promise.all([params, searchParams, getT()]);
  const meta = STUDIO_BY_ID.get(tool);
  if (!meta || !meta.ready) notFound();
  const progress = await studioProgress(student.id);
  const challenge = c && meta.challenges.some((x) => x.id === c) ? c : null;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/learn/studio" className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">← {t("studio.back")}</Link>
      <h1 className="mt-3 text-2xl font-black text-[var(--ink)]">
        <span aria-hidden="true">{meta.icon}</span> {t(`studio.${tool}.name`)}
      </h1>
      <p className="mt-1 max-w-3xl text-[var(--ink2)]">{t(`studio.${tool}.desc`)}</p>
      <div className="mt-6">
        <StudioHost toolId={tool} challengeId={challenge} initialProgress={progress[tool] ?? {}} />
      </div>
    </div>
  );
}
