import prisma from "@/lib/prisma";
import { ensureBlueprintTables } from "./db";
import { hashToken, looksLikeToken } from "./token";

/** The blueprint a private link opens, or null. */
export async function findBlueprintByToken(token: unknown) {
  if (!looksLikeToken(token)) return null;
  await ensureBlueprintTables();
  return prisma.blueprint.findUnique({ where: { tokenHash: hashToken(token) } });
}
