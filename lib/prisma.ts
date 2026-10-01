import { PrismaClient } from "@prisma/client";
import { noteQuery } from "@/lib/db/write-events";

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

function create(): PrismaClient {
  const dev = process.env.NODE_ENV === "development";
  const perf = !!process.env.PRISMA_PERF_LOG;
  // Query events feed lib/db/write-events.ts: a write to a table whose rows
  // are cached for public pages (lib/cache/public-data.ts) drops that cache.
  const c = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
  });
  c.$on("query", (e: { duration: number; query: string }) => {
    noteQuery(e.query);
    if (perf) console.log(`PQ ${e.duration} ${e.query.replace(/\s+/g, " ").slice(0, 220)}`);
    else if (dev) console.log(`prisma:query ${e.query}`);
  });
  return c;
}

export const prisma = globalForPrisma.prisma ?? create();

// Kept on globalThis in production too: one client (and one connection pool)
// per process, even if the bundler instantiates this module more than once.
globalForPrisma.prisma = prisma;

export default prisma;
