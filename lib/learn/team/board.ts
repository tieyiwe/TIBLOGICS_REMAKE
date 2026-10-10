import prisma from "@/lib/prisma";
import { ensureLeaderboardColumn, publicName, weekStart } from "@/lib/learn/leaderboard";

// The team's weekly XP board, for members. Same opt-in as the public
// leaderboard (Student.leaderboardOptIn, set in Account): only members who
// turned it on are listed, as first name plus last initial. A member who did
// not opt in sees the board but is not on it.

export interface TeamBoard {
  optedIn: boolean;
  rows: Array<{ rank: number; name: string; xp: number; isMe: boolean }>;
}

export async function teamBoard(teamId: string, viewerId: string): Promise<TeamBoard> {
  await ensureLeaderboardColumn().catch(() => {});
  const seats = await prisma.teamMember.findMany({ where: { teamId, status: "active" }, select: { studentId: true } });
  const ids = seats.map((s) => s.studentId).filter((x): x is string => !!x);
  const [students, me] = await Promise.all([
    prisma.student.findMany({ where: { id: { in: ids }, leaderboardOptIn: true }, select: { id: true, name: true } }),
    prisma.student.findUnique({ where: { id: viewerId }, select: { leaderboardOptIn: true } }),
  ]);
  if (students.length === 0) return { optedIn: !!me?.leaderboardOptIn, rows: [] };
  const sums = await prisma.pointsLedger.groupBy({
    by: ["studentId"],
    where: { studentId: { in: students.map((s) => s.id) }, createdAt: { gte: weekStart() } },
    _sum: { points: true },
  });
  const list = students
    .map((s) => ({ id: s.id, name: publicName(s.name), xp: sums.find((x) => x.studentId === s.id)?._sum.points ?? 0 }))
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
  const rows: TeamBoard["rows"] = [];
  list.forEach((r, i) => {
    const prev = rows[i - 1];
    rows.push({ rank: prev && prev.xp === r.xp ? prev.rank : i + 1, name: r.name, xp: r.xp, isMe: r.id === viewerId });
  });
  return { optedIn: !!me?.leaderboardOptIn, rows: rows.slice(0, 20) };
}
