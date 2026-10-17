import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { communityTablesReady } from "@/lib/learn/community/db";
import { cohortEnded, listCohorts } from "@/lib/learn/community/cohorts";
import { nextSession } from "@/lib/learn/community/shared";
import CohortForm from "./CohortForm";
import { Layers, MessagesSquare } from "lucide-react";
import { Badge, Button, Card, DataTable, EmptyState, Notice, PageHeader } from "@/components/admin/ui";
import { LEARN_TABS } from "../tabs";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CohortsAdminPage() {
  await requireAdminPage();
  const ready = await communityTablesReady();
  const tracks = await prisma.learnTrack.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true } }).catch(() => []);
  const cohorts = ready ? await listCohorts() : [];
  const title = new Map(tracks.map((t) => [t.id, t.title]));
  const day = (d: Date) => d.toISOString().slice(0, 10);

  type Cohort = (typeof cohorts)[number];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohorts"
        subtitle="Groups taking a track together, with a weekly live session. Learners with access to the track join from the track page."
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Cohorts" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/cohorts"
        actions={
          <Button href="/admin_pro/learn/community" variant="secondary" icon={MessagesSquare}>
            Community moderation
          </Button>
        }
        className="mb-0"
      />

      {!ready && <Notice tone="warn" title="Community tables unavailable">The community tables could not be created. Check the database connection.</Notice>}

      <DataTable<Cohort>
        caption="All cohorts"
        rows={cohorts}
        rowKey={(c) => c.id}
        rowHref={(c) => `/admin_pro/learn/cohorts/${c.id}`}
        empty={
          <EmptyState
            icon={Layers}
            title="No cohorts yet"
            body="Start a cohort to give learners a shared start date and a weekly live session."
            action={
              <a href="#new-cohort" className="font-dm text-[13.5px] font-semibold text-[var(--a-blue)] hover:underline">
                Create the first cohort
              </a>
            }
          />
        }
        columns={[
          { key: "name", header: "Cohort", primary: true, render: (c) => <span className="font-semibold text-[var(--a-ink)]">{c.name}</span> },
          { key: "track", header: "Track", render: (c) => title.get(c.trackId) ?? c.trackId },
          { key: "dates", header: "Dates", render: (c) => <span className="whitespace-nowrap tabular-nums">{day(c.startDate)} to {day(c.endDate)}</span> },
          {
            key: "live",
            header: "Live",
            hideOnMobile: true,
            render: (c) => {
              const s = nextSession(c);
              return (
                <span className="whitespace-nowrap">
                  {DAYS[c.sessionWeekday]} {c.sessionTime} {c.timezone}
                  {s && <span className="block text-[12px] text-[var(--a-ink-3)]">next {s.start.toISOString().slice(0, 16).replace("T", " ")} UTC</span>}
                </span>
              );
            },
          },
          {
            key: "members",
            header: "Members",
            align: "right",
            render: (c) => (
              <span className="tabular-nums">
                <span className="font-semibold text-[var(--a-ink)]">{c.memberCount}</span> / {c.capacity}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (c) =>
              cohortEnded(c) ? (
                <Badge>Ended</Badge>
              ) : c.enrolmentOpen ? (
                <Badge tone="success" dot>
                  Open
                </Badge>
              ) : (
                <Badge tone="warn" dot>
                  Closed
                </Badge>
              ),
          },
        ]}
      />

      <Card id="new-cohort" title="New cohort" subtitle="Pick a track, dates and the weekly live slot.">
        <CohortForm tracks={tracks} />
      </Card>
    </div>
  );
}
