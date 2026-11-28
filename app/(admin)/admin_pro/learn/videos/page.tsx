import Link from "next/link";
import { Check, Clapperboard, Minus } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, tableStyles } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { LEARN_TABS } from "../tabs";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { videoTablesReady } from "@/lib/learn/video/db";
import { CAPTION_LANGS, normaliseChapters, parseVideoUrl } from "@/lib/learn/video/shared";
import { readCaptions } from "@/lib/learn/video/store";
import { isGeneratedUrl, readVariants } from "@/lib/learn/video/variants";
import { contentHash } from "@/lib/learn/video/select";
import AutoVideoPanel from "@/components/learn/video/admin/AutoVideoPanel";
import ClientMessages from "@/components/i18n/ClientMessages";
import AutoVideoRow, { type RowJob } from "@/components/learn/video/admin/AutoVideoRow";

export const dynamic = "force-dynamic";

// Which lessons have a video and which are missing one, per track, with
// chapters, captions and script status: the owner's to-record list. On top,
// the narrated-video pipeline (AI voice + slides, English and French): plan,
// generate, preview, override per lesson.

const KIND = { youtube: "YouTube", vimeo: "Vimeo", file: "File", hls: "HLS" } as const;

export default async function LessonVideosPage({ searchParams }: { searchParams: Promise<{ track?: string; missing?: string; made?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  // Which lessons the table lists: all, those missing a video, or those with a finished AI video (to watch them).
  const view: "all" | "missing" | "made" = sp.made === "1" ? "made" : sp.missing === "1" ? "missing" : "all";
  const onlyMissing = view === "missing";

  const tracks = await prisma.learnTrack
    .findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        modules: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            sortOrder: true,
            lessons: {
              orderBy: { sortOrder: "asc" },
              select: { id: true, title: true, sortOrder: true, videoUrl: true, durationMinutes: true, objective: true, bodyMd: true },
            },
          },
        },
      },
    })
    .catch(() => []);

  const ready = await videoTablesReady();
  const [metas, scripts, plans, jobs] = ready
    ? await Promise.all([
        prisma.lessonVideoMeta.findMany({ select: { lessonId: true, chapters: true, captions: true, variants: true } }).catch(() => []),
        prisma.videoScript.groupBy({ by: ["lessonId"], _max: { version: true } }).catch(() => []),
        prisma.lessonVideoPlan.findMany({ select: { lessonId: true, decision: true, reason: true, override: true } }).catch(() => []),
        prisma.lessonVideoJob.findMany({ select: { lessonId: true, locale: true, status: true, error: true, durationSec: true, contentHash: true } }).catch(() => []),
      ])
    : [[], [], [], []];
  const planBy = new Map(plans.map((p) => [p.lessonId, p]));
  const jobsBy = new Map<string, typeof jobs>();
  for (const j of jobs) jobsBy.set(j.lessonId, [...(jobsBy.get(j.lessonId) ?? []), j]);
  const meta = new Map(metas.map((m) => [m.lessonId, { chapters: normaliseChapters(m.chapters).length, langs: Object.keys(readCaptions(m.captions)) }]));
  const scriptVersions = new Map(scripts.map((s) => [s.lessonId, s._max.version ?? 0]));

  // Lessons with an AI video learners can watch: what is published on the
  // lesson (its English or French version), plus any job that just finished.
  const madeIds = new Set([
    ...metas.filter((m) => { const v = readVariants(m.variants); return !!(v.en || v.fr); }).map((m) => m.lessonId),
    ...jobs.filter((j) => j.status === "done").map((j) => j.lessonId),
  ]);
  const shows = (l: { id: string; videoUrl: string | null }) => (view === "missing" ? !l.videoUrl : view === "made" ? madeIds.has(l.id) : true);
  const selected = (sp.track ? tracks.filter((t) => t.id === sp.track) : tracks).filter((t) => t.modules.some((m) => m.lessons.some(shows)));
  const all = tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons));
  const withVideo = all.filter((l) => l.videoUrl).length;

  const qs = (p: { track?: string; missing?: boolean; made?: boolean }) => {
    const q = new URLSearchParams();
    if (p.track) q.set("track", p.track);
    if (p.missing) q.set("missing", "1");
    if (p.made) q.set("made", "1");
    const s = q.toString();
    return `/admin_pro/learn/videos${s ? `?${s}` : ""}`;
  };

  // The preview player's texts (namespace "video") travel with the member area.
  return (
    <ClientMessages area="member">
    <div className="space-y-5">
      <PageHeader
        title="Lesson videos"
        subtitle={`${withVideo} of ${all.length} lessons have a video. Open a lesson to add one, draft its script, or add captions.`}
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Videos" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/videos"
        className="mb-0"
      />
      {tracks.length > 0 && ready ? <AutoVideoPanel /> : null}
      {tracks.length === 0 ? (
        <Card>
          <EmptyState icon={Clapperboard} title="No tracks yet" body="Seed ARFA content from the Learn admin overview, then lessons show up here." />
        </Card>
      ) : null}

      {/* Per-track summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t) => {
          const ls = t.modules.flatMap((m) => m.lessons);
          const n = ls.filter((l) => l.videoUrl).length;
          const pct = ls.length ? Math.round((n / ls.length) * 100) : 0;
          const active = sp.track === t.id;
          return (
            <Link
              key={t.id}
              href={qs({ track: active ? undefined : t.id, missing: onlyMissing, made: view === "made" })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-[var(--a-radius-card)] border bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)] transition-colors duration-150",
                active ? "border-[var(--a-blue)] ring-2 ring-[var(--a-blue)]/15" : "border-[var(--a-border)] hover:border-[var(--a-border-strong)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{t.title}</p>
                <span className="shrink-0 whitespace-nowrap font-dm text-[13px] font-bold tabular-nums text-[var(--a-ink)]">{pct}%</span>
              </div>
              <p className="mt-0.5 font-dm text-[12.5px] text-[var(--a-ink-3)]">
                {n} of {ls.length} with video · {ls.length - n} missing
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--a-surface-2)]" role="img" aria-label={`${pct}% of lessons have a video`}>
                <div className="h-full rounded-full bg-[var(--a-success)]" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      <div id="lessons" className="flex scroll-mt-20 flex-wrap items-center gap-2 font-dm">
        <div className="inline-flex rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-0.5" role="group" aria-label="Filter lessons">
          {[
            { on: view === "all", href: qs({ track: sp.track }), label: "All lessons" },
            { on: view === "missing", href: qs({ track: sp.track, missing: true }), label: "Missing a video" },
            { on: view === "made", href: qs({ track: sp.track, made: true }), label: `AI videos made (${madeIds.size})` },
          ].map((o) => (
            <Link
              key={o.label}
              href={o.href}
              aria-current={o.on ? "true" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-[8px] px-3 text-[13px] font-semibold transition-colors duration-150",
                o.on
                  ? "bg-[var(--a-surface)] text-[var(--a-ink)] shadow-[0_1px_2px_rgba(13,27,42,.08)] ring-1 ring-[var(--a-border)]"
                  : "text-[var(--a-ink-3)] hover:text-[var(--a-ink)]",
              )}
            >
              {o.label}
            </Link>
          ))}
        </div>
        {sp.track && (
          <Link href={qs({ missing: onlyMissing, made: view === "made" })} className="text-[13px] font-semibold text-[var(--a-blue)] hover:underline">
            Show every track
          </Link>
        )}
      </div>

      {view === "made" && selected.length === 0 ? (
        <Card>
          <EmptyState icon={Clapperboard} title="No AI videos made yet" body="When a video is ready it appears here with a Preview button. Use Make next video now above, or Generate on a lesson." />
        </Card>
      ) : null}

      {selected.map((t) => (
        <Card key={t.id} title={t.title} padded={false}>
          <div className="relative overflow-x-auto">
            <table className={cn(tableStyles.table, "min-w-[980px]")}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>Lesson</th>
                  <th className={tableStyles.th}>Video</th>
                  <th className={cn(tableStyles.th, "text-right")}>Chapters</th>
                  <th className={tableStyles.th}>Captions</th>
                  <th className={tableStyles.th}>Script</th>
                  <th className={tableStyles.th}>Narrated video (AI)</th>
                  <th className={tableStyles.th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {t.modules.map((m) => {
                  const rows = m.lessons.filter(shows);
                  if (!rows.length) return null;
                  return [
                    <tr key={m.id}>
                      <td colSpan={7} className="a-micro border-b border-[var(--a-border)] bg-[#fafbfd] px-4 pb-1.5 pt-3">
                        {m.sortOrder + 1}. {m.title}
                      </td>
                    </tr>,
                    ...rows.map((l) => {
                      const info = meta.get(l.id);
                      const kind = l.videoUrl ? parseVideoUrl(l.videoUrl)?.kind : null;
                      const v = scriptVersions.get(l.id) ?? 0;
                      return (
                        <tr key={l.id} className={tableStyles.tr} data-has-video={l.videoUrl ? "1" : "0"}>
                          <td className={cn(tableStyles.td, "font-medium text-[var(--a-ink)]")}>{l.title}</td>
                          <td className={tableStyles.td}>
                            {l.videoUrl ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--a-success)]">
                                <Check size={14} aria-hidden /> {isGeneratedUrl(l.videoUrl) ? "AI narrated" : kind ? KIND[kind] : "Link"}
                              </span>
                            ) : (
                              <Badge tone="warn">Missing</Badge>
                            )}
                          </td>
                          <td className={cn(tableStyles.td, "text-right tabular-nums")}>{info?.chapters || <Minus size={14} className="ml-auto text-[var(--a-border-strong)]" aria-label="None" />}</td>
                          <td className={tableStyles.td}>
                            <span className="inline-flex gap-1">
                              {CAPTION_LANGS.map((lg) => (
                                <span
                                  key={lg}
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[11px] font-bold uppercase",
                                    info?.langs.includes(lg) ? "bg-[var(--a-success-bg)] text-[var(--a-success)]" : "bg-[var(--a-surface-2)] text-[var(--a-ink-3)] line-through decoration-1",
                                  )}
                                >
                                  {lg}
                                </span>
                              ))}
                            </span>
                          </td>
                          <td className={cn(tableStyles.td, "text-[12.5px]")}>{v ? `v${v}` : <span className="text-[var(--a-ink-3)]">None</span>}</td>
                          <td className={tableStyles.td}>
                            {(() => {
                              const p = planBy.get(l.id);
                              const js = jobsBy.get(l.id) ?? [];
                              const job = (loc: string): RowJob | undefined => {
                                const j = js.find((x) => x.locale === loc);
                                return j ? { status: j.status, error: j.error, durationSec: j.durationSec } : undefined;
                              };
                              const hash = contentHash(l);
                              return (
                                <AutoVideoRow
                                  lessonId={l.id}
                                  lessonTitle={l.title}
                                  planned={!!p}
                                  decision={p?.decision ?? false}
                                  reason={p?.reason ?? ""}
                                  override={p?.override === "include" || p?.override === "exclude" ? p.override : null}
                                  ownVideo={!!l.videoUrl && !isGeneratedUrl(l.videoUrl)}
                                  generated={isGeneratedUrl(l.videoUrl) || madeIds.has(l.id)}
                                  stale={js.some((j) => j.status === "done" && j.contentHash !== hash)}
                                  jobs={{ en: job("en"), fr: job("fr") }}
                                />
                              );
                            })()}
                          </td>
                          <td className={cn(tableStyles.td, "text-right")}>
                            <Link href={`/admin_pro/learn/lessons/${l.id}#video`} className="whitespace-nowrap text-[13px] font-semibold text-[var(--a-blue)] hover:underline">
                              {l.videoUrl ? "Edit video" : "Add video"}
                            </Link>
                          </td>
                        </tr>
                      );
                    }),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
    </ClientMessages>
  );
}
