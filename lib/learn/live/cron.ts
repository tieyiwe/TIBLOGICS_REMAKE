import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureLiveTables } from "./db";
import { listSessions } from "./sessions";
import { sessionOver } from "./shared";
import { sendRecordingEmail, sendReminder, type To } from "./emails";

// The "live" scheduled job (node scripts/cron.mjs live, every 15 minutes):
//   1. 24h reminder: to every learner with a seat, once per start time,
//      sent between 24h and 1h before the start.
//   2. 1h reminder: the same, in the last hour before the start.
//   3. Recording: once per learner with a seat, when staff have added a
//      recording to a session that is over.
// Each send is claimed first, per learner, in one UPDATE ... RETURNING, so
// two overlapping runs cannot both send. A send that fails is unclaimed, so
// the next run tries again. Moving a session re-arms its reminders (the
// claim records the start time it was sent for).

const HOUR = 3_600_000;

export interface LiveCronReport {
  reminders24h: number;
  reminders1h: number;
  recordings: number;
  errors: string[];
}

type Claimed = { studentId: string; email: string; name: string; locale: string };

const COLUMN = {
  "24h": Prisma.sql`"reminded24For"`,
  "1h": Prisma.sql`"reminded1For"`,
} as const;

async function claimReminders(sessionId: string, startsAt: Date, which: "24h" | "1h"): Promise<Claimed[]> {
  const col = COLUMN[which];
  return prisma.$queryRaw<Claimed[]>`
    UPDATE "ExpertSessionRsvp" r SET ${col} = ${startsAt}
    FROM "Student" s
    WHERE s."id" = r."studentId" AND r."sessionId" = ${sessionId} AND r."status" = 'going'
      AND (r.${col} IS NULL OR r.${col} <> ${startsAt})
    RETURNING r."studentId", s."email", s."name", s."locale"`;
}

async function unclaimReminder(sessionId: string, studentId: string, which: "24h" | "1h") {
  const col = COLUMN[which];
  await prisma.$executeRaw`UPDATE "ExpertSessionRsvp" SET ${col} = NULL WHERE "sessionId" = ${sessionId} AND "studentId" = ${studentId}`.catch(() => {});
}

export async function runLiveJobs(now = new Date()): Promise<LiveCronReport> {
  await ensureLiveTables();
  const report: LiveCronReport = { reminders24h: 0, reminders1h: 0, recordings: 0, errors: [] };
  const err = (what: string, e: unknown) => report.errors.push(`${what}: ${e instanceof Error ? e.message : String(e)}`);
  const t = now.getTime();

  for (const s of await listSessions()) {
    if (s.status === "cancelled") continue;
    const until = s.startsAt.getTime() - t;

    // 1 and 2. Reminders, before the start only.
    if (until > 0 && until <= 24 * HOUR && s.status === "scheduled") {
      const which = until <= HOUR ? "1h" : "24h";
      try {
        for (const m of await claimReminders(s.id, s.startsAt, which)) {
          try {
            await sendReminder({ email: m.email, name: m.name, locale: m.locale }, s, which);
            if (which === "1h") report.reminders1h++;
            else report.reminders24h++;
          } catch (e) {
            await unclaimReminder(s.id, m.studentId, which);
            err(`reminder ${which} ${s.id}`, e);
          }
        }
      } catch (e) {
        err(`reminder ${which} ${s.id}`, e);
      }
    }

    // 3. Recording available.
    if (s.recordingUrl && sessionOver(s, t)) {
      try {
        const claimed = await prisma.$queryRaw<Claimed[]>`
          UPDATE "ExpertSessionRsvp" r SET "recordingSentFor" = ${s.recordingUrl}
          FROM "Student" st
          WHERE st."id" = r."studentId" AND r."sessionId" = ${s.id} AND r."status" = 'going' AND r."recordingSentFor" IS NULL
          RETURNING r."studentId", st."email", st."name", st."locale"`;
        for (const m of claimed) {
          const to: To = { email: m.email, name: m.name, locale: m.locale };
          try {
            await sendRecordingEmail(to, s);
            report.recordings++;
          } catch (e) {
            await prisma.$executeRaw`
              UPDATE "ExpertSessionRsvp" SET "recordingSentFor" = NULL WHERE "sessionId" = ${s.id} AND "studentId" = ${m.studentId}`.catch(() => {});
            err(`recording ${s.id}`, e);
          }
        }
      } catch (e) {
        err(`recording ${s.id}`, e);
      }
    }
  }
  return report;
}
