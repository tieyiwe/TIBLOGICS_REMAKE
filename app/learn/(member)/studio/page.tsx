import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { readyTools } from "@/lib/learn/studio/catalog";
import { studioProgress } from "@/lib/learn/studio/progress";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("studio.title") };
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const { track } = await searchParams;
  const [t, progress, tracks] = await Promise.all([
    getT(),
    studioProgress(student.id),
    prisma.learnTrack.findMany({ where: { status: "live" }, orderBy: { sortOrder: "asc" }, select: { slug: true, title: true } }).catch(() => []),
  ]);
  const all = readyTools();
  const tools = track ? all.filter((x) => x.tracks.includes(track)) : all;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-black text-[var(--ink)]">🧪 {t("studio.title")}</h1>
      <p className="mt-2 max-w-2xl text-[var(--ink2)]">{t("studio.subtitle")}</p>

      <nav aria-label={t("studio.forTrack")} className="mt-6 flex flex-wrap gap-2">
        <Link href="/learn/studio" className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!track ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--border)] bg-white text-[var(--ink2)]"}`}>
          {t("studio.allTools")}
        </Link>
        {tracks.filter((tr) => all.some((x) => x.tracks.includes(tr.slug))).map((tr) => (
          <Link key={tr.slug} href={`/learn/studio?track=${tr.slug}`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${track === tr.slug ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--border)] bg-white text-[var(--ink2)]"}`}>
            {tr.title}
          </Link>
        ))}
      </nav>

      {tools.length === 0 ? (
        <p className="mt-10 text-[var(--ink3)]">{t("studio.empty")}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const p = progress[tool.id] ?? {};
            const done = tool.challenges.filter((c) => p[c.id]?.done).length;
            const perfect = tool.challenges.filter((c) => p[c.id]?.perfect).length;
            const pct = tool.challenges.length ? Math.round((done / tool.challenges.length) * 100) : 0;
            return (
              <li key={tool.id}>
                <Link href={`/learn/studio/${tool.id}`} className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow hover:shadow-md">
                  <span className="text-3xl" aria-hidden="true">{tool.icon}</span>
                  <span className="mt-3 text-lg font-bold text-[var(--ink)]">{t(`studio.${tool.id}.name`)}</span>
                  <span className="mt-1 flex-1 text-sm text-[var(--ink2)]">{t(`studio.${tool.id}.desc`)}</span>
                  <span className="mt-4 text-xs font-semibold text-[var(--ink3)]">
                    {t("studio.challengeCount", { done, total: tool.challenges.length })}
                    {perfect > 0 ? ` · ⭐ ${t("studio.perfectCount", { n: perfect })}` : ""}
                  </span>
                  <span className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--s2)]" aria-hidden="true">
                    <span className="block h-full rounded-full bg-[#F47C20]" style={{ width: `${pct}%` }} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
