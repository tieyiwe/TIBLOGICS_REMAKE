import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { liveTablesReady } from "@/lib/learn/live/db";
import { listSessions } from "@/lib/learn/live/sessions";
import { sessionOver } from "@/lib/learn/live/shared";
import SessionForm from "./SessionForm";

export const dynamic = "force-dynamic";

const when = (d: Date, tz: string) => {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, dateStyle: "medium", timeStyle: "short" }).format(d) + ` ${tz}`;
  } catch {
    return d.toISOString();
  }
};

export default async function LiveSessionsAdminPage() {
  await requireAdminPage();
  const ready = await liveTablesReady();
  const tracks = await prisma.learnTrack.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true } }).catch(() => []);
  const sessions = ready ? await listSessions() : [];
  const title = new Map(tracks.map((t) => [t.id, t.title]));
  const now = Date.now();
  const upcoming = sessions.filter((s) => !sessionOver(s, now));
  const past = sessions.filter((s) => sessionOver(s, now)).reverse();

  const table = (rows: typeof sessions) => (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--ink3)]">
            <th className="py-2 pr-3">Session</th>
            <th className="py-2 pr-3">Expert</th>
            <th className="py-2 pr-3">Starts</th>
            <th className="py-2 pr-3">Tracks</th>
            <th className="py-2 pr-3">Seats</th>
            <th className="py-2 pr-3">Waitlist</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="py-2 pr-3 font-semibold">
                <Link href={`/admin_pro/learn/live/${s.id}`} className="text-[var(--blue2)] underline">
                  {s.title}
                </Link>
              </td>
              <td className="py-2 pr-3">{s.expertName}</td>
              <td className="whitespace-nowrap py-2 pr-3">{when(s.startsAt, s.timezone)}</td>
              <td className="py-2 pr-3 text-xs">{s.trackIds.length === 0 ? "All" : s.trackIds.map((id) => title.get(id) ?? id).join(", ")}</td>
              <td className="py-2 pr-3">
                {s.going} / {s.capacity}
              </td>
              <td className="py-2 pr-3">{s.waitlist}</td>
              <td className="py-2">
                {s.status}
                {s.recordingUrl ? " · recording" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-[var(--ink3)]">
          <Link href="/admin_pro/learn" className="underline">
            Learn
          </Link>{" "}
          / Live sessions
        </p>
        <h1 className="text-xl font-black text-[var(--ink)]">Live expert sessions</h1>
        <p className="text-sm text-[var(--ink3)]">
          Monthly sessions with a guest expert. Learners with a subscription, a team seat or any track purchase RSVP at{" "}
          <Link href="/learn/live" className="underline">
            /learn/live
          </Link>
          . Reminders go out 24h and 1h before (cron job <code>live</code>).
        </p>
      </header>

      {!ready && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">The live session tables could not be created. Check the database connection.</p>}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Upcoming</h2>
        {upcoming.length === 0 ? <p className="mt-3 text-sm text-[var(--ink3)]">Nothing scheduled.</p> : table(upcoming)}
      </section>

      {past.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">Past and cancelled</h2>
          {table(past)}
        </section>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-[var(--ink)]">New session</h2>
        <SessionForm tracks={tracks} />
      </section>
    </div>
  );
}
