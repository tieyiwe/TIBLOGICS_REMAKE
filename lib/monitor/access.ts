import prisma from "@/lib/prisma";
import { ensureMonitorTables } from "./db";
import { hashMonitorToken, looksLikeMonitorToken } from "./token";

/** The subscription a dashboard link opens, or null. */
export async function findMonitorByToken(token: unknown) {
  if (!looksLikeMonitorToken(token)) return null;
  await ensureMonitorTables();
  return prisma.monitorSubscription.findUnique({ where: { tokenHash: hashMonitorToken(token) } });
}
