import prisma from "@/lib/prisma";

/**
 * Non-archived projects with their tasks, in the shape GET /api/admin/projects
 * returns (dates as ISO strings). Shared by the Command Center views, which
 * each used to fetch this after the page had loaded. Callers must have already
 * checked for a staff session.
 */
export async function getActiveProjects<T = unknown>(): Promise<T[]> {
  const projects = await prisma.project
    .findMany({
      where: { archived: false },
      include: { tasks: { orderBy: { order: "asc" } } },
      orderBy: [{ starred: "desc" }, { updatedAt: "desc" }],
    })
    .catch((err) => {
      console.error("[admin/projects]", err);
      return [];
    });
  return JSON.parse(JSON.stringify(projects)) as T[];
}
