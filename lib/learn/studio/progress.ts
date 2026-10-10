import prisma from "@/lib/prisma";

export type StudioProgress = Record<string, Record<string, { done: boolean; perfect: boolean }>>;

/**
 * Which Studio challenges a learner has completed, and which with 3 stars,
 * read from the points ledger (refId "<tool>:<challenge>"), so there is no
 * extra table.
 */
export async function studioProgress(studentId: string): Promise<StudioProgress> {
  const rows = await prisma.pointsLedger
    .findMany({
      where: { studentId, source: { in: ["studio_challenge", "studio_perfect"] } },
      select: { source: true, refId: true },
    })
    .catch(() => []);
  const out: StudioProgress = {};
  for (const r of rows) {
    const [tool, challenge] = String(r.refId ?? "").split(":");
    if (!tool || !challenge) continue;
    const t = (out[tool] ??= {});
    const c = (t[challenge] ??= { done: false, perfect: false });
    if (r.source === "studio_challenge") c.done = true;
    if (r.source === "studio_perfect") { c.done = true; c.perfect = true; }
  }
  return out;
}
