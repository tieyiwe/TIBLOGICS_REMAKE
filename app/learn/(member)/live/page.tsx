import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAccess, getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { liveTablesReady } from "@/lib/learn/live/db";
import { canAttend, forMyTracks, listSessions, myRsvps, type SessionRow } from "@/lib/learn/live/sessions";
import { livePhase } from "@/lib/learn/live/shared";
import { trackTexts } from "@/lib/learn/community/text";
import SessionTime from "@/components/learn/community/SessionTime";
import PhaseBadge from "@/components/learn/live/PhaseBadge";
import ExpertAvatar from "@/components/learn/live/ExpertAvatar";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("live.title") };
}

// Live expert sessions: upcoming ones (RSVP on the session page) and past
// ones with their recordings. For every learner with an open track.
export default async function LiveSessionsPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const access = await getAccess(student.id);
  if (!canAttend(access)) redirect("/learn/subscribe");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await liveTablesReady())) {
    return <p className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--ink2)]">{t("live.err.unavailable")}</p>;
  }

  const sessions = await listSessions();
  const now = Date.now();
  const mine = await myRsvps(student.id);
  const texts = await trackTexts([...new Set(sessions.flatMap((s) => s.trackIds))], locale);
  const upcoming = sessions.filter((s) => {
    const p = livePhase(s, now);
    return p === "upcoming" || p === "live" || (p === "cancelled" && s.startsAt.getTime() > now);
  });
  const past = sessions.filter((s) => livePhase(s, now) === "past").reverse();

  const card = (s: SessionRow) => {
    const phase = livePhase(s, now);
    const r = mine.get(s.id);
    const labels = s.trackIds.map((id) => texts.get(id)?.title).filter(Boolean) as string[];
    return (
      <li key={s.id}>
        <Link
          href={`/learn/live/${s.id}`}
          className="flex gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 transition-colors hover:border-[var(--ink3)] sm:p-5"
        >
          <ExpertAvatar url={s.expertPhotoUrl} name={s.expertName} size={60} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PhaseBadge phase={phase} t={t} />
              {r?.status === "going" && <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-800">✓ {t("live.rsvp.going")}</span>}
              {r?.status === "waitlist" && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900">{t("live.rsvp.waitlistShort", { n: r.position })}</span>}
              {phase === "past" && s.recordingUrl && <span className="rounded-full bg-[var(--s2)] px-2.5 py-0.5 text-xs font-bold text-[var(--ink2)]">▶ {t("live.recording")}</span>}
            </div>
            <h3 className="mt-1 text-base font-black text-[var(--ink)] [overflow-wrap:anywhere]">{s.title}</h3>
            <p className="text-sm text-[var(--ink2)]">
              {t("live.with", { expert: s.expertName })}
              {s.topic && <> · {s.topic}</>}
            </p>
            <p className="mt-1 text-xs text-[var(--ink2)]">
              <SessionTime iso={s.startsAt.toISOString()} timezone={s.timezone} withLocal={false} />
            </p>
            <p className="mt-1 text-xs text-[var(--ink3)]">
              {labels.length === 0 ? t("live.allTracks") : labels.join(", ")}
              {forMyTracks(access, s) && s.trackIds.length > 0 && <> · {t("live.forYourTracks")}</>}
              {phase !== "past" && phase !== "cancelled" && (
                <> · {s.going >= s.capacity ? t("live.full") : t("live.seatsLeft", { n: s.capacity - s.going })}</>
              )}
            </p>
          </div>
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("live.kicker")}</p>
        <h1 className="mt-1 text-2xl font-black text-[var(--ink)]">{t("live.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink2)]">{t("live.intro")}</p>
      </header>

      <section aria-labelledby="live-upcoming">
        <h2 id="live-upcoming" className="text-lg font-bold text-[var(--ink)]">
          {t("live.upcoming")}
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm text-[var(--ink3)]">{t("live.noneUpcoming")}</p>
        ) : (
          <ul className="mt-3 space-y-3">{upcoming.map(card)}</ul>
        )}
      </section>

      <section aria-labelledby="live-past">
        <h2 id="live-past" className="text-lg font-bold text-[var(--ink)]">
          {t("live.past")}
        </h2>
        {past.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">{t("live.nonePast")}</p>
        ) : (
          <ul className="mt-3 space-y-3">{past.map(card)}</ul>
        )}
      </section>
    </div>
  );
}
