import Link from "next/link";
import prisma from "@/lib/prisma";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTrack } from "@/lib/i18n/sources/learn";

export interface FocusModule {
  moduleId: string;
  moduleTitle: string;
  trackTitle: string;
  trackSlug: string;
}

/**
 * The module a focused review asks for (?module=<id>), if it exists and its
 * track is open to the learner. Null otherwise (plain Daily Review).
 */
export async function focusModuleFor(
  _studentId: string,
  moduleId: string | undefined,
  open: "all" | string[],
): Promise<FocusModule | null> {
  if (!moduleId || !/^[A-Za-z0-9_-]{1,64}$/.test(moduleId)) return null;
  const m = await prisma.learnModule
    .findUnique({ where: { id: moduleId }, select: { id: true, title: true, track: { select: { id: true, slug: true, title: true } } } })
    .catch(() => null);
  if (!m || (open !== "all" && !open.includes(m.track.id))) return null;
  const [src] = await loadTrackSources({ slug: m.track.slug });
  const text = src ? (await localizedTrack(src, await getLocale())).text : null;
  return {
    moduleId: m.id,
    moduleTitle: text?.modules[m.id]?.title ?? m.title,
    trackTitle: text?.title ?? m.track.title,
    trackSlug: m.track.slug,
  };
}

// Above Daily Review when it is a focused review of one module.
export default async function FocusHeader({ focus }: { focus: FocusModule }) {
  const t = await getT();
  return (
    <div className="mt-4 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm">
      <p className="font-bold text-[var(--ink)]">
        <span aria-hidden="true">🎯 </span>
        {t("mastery.focus.title", { module: focus.moduleTitle })}
      </p>
      <p className="mt-1 text-[var(--ink2)]">{t("mastery.focus.body", { track: focus.trackTitle })}</p>
      <Link href="/learn/review" className="mt-2 inline-block text-xs font-semibold text-[var(--blue2)] underline">
        {t("mastery.focus.all")}
      </Link>
    </div>
  );
}
