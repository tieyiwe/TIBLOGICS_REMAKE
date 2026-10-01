import Link from "next/link";
import { ArrowLeft, Check, Minus } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { videoTablesReady } from "@/lib/learn/video/db";
import { CAPTION_LANGS, normaliseChapters, parseVideoUrl } from "@/lib/learn/video/shared";
import { readCaptions } from "@/lib/learn/video/store";

export const dynamic = "force-dynamic";

// Which lessons have a video and which are missing one, per track, with
// chapters, captions and script status: the owner's to-record list.

const KIND = { youtube: "YouTube", vimeo: "Vimeo", file: "File", hls: "HLS" } as const;

export default async function LessonVideosPage({ searchParams }: { searchParams: Promise<{ track?: string; missing?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const onlyMissing = sp.missing === "1";

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
            lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, sortOrder: true, videoUrl: true, durationMinutes: true } },
          },
        },
      },
    })
    .catch(() => []);

  const ready = await videoTablesReady();
  const [metas, scripts] = ready
    ? await Promise.all([
        prisma.lessonVideoMeta.findMany({ select: { lessonId: true, chapters: true, captions: true } }).catch(() => []),
        prisma.videoScript.groupBy({ by: ["lessonId"], _max: { version: true } }).catch(() => []),
      ])
    : [[], []];
  const meta = new Map(metas.map((m) => [m.lessonId, { chapters: normaliseChapters(m.chapters).length, langs: Object.keys(readCaptions(m.captions)) }]));
  const scriptVersions = new Map(scripts.map((s) => [s.lessonId, s._max.version ?? 0]));

  const selected = sp.track ? tracks.filter((t) => t.id === sp.track) : tracks;
  const all = tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons));
  const withVideo = all.filter((l) => l.videoUrl).length;

  const qs = (p: { track?: string; missing?: boolean }) => {
    const q = new URLSearchParams();
    if (p.track) q.set("track", p.track);
    if (p.missing) q.set("missing", "1");
    const s = q.toString();
    return `/admin_pro/learn/videos${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <Link href="/admin_pro/learn" className="inline-flex items-center gap-1 font-dm text-sm text-[#2251A3]">
          <ArrowLeft size={14} /> Learning Box
        </Link>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A] mt-2">Lesson videos</h1>
        <p className="font-dm text-sm text-[#3A4A5C] mt-1">
          {withVideo} of {all.length} lessons have a video. Open a lesson to add one, draft its script, or add captions.
        </p>
      </div>

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
              href={qs({ track: active ? undefined : t.id, missing: onlyMissing })}
              className={`rounded-xl border bg-white p-4 transition-colors ${active ? "border-[#2251A3] ring-2 ring-[#2251A3]/20" : "border-[#D2DCE8] hover:border-[#7A8FA6]"}`}
            >
              <p className="font-dm text-sm font-bold text-[#0D1B2A]">{t.title}</p>
              <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">
                {n} of {ls.length} with video · {ls.length - n} missing
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8EFF8]" role="img" aria-label={`${pct}% of lessons have a video`}>
                <div className="h-full bg-[#22A387]" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 font-dm text-sm">
        <Link href={qs({ track: sp.track, missing: false })} className={`rounded-full px-3 py-1 font-semibold ${!onlyMissing ? "bg-[#1B3A6B] text-white" : "text-[#2251A3] hover:bg-[#EBF0FA]"}`}>
          All lessons
        </Link>
        <Link href={qs({ track: sp.track, missing: true })} className={`rounded-full px-3 py-1 font-semibold ${onlyMissing ? "bg-[#1B3A6B] text-white" : "text-[#2251A3] hover:bg-[#EBF0FA]"}`}>
          Missing a video
        </Link>
        {sp.track && (
          <Link href={qs({ missing: onlyMissing })} className="text-xs text-[#2251A3] underline">
            Show every track
          </Link>
        )}
      </div>

      {selected.map((t) => (
        <section key={t.id} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <h2 className="font-syne font-bold text-base text-[#0D1B2A]">{t.title}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] font-dm text-sm">
              <thead>
                <tr className="border-b border-[#E6EBF1] text-left text-xs uppercase tracking-wide text-[#7A8FA6]">
                  <th className="py-2 pr-3">Lesson</th>
                  <th className="py-2 pr-3">Video</th>
                  <th className="py-2 pr-3 text-right">Chapters</th>
                  <th className="py-2 pr-3">Captions</th>
                  <th className="py-2 pr-3">Script</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {t.modules.map((m) => {
                  const rows = m.lessons.filter((l) => !onlyMissing || !l.videoUrl);
                  if (!rows.length) return null;
                  return [
                    <tr key={m.id}>
                      <td colSpan={6} className="pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-[#3A4A5C]">
                        {m.sortOrder + 1}. {m.title}
                      </td>
                    </tr>,
                    ...rows.map((l) => {
                      const info = meta.get(l.id);
                      const kind = l.videoUrl ? parseVideoUrl(l.videoUrl)?.kind : null;
                      const v = scriptVersions.get(l.id) ?? 0;
                      return (
                        <tr key={l.id} className="border-b border-[#F0F3F7]" data-has-video={l.videoUrl ? "1" : "0"}>
                          <td className="py-2 pr-3 text-[#0D1B2A]">{l.title}</td>
                          <td className="py-2 pr-3">
                            {l.videoUrl ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <Check size={14} /> {kind ? KIND[kind] : "Link"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">Missing</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-right text-[#3A4A5C]">{info?.chapters || <Minus size={14} className="ml-auto text-[#D2DCE8]" />}</td>
                          <td className="py-2 pr-3">
                            <span className="inline-flex gap-1">
                              {CAPTION_LANGS.map((lg) => (
                                <span
                                  key={lg}
                                  className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase ${info?.langs.includes(lg) ? "bg-green-50 text-green-700" : "bg-[#F4F7FB] text-[#B4C2D3]"}`}
                                >
                                  {lg}
                                </span>
                              ))}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs text-[#3A4A5C]">{v ? `v${v}` : <span className="text-[#B4C2D3]">None</span>}</td>
                          <td className="py-2 text-right">
                            <Link href={`/admin_pro/learn/lessons/${l.id}#video`} className="text-xs font-semibold text-[#2251A3] underline">
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
        </section>
      ))}
    </div>
  );
}
