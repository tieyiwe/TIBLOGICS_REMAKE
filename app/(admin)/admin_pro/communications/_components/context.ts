import prisma from "@/lib/prisma";
import { ensureAccountTables } from "@/lib/learn/account-status/db";
import { ensureCommsTables } from "@/lib/learn/inbox/db";
import { trackList } from "@/lib/learn/admin/learners";
import type { ComposerContext } from "./MessageComposer";

/** Everything the composer's pickers need (tracks, teams, tags, templates). */
export async function composerContext(adminEmail: string): Promise<ComposerContext> {
  await Promise.all([ensureAccountTables().catch(() => {}), ensureCommsTables().catch(() => {})]);
  const [tracks, teams, tagRows, templates] = await Promise.all([
    trackList(),
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 300 }).catch(() => []),
    prisma.$queryRaw<Array<{ tag: string }>>`SELECT DISTINCT unnest("tags") AS tag FROM "LearnerAccount" ORDER BY 1 LIMIT 200`.catch(() => []),
    prisma.commsTemplate
      .findMany({ orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, name: true, kind: true, subject: true, body: true, subjectFr: true, bodyFr: true } })
      .catch(() => []),
  ]);
  return {
    tracks: tracks.map((t) => ({ id: t.id, title: t.title })),
    teams,
    tags: tagRows.map((r) => r.tag),
    templates,
    adminEmail,
  };
}
