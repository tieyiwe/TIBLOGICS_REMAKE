import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getAccess } from "@/lib/learn/session";
import { liveTablesReady } from "@/lib/learn/live/db";
import { canAttend, listSessions, myRsvps } from "@/lib/learn/live/sessions";
import { livePhase } from "@/lib/learn/live/shared";
import SessionTime from "@/components/learn/community/SessionTime";

// Dashboard: the next live expert session (or the one live now), with the
// learner's RSVP state. Renders nothing when there is none or on failure.
export default async function DashboardLiveCard({ studentId }: { studentId: string }) {
  try {
    if (!(await liveTablesReady())) return null;
    if (!canAttend(await getAccess(studentId))) return null;
    const now = Date.now();
    const next = (await listSessions()).find((s) => {
      const p = livePhase(s, now);
      return p === "upcoming" || p === "live";
    });
    if (!next) return null;
    const [t, mine] = await Promise.all([getT(), myRsvps(studentId, [next.id]).then((m) => m.get(next.id))]);
    const live = livePhase(next, now) === "live";

    return (
      <section aria-labelledby="dash-live" className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center">
        {next.expertPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={next.expertPhotoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--s2)] text-2xl">
            🎙️
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p id="dash-live" className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
            {live ? <span className="text-red-700">● {t("live.phase.live")}</span> : t("live.dash.next")}
          </p>
          <p className="mt-1 text-lg font-black text-[var(--ink)] [overflow-wrap:anywhere]">{next.title}</p>
          <p className="text-sm text-[var(--ink2)]">{t("live.with", { expert: next.expertName })}</p>
          <p className="mt-1 text-xs text-[var(--ink2)]">
            <SessionTime iso={next.startsAt.toISOString()} timezone={next.timezone} withLocal={false} />
          </p>
          {mine && (
            <p className="mt-1 text-xs font-semibold text-green-800">
              {mine.status === "going" ? `✓ ${t("live.rsvp.going")}` : t("live.rsvp.waitlistShort", { n: mine.position })}
            </p>
          )}
        </div>
        <Link
          href={`/learn/live/${next.id}`}
          className="inline-flex min-h-[44px] w-fit shrink-0 items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
        >
          {mine ? t("live.dash.open") : t("live.dash.rsvp")} →
        </Link>
      </section>
    );
  } catch (err) {
    console.error("[learn/live] dashboard card", err);
    return null;
  }
}
