import { PrismaClient } from "@prisma/client";

// Accept the legacy variable name as an alias.
//
// The schema now reads DATABASE_URL, but this project ran on SUPABASE_URL for
// its whole life. Setting the alias here means a deployment that still only
// has the old secret keeps working, so the migration to a new Postgres host
// can be done without a window where the app is down. Remove once
// DATABASE_URL is set everywhere.
//
// Runs before PrismaClient is constructed — Prisma reads the environment at
// construction time, so ordering matters.
if (!process.env.DATABASE_URL && process.env.SUPABASE_URL) {
  process.env.DATABASE_URL = process.env.SUPABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
