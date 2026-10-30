import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { ensureScholarshipTables } from "./db";
import { deadlines, liveTracks, sendOfferReminder } from "./service";
import { progressFor } from "./progress";
import { sendScholarNotice } from "./emails";

// The daily scholarship job (npm run cron scholarship). At most one email per
// scholarship per run, each kind sent once (ScholarshipNotice):
//   offer-reminder   approved, not accepted, offer ends within 5 days
//   pick-7 / pick-1  tracks left to choose, 7 days and 1 day before the deadline
//   complete-half    halfway to the completion target
//   complete-14      14 days before the completion target
//   progress-<n>     monthly progress, from a month after accepting
//   completed        every chosen track certified: congratulations

const DAY = 86_400_000;

/** Claims a notice; false if it was already sent. */
async function claim(scholarshipId: string, kind: string): Promise<boolean> {
  const n = await prisma.$executeRaw`
    INSERT INTO "ScholarshipNotice" ("id", "scholarshipId", "kind") VALUES (${randomUUID()}, ${scholarshipId}, ${kind})
    ON CONFLICT DO NOTHING`;
  return n > 0;
}
const release = (scholarshipId: string, kind: string) => prisma.scholarshipNotice.deleteMany({ where: { scholarshipId, kind } });

async function once(scholarshipId: string, kind: string, send: () => Promise<void>): Promise<boolean> {
  if (!(await claim(scholarshipId, kind))) return false;
  try {
    await send();
    return true;
  } catch (err) {
    await release(scholarshipId, kind).catch(() => {});
    throw err;
  }
}

export async function runScholarshipNotices(opts: { deadline?: number; max?: number } = {}): Promise<{ sent: number; failed: number; byKind: Record<string, number> }> {
  await ensureScholarshipTables();
  const stop = opts.deadline ?? Date.now() + 240_000;
  const max = opts.max ?? 300;
  const now = Date.now();
  const byKind: Record<string, number> = {};
  let sent = 0;
  let failed = 0;
  const count = (k: string) => {
    byKind[k] = (byKind[k] ?? 0) + 1;
    sent++;
  };

  // 1. Offers about to run out.
  const offers = await prisma.scholarship.findMany({
    where: { status: "approved", offerExpiresAt: { gt: new Date(now), lte: new Date(now + 5 * DAY) }, emailedAt: { lte: new Date(now - 2 * DAY) } },
    select: { id: true },
    take: 200,
  });
  for (const o of offers) {
    if (Date.now() > stop || sent >= max) break;
    try {
      if (await once(o.id, "offer-reminder", () => sendOfferReminder(o.id))) count("offer-reminder");
    } catch (err) {
      failed++;
      console.error("[scholarship] offer reminder", o.id, err instanceof Error ? err.message : err);
    }
  }

  // 2. Accepted scholarships.
  const rows = await prisma.scholarship.findMany({ where: { status: "claimed", studentId: { not: null } }, take: 2000 });
  if (!rows.length) return { sent, failed, byKind };
  const [picks, students, titles] = await Promise.all([
    prisma.scholarshipTrack.findMany({ where: { scholarshipId: { in: rows.map((r) => r.id) } } }),
    prisma.student.findMany({ where: { id: { in: rows.map((r) => r.studentId!) } }, select: { id: true, name: true, email: true, locale: true } }),
    liveTracks().catch(() => []),
  ]);
  const prog = await progressFor(picks.map((p) => ({ studentId: p.studentId, trackId: p.trackId })), new Date(now - 30 * DAY));
  const sentBefore = new Set(
    (await prisma.scholarshipNotice.findMany({ where: { scholarshipId: { in: rows.map((r) => r.id) } }, select: { scholarshipId: true, kind: true } })).map((n) => `${n.scholarshipId}:${n.kind}`),
  );
  const has = (id: string, kind: string) => sentBefore.has(`${id}:${kind}`);
  const titleOf = new Map(titles.map((t) => [t.id, { en: t.title, fr: t.titleFr }]));

  for (const s of rows) {
    if (Date.now() > stop || sent >= max) break;
    const st = students.find((x) => x.id === s.studentId);
    if (!st) continue;
    const mine = picks.filter((p) => p.scholarshipId === s.id);
    const lines = mine.map((p) => {
      const g = prog.get(p.studentId, p.trackId);
      const t = titleOf.get(p.trackId);
      return { title: (st.locale === "fr" && t?.fr) || t?.en || "Track", done: g.done, total: g.total, certified: g.certified };
    });
    const { pickBy, completeBy } = deadlines(s);
    const remaining = Math.max(0, s.trackCount - mine.length);
    const allDone = mine.length > 0 && lines.every((l) => l.certified);
    const base = { email: st.email, name: st.name, locale: st.locale };

    // One per run, most important first.
    let job: { kind: string; send: () => Promise<void> } | null = null;
    if (allDone && (remaining === 0 || (pickBy && pickBy.getTime() <= now)) && !has(s.id, "completed")) {
      job = { kind: "completed", send: () => sendScholarNotice({ ...base, kind: "completed", lines }) };
    } else if (pickBy && remaining > 0 && pickBy.getTime() > now) {
      const daysLeft = Math.ceil((pickBy.getTime() - now) / DAY);
      const kind = daysLeft <= 1 ? "pick-1" : daysLeft <= 7 ? "pick-7" : null;
      if (kind && !has(s.id, kind)) {
        job = {
          kind,
          send: async () => {
            await sendScholarNotice({ ...base, kind: "pick", date: pickBy, daysLeft, remaining });
            if (kind === "pick-1") await claim(s.id, "pick-7");
          },
        };
      }
    }
    if (!job && completeBy && mine.length && !allDone && completeBy.getTime() > now) {
      const daysLeft = Math.ceil((completeBy.getTime() - now) / DAY);
      const half = s.claimedAt!.getTime() + (completeBy.getTime() - s.claimedAt!.getTime()) / 2;
      if (daysLeft <= 14 && !has(s.id, "complete-14")) job = { kind: "complete-14", send: () => sendScholarNotice({ ...base, kind: "complete-soon", date: completeBy, daysLeft, lines }) };
      else if (daysLeft > 14 && now >= half && !has(s.id, "complete-half")) job = { kind: "complete-half", send: () => sendScholarNotice({ ...base, kind: "complete-half", date: completeBy, lines }) };
    }
    if (!job && mine.length && !allDone && s.claimedAt) {
      const months = Math.floor((now - s.claimedAt.getTime()) / (30 * DAY));
      const kind = `progress-${months}`;
      if (months >= 1 && !has(s.id, kind)) {
        job = { kind, send: () => sendScholarNotice({ ...base, kind: "progress", lines, lessonsThisMonth: prog.recent(st.id) }) };
      }
    }
    if (!job) continue;
    try {
      if (await once(s.id, job.kind, job.send)) count(job.kind.replace(/-\d+$/, ""));
    } catch (err) {
      failed++;
      console.error("[scholarship] notice", s.id, job.kind, err instanceof Error ? err.message : err);
    }
  }
  return { sent, failed, byKind };
}
