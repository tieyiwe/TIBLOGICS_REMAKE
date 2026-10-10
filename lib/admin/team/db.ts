// Team & Roles tables, created at runtime once per process (this project has
// no migrations). The statements mirror the StaffRole, StaffAccess and
// StaffEvent models in prisma/schema.prisma; keep the two in step. Listed in
// the STEPS of app/api/cron/db-prepare/route.ts.
//
//   StaffRole    custom roles (presets live in code: lib/admin/permissions.ts)
//   StaffAccess  one row per collaborator: role, overrides, session version,
//                invite note. Collaborator itself is not altered.
//   StaffEvent   the staff footprint: sign-ins (and failures), admin page
//                views (throttled), API writes and exports. Append-only for
//                staff; only the retention clean-up deletes rows.
import prisma from "@/lib/prisma";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "StaffRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "levels" JSONB NOT NULL DEFAULT '{}',
    "caps" JSONB NOT NULL DEFAULT '[]',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffRole_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "StaffRole_name_key" ON "StaffRole"("name")`,
  `CREATE TABLE IF NOT EXISTS "StaffAccess" (
    "collaboratorId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL DEFAULT 'custom',
    "grants" JSONB NOT NULL DEFAULT '[]',
    "revokes" JSONB NOT NULL DEFAULT '[]',
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "inviteNote" TEXT,
    "migratedFrom" JSONB,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffAccess_pkey" PRIMARY KEY ("collaboratorId")
  )`,
  `CREATE INDEX IF NOT EXISTS "StaffAccess_roleId_idx" ON "StaffAccess"("roleId")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffAccess_collaboratorId_fkey') THEN
      ALTER TABLE "StaffAccess" ADD CONSTRAINT "StaffAccess_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "StaffEvent" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" TEXT,
    "email" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "area" TEXT,
    "path" TEXT,
    "method" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "ipPrefix" TEXT,
    "country" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "meta" JSONB,
    CONSTRAINT "StaffEvent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "StaffEvent_at_idx" ON "StaffEvent"("at")`,
  `CREATE INDEX IF NOT EXISTS "StaffEvent_email_at_idx" ON "StaffEvent"("email", "at")`,
  `CREATE INDEX IF NOT EXISTS "StaffEvent_kind_at_idx" ON "StaffEvent"("kind", "at")`,
];

const g = globalThis as unknown as { __tibTeamTables?: Promise<void> | null };

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureTeamAccessTables(): Promise<void> {
  g.__tibTeamTables ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    g.__tibTeamTables = null;
    throw err;
  });
  return g.__tibTeamTables;
}

export async function teamTablesOk(): Promise<boolean> {
  try {
    await ensureTeamAccessTables();
    return true;
  } catch (err) {
    console.error("[team] tables", err);
    return false;
  }
}
