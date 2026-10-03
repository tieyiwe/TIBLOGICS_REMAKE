import prisma from "@/lib/prisma";

// Command Center (project management) and Finance tables, created at runtime
// once per process. This project has no migrations: the statements mirror the
// models in prisma/schema.prisma (Project/ProjectTask additions and the Pm* /
// Fin* models at the end), made idempotent. Keep the two in step.
//
// Project and ProjectTask predate this build, so their new columns are all
// nullable or defaulted: existing rows keep every value they had.
//
// Every query that reads Project or ProjectTask through Prisma selects the new
// columns, so every such path calls ensurePmTables() first (lib/admin/projects,
// the projects API, the cc-webhook) and app/api/cron/db-prepare creates them
// before publishing.

const PROJECT_COLUMNS = [
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ownerId" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "health" TEXT NOT NULL DEFAULT 'on_track'`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "healthNote" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "goals" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "links" JSONB NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "progressMode" TEXT NOT NULL DEFAULT 'manual'`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "hourlyRateCents" INTEGER`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "clientName" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "clientEmail" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "prospectId" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "templateKey" TEXT`,
  `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "lastUpdateAt" TIMESTAMP(3)`,
];

const TASK_COLUMNS = [
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'todo'`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'none'`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "description" TEXT`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "labels" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "parentId" TEXT`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3)`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "estimateMinutes" INTEGER`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "blockedBy" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "recurrence" TEXT`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3)`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "createdById" TEXT`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "milestoneId" TEXT`,
  `ALTER TABLE "ProjectTask" ADD COLUMN IF NOT EXISTS "links" JSONB NOT NULL DEFAULT '[]'`,
  `CREATE INDEX IF NOT EXISTS "ProjectTask_assigneeId_idx" ON "ProjectTask"("assigneeId")`,
  `CREATE INDEX IF NOT EXISTS "ProjectTask_parentId_idx" ON "ProjectTask"("parentId")`,
  `CREATE INDEX IF NOT EXISTS "ProjectTask_dueDate_idx" ON "ProjectTask"("dueDate")`,
  // Tasks ticked done before the board existed (or by the cc-webhook) are in
  // the Done column. Only ever moves todo -> done for rows already done.
  `UPDATE "ProjectTask" SET "status" = 'done' WHERE "done" = true AND "status" <> 'done'`,
];

const PM_TABLES = [
  `CREATE TABLE IF NOT EXISTS "PmMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmMilestone_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmComment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    CONSTRAINT "PmComment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmActivity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmActivity_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmNotification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmNotification_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmNote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'note',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmNote_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "health" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "doneMd" TEXT NOT NULL DEFAULT '',
    "nextMd" TEXT NOT NULL DEFAULT '',
    "blockersMd" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmUpdate_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmTimeEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmTimeEntry_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmSavedView" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmSavedView_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PmPrefs" (
    "staffId" TEXT NOT NULL,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,
    "lastDigestAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PmPrefs_pkey" PRIMARY KEY ("staffId")
  )`,
];

const PM_INDEXES = [
  `CREATE INDEX IF NOT EXISTS "PmMilestone_projectId_idx" ON "PmMilestone"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "PmComment_taskId_idx" ON "PmComment"("taskId")`,
  `CREATE INDEX IF NOT EXISTS "PmActivity_projectId_createdAt_idx" ON "PmActivity"("projectId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "PmNotification_recipientId_createdAt_idx" ON "PmNotification"("recipientId", "createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PmNotification_dedupeKey_key" ON "PmNotification"("dedupeKey")`,
  `CREATE INDEX IF NOT EXISTS "PmNote_projectId_idx" ON "PmNote"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "PmUpdate_projectId_createdAt_idx" ON "PmUpdate"("projectId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "PmTimeEntry_projectId_idx" ON "PmTimeEntry"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "PmTimeEntry_staffId_endedAt_idx" ON "PmTimeEntry"("staffId", "endedAt")`,
  `CREATE INDEX IF NOT EXISTS "PmSavedView_ownerId_idx" ON "PmSavedView"("ownerId")`,
];

const FIN_TABLES = [
  `CREATE TABLE IF NOT EXISTS "FinReceipt" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinReceipt_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "FinIncome" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "client" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "amountUsdCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "taxUsdCents" INTEGER NOT NULL DEFAULT 0,
    "taxLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'invoiced',
    "invoiceNumber" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinIncome_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "FinRecurring" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "amountUsdCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "taxUsdCents" INTEGER NOT NULL DEFAULT 0,
    "taxLabel" TEXT,
    "paymentMethod" TEXT,
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinRecurring_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "FinExpense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "amountUsdCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "taxUsdCents" INTEGER NOT NULL DEFAULT 0,
    "taxLabel" TEXT,
    "paymentMethod" TEXT,
    "receiptId" TEXT,
    "receiptUrl" TEXT,
    "recurringId" TEXT,
    "periodKey" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinExpense_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "FinBudget" (
    "category" TEXT NOT NULL,
    "monthlyUsdCents" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinBudget_pkey" PRIMARY KEY ("category")
  )`,
];

const FIN_INDEXES = [
  `CREATE INDEX IF NOT EXISTS "FinIncome_date_idx" ON "FinIncome"("date")`,
  `CREATE INDEX IF NOT EXISTS "FinIncome_projectId_idx" ON "FinIncome"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "FinExpense_date_idx" ON "FinExpense"("date")`,
  `CREATE INDEX IF NOT EXISTS "FinExpense_projectId_idx" ON "FinExpense"("projectId")`,
  `CREATE INDEX IF NOT EXISTS "FinExpense_category_date_idx" ON "FinExpense"("category", "date")`,
  // One generated expense per recurring charge per period: this is what makes
  // generation idempotent however often it runs.
  `CREATE UNIQUE INDEX IF NOT EXISTS "FinExpense_recurringId_periodKey_key" ON "FinExpense"("recurringId", "periodKey")`,
];

function fk(table: string, column: string, ref: string, onDelete: "CASCADE" | "SET NULL") {
  const name = `${table}_${column}_fkey`;
  return `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
      ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}") REFERENCES "${ref}"("id") ON DELETE ${onDelete} ON UPDATE CASCADE;
    END IF;
  END $$`;
}

// Project deletion removes its PM records; finance entries stay (they are the
// books) and just lose the project link.
const PM_FKS = [
  fk("PmMilestone", "projectId", "Project", "CASCADE"),
  fk("PmComment", "projectId", "Project", "CASCADE"),
  fk("PmComment", "taskId", "ProjectTask", "CASCADE"),
  fk("PmActivity", "projectId", "Project", "CASCADE"),
  fk("PmNote", "projectId", "Project", "CASCADE"),
  fk("PmUpdate", "projectId", "Project", "CASCADE"),
  fk("PmTimeEntry", "projectId", "Project", "CASCADE"),
  fk("PmTimeEntry", "taskId", "ProjectTask", "SET NULL"),
];

const FIN_FKS = [
  fk("FinIncome", "projectId", "Project", "SET NULL"),
  fk("FinExpense", "projectId", "Project", "SET NULL"),
  fk("FinRecurring", "projectId", "Project", "SET NULL"),
  fk("FinExpense", "receiptId", "FinReceipt", "SET NULL"),
  fk("FinExpense", "recurringId", "FinRecurring", "SET NULL"),
];

let pmReady: Promise<void> | null = null;
let finReady: Promise<void> | null = null;

/** Project/task columns and the Pm* tables. Throws if they cannot be created. */
export function ensurePmTables(): Promise<void> {
  pmReady ??= (async () => {
    for (const sql of [...PROJECT_COLUMNS, ...TASK_COLUMNS, ...PM_TABLES, ...PM_INDEXES, ...PM_FKS]) {
      await prisma.$executeRawUnsafe(sql);
    }
  })().catch((err) => {
    pmReady = null;
    throw err;
  });
  return pmReady;
}

/** The Fin* tables (needs the Project columns for its project links). */
export function ensureFinanceTables(): Promise<void> {
  finReady ??= (async () => {
    await ensurePmTables();
    for (const sql of [...FIN_TABLES, ...FIN_INDEXES, ...FIN_FKS]) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    finReady = null;
    throw err;
  });
  return finReady;
}
