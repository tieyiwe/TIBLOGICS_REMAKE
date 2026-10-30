import prisma from "@/lib/prisma";
import { ensureScholarshipTables } from "./db";

// Light checks for the "Tilo Vision Scholar" mark on certificates, the
// verification page and the public portfolio. False on any failure.

/** The learner unlocked this track with a scholarship that was not revoked. */
export async function isScholarTrack(studentId: string, trackId: string): Promise<boolean> {
  try {
    await ensureScholarshipTables();
    const rows = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM "ScholarshipTrack" st JOIN "Scholarship" s ON s."id" = st."scholarshipId"
      WHERE st."studentId" = ${studentId} AND st."trackId" = ${trackId} AND s."status" <> 'revoked'`;
    return Number(rows[0]?.n ?? 0) > 0;
  } catch {
    return false;
  }
}

/** The learner holds an accepted Tilo Vision Scholarship. */
export async function isScholar(studentId: string): Promise<boolean> {
  try {
    await ensureScholarshipTables();
    return (await prisma.scholarship.count({ where: { studentId, status: "claimed" } })) > 0;
  } catch {
    return false;
  }
}
