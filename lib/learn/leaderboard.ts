// Weekly XP leaderboard. Opt-in only: a learner appears only after turning
// it on in Account, and then only as first name plus last initial.
import prisma from "@/lib/prisma";
import { hiddenMinorIds } from "@/lib/learn/youth-account";

// The Learn tables predate this column and there are no migrations, so it is
// added once per process (same pattern as lib/learn/admin/columns.ts).
let ready: Promise<void> | null = null;

export function ensureLeaderboardColumn(): Promise<void> {
  ready ??= prisma
    .$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false`)
    .then(() => undefined)
    .catch((err) => {
      ready = null;
      throw err;
    });
  return ready;
}

/** Monday 00:00 UTC of the current week. */
export function weekStart(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
}

/** "Amina Wanjiru Otieno" -> "Amina O." */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

export interface BoardRow {
  rank: number;
  name: string;
  xp: number;
  isMe: boolean;
}

export async function weeklyLeaderboard(studentId: string, limit = 20) {
  await ensureLeaderboardColumn().catch(() => {});
  const since = weekStart();
  // Learners under 18 appear only when their parent allowed it (parent
  // dashboard), whatever their own setting says.
  const hidden = await hiddenMinorIds();

  const [me, weekly, myXp] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { leaderboardOptIn: true } }),
    prisma.pointsLedger.groupBy({
      by: ["studentId"],
      where: { createdAt: { gte: since }, student: { leaderboardOptIn: true }, ...(hidden.length ? { studentId: { notIn: hidden } } : {}) },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
    }),
    prisma.pointsLedger.aggregate({ where: { studentId, createdAt: { gte: since } }, _sum: { points: true } }),
  ]);

  // Competition ranking: equal XP shares a rank.
  const ranked: Array<{ studentId: string; xp: number; rank: number }> = [];
  weekly.forEach((r, i) => {
    const xp = r._sum.points ?? 0;
    const prev = ranked[i - 1];
    ranked.push({ studentId: r.studentId, xp, rank: prev && prev.xp === xp ? prev.rank : i + 1 });
  });

  const top = ranked.slice(0, limit);
  const mine = ranked.find((r) => r.studentId === studentId) ?? null;
  const ids = [...new Set([...top.map((r) => r.studentId), ...(mine ? [studentId] : [])])];
  const names = ids.length
    ? await prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const nameOf = new Map(names.map((n) => [n.id, publicName(n.name)]));
  const row = (r: { studentId: string; xp: number; rank: number }): BoardRow => ({
    rank: r.rank,
    name: nameOf.get(r.studentId) ?? "?",
    xp: r.xp,
    isMe: r.studentId === studentId,
  });

  return {
    optedIn: me?.leaderboardOptIn ?? false,
    since,
    top: top.map(row),
    /** Set when the learner is on the board but outside the top rows. */
    me: mine && !top.some((r) => r.studentId === studentId) ? row(mine) : null,
    myRank: mine?.rank ?? null,
    myXp: myXp._sum.points ?? 0,
    players: ranked.length,
  };
}
