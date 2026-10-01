import { NextRequest } from "next/server";
import { requireTeamManager, teamRateLimit } from "@/lib/learn/team/guard";
import { teamCsv } from "@/lib/learn/team/report";

/** CSV of the team's progress (same privacy limits as the dashboard). */
export async function GET(req: NextRequest) {
  const limited = await teamRateLimit(req, "export", 10);
  if (limited) return limited;
  const g = await requireTeamManager();
  if (g.error) return g.error;
  const csv = await teamCsv(g.m.team.id);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="team-progress-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
}
