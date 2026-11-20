import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { liveTablesReady } from "@/lib/learn/live/db";
import { listSessions } from "@/lib/learn/live/sessions";
import { sessionOver } from "@/lib/learn/live/shared";
import SessionForm from "./SessionForm";
import { CalendarClock, ExternalLink, Radio } from "lucide-react";
import { Badge, Button, Card, DataTable, EmptyState, Notice, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";
import { LEARN_TABS } from "../tabs";

const STATUS_TONE: Record<string, BadgeTone> = { scheduled: "info", live: "success", ended: "neutral", cancelled: "danger", draft: "warn" };

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

  type Session = (typeof sessions)[number];
  const table = (rows: Session[], caption: string, empty?: React.ReactNode) => (
    <DataTable<Session>
      caption={caption}
      rows={rows}
      rowKey={(s) => s.id}
      rowHref={(s) => `/admin_pro/learn/live/${s.id}`}
      empty={empty}
      className="rounded-none border-0 shadow-none"
      columns={[
        { key: "title", header: "Session", primary: true, render: (s) => <span className="font-semibold text-[var(--a-ink)]">{s.title}</span> },
        { key: "expert", header: "Expert", render: (s) => s.expertName },
        { key: "starts", header: "Starts", render: (s) => <span className="whitespace-nowrap tabular-nums">{when(s.startsAt, s.timezone)}</span> },
        {
          key: "tracks",
          header: "Tracks",
          hideOnMobile: true,
          render: (s) => <span className="text-[12.5px]">{s.trackIds.length === 0 ? "All" : s.trackIds.map((id) => title.get(id) ?? id).join(", ")}</span>,
        },
        {
          key: "seats",
          header: "Seats",
          align: "right",
          render: (s) => (
            <span className="tabular-nums">
              <span className="font-semibold text-[var(--a-ink)]">{s.going}</span> / {s.capacity}
            </span>
          ),
        },
        { key: "waitlist", header: "Waitlist", align: "right", render: (s) => <span className="tabular-nums">{s.waitlist}</span> },
        {
          key: "status",
          header: "Status",
          render: (s) => (
            <span className="inline-flex flex-wrap items-center gap-1">
              <Badge tone={STATUS_TONE[s.status] ?? "neutral"} dot className="capitalize">
                {s.status}
              </Badge>
              {s.recordingUrl ? <Badge tone="success">Recording</Badge> : null}
            </span>
          ),
        },
      ]}
    />
  );

  const seats = upcoming.reduce((n, s) => n + s.going, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live expert sessions"
        subtitle={
          <>
            Monthly sessions with a guest expert. Learners with a subscription, a team seat or any track purchase RSVP at{" "}
            <a href="/learn/live" className="font-medium text-[var(--a-blue)] hover:underline">
              /learn/live
            </a>
            . Reminders go out 24h and 1h before (cron job <code>live</code>).
          </>
        }
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Live" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/live"
        actions={
          <>
            <Button href="/learn/live" variant="secondary" icon={ExternalLink} external>
              Learner view
            </Button>
            <Button href="#new-session" variant="primary" icon={Radio}>
              New session
            </Button>
          </>
        }
        className="mb-0"
      />

      {!ready && <Notice tone="warn" title="Live tables unavailable">The live session tables could not be created. Check the database connection.</Notice>}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <StatCard label="Upcoming sessions" value={upcoming.length} icon={CalendarClock} tone="navy" />
        <StatCard label="Seats taken (upcoming)" value={seats} icon={Radio} />
        <StatCard label="Past sessions" value={past.length} icon={CalendarClock} />
      </div>

      <Card title="Upcoming" padded={false}>
        {table(
          upcoming,
          "Upcoming sessions",
          <EmptyState
            icon={Radio}
            title="Nothing scheduled"
            body="Book a guest expert and schedule the next session for ARFA learners."
            action={
              <Button href="#new-session" variant="primary" size="sm" icon={Radio}>
                Schedule a session
              </Button>
            }
            compact
          />,
        )}
      </Card>

      {past.length > 0 && (
        <Card title="Past and cancelled" padded={false}>
          {table(past, "Past and cancelled sessions")}
        </Card>
      )}

      <Card id="new-session" title="New session" subtitle="Learners see it on /learn/live as soon as it is saved.">
        <SessionForm tracks={tracks} />
      </Card>
    </div>
  );
}
