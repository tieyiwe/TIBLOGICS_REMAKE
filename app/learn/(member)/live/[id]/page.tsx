import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAccess, getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { liveTablesReady } from "@/lib/learn/live/db";
import { canAttend, getSession, listQuestions, myQuestionCount, myRsvps } from "@/lib/learn/live/sessions";
import { livePhase, questionsOpen, rsvpOpen, safeUrl } from "@/lib/learn/live/shared";
import { parseVideoUrl } from "@/lib/learn/video/shared";
import { trackTexts } from "@/lib/learn/community/text";
import SessionTime from "@/components/learn/community/SessionTime";
import PhaseBadge from "@/components/learn/live/PhaseBadge";
import RsvpPanel from "@/components/learn/live/RsvpPanel";
import Questions from "@/components/learn/live/Questions";
import VideoPlayer from "@/components/learn/video/VideoPlayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = (await liveTablesReady()) ? await getSession(id).catch(() => null) : null;
  return { title: s?.title ?? (await getT())("live.title") };
}

// One live expert session: the expert, the time (session zone and the
// reader's own), RSVP with a waitlist, add to calendar, the join button in
// the window, questions with upvotes, resources and, once it is over, the
// recording in the lesson video player.
export default async function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const access = await getAccess(student.id);
  if (!canAttend(access)) redirect("/learn/subscribe");
  if (!(await liveTablesReady())) notFound();
  const s = await getSession(id);
  if (!s) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const [mine, questions, myCount, texts] = await Promise.all([
    myRsvps(student.id, [s.id]).then((m) => m.get(s.id) ?? null),
    listQuestions(s.id, student.id),
    myQuestionCount(s.id, student.id),
    trackTexts(s.trackIds, locale),
  ]);
  const now = Date.now();
  const phase = livePhase(s, now);
  const labels = s.trackIds.map((x) => texts.get(x)).filter(Boolean) as Array<{ title: string; slug: string }>;
  const full = s.going >= s.capacity;
  const recording = phase === "past" && s.recordingUrl ? s.recordingUrl : null;
  const playable = recording ? parseVideoUrl(recording) : null;

  return (
    <div className="space-y-6">
      <nav aria-label={t("community.breadcrumb")} className="text-sm text-[var(--ink3)]">
        <Link href="/learn/live" className="hover:text-[var(--ink)]">
          {t("live.title")}
        </Link>
      </nav>

      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PhaseBadge phase={phase} t={t} />
          {s.topic && <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{s.topic}</span>}
        </div>
        <h1 className="mt-2 text-2xl font-black text-[var(--ink)] [overflow-wrap:anywhere]">{s.title}</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">{t("live.with", { expert: s.expertName })}</p>
        <div className="mt-3 text-sm text-[var(--ink)]">
          <SessionTime iso={s.startsAt.toISOString()} timezone={s.timezone} />
        </div>
        <p className="mt-1 text-xs text-[var(--ink3)]">
          {t("community.cohort.minutes", { n: s.durationMinutes })}
          {" · "}
          {labels.length === 0
            ? t("live.allTracks")
            : labels.map((l, i) => (
                <span key={l.slug}>
                  {i > 0 && ", "}
                  <Link href={`/learn/track/${l.slug}`} className="underline">
                    {l.title}
                  </Link>
                </span>
              ))}
          {phase !== "past" && phase !== "cancelled" && (
            <>
              {" · "}
              {full ? t("live.fullWaitlist", { n: s.waitlist }) : t("live.seatsLeft", { n: s.capacity - s.going })}
            </>
          )}
        </p>
        {phase === "cancelled" ? (
          <p role="status" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
            {t("live.cancelledNotice")}
          </p>
        ) : (
          <div className="mt-4">
            <RsvpPanel
              sessionId={s.id}
              startsAt={s.startsAt.toISOString()}
              durationMinutes={s.durationMinutes}
              status={s.status}
              mine={mine ? { status: mine.status, position: mine.position, joined: !!mine.joinedAt } : null}
              full={full}
            />
          </div>
        )}
      </header>

      {recording && (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5" aria-labelledby="live-recording">
          <h2 id="live-recording" className="mb-3 text-sm font-bold text-[var(--ink)]">
            ▶ {t("live.recording")}
          </h2>
          {playable ? (
            <VideoPlayer url={recording} title={s.title} />
          ) : safeUrl(recording) ? (
            <a href={recording} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--blue2)] underline">
              {t("live.watchRecording")} ↗
            </a>
          ) : null}
        </section>
      )}
      {phase === "past" && !recording && <p className="text-sm text-[var(--ink3)]">{t("live.recordingSoon")}</p>}

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5" aria-labelledby="live-expert">
          <h2 id="live-expert" className="text-sm font-bold text-[var(--ink)]">
            {t("live.aboutExpert")}
          </h2>
          <div className="mt-3 flex items-start gap-3">
            {s.expertPhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.expertPhotoUrl} alt={s.expertName} className="h-16 w-16 shrink-0 rounded-full object-cover" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-[var(--ink)]">{s.expertName}</p>
              {s.expertBio && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink2)] [overflow-wrap:anywhere]">{s.expertBio}</p>}
            </div>
          </div>
          {s.resources.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-bold text-[var(--ink)]">{t("live.resources")}</h3>
              <ul className="mt-2 space-y-1.5">
                {s.resources.map((r, i) =>
                  safeUrl(r.url) ? (
                    <li key={i} className="text-sm">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--blue2)] underline [overflow-wrap:anywhere]">
                        {r.title}
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            </>
          )}
        </section>

        <Questions sessionId={s.id} initial={questions} canAsk={questionsOpen(s, now)} canVote={rsvpOpen(s, now)} myCount={myCount} />
      </div>
    </div>
  );
}
