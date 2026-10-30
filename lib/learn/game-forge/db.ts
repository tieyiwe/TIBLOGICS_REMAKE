// Game Forge: projects, versions and family share links, per learner.
//
// Runtime tables (also in prisma/schema.prisma and the dbprep STEPS list):
//   GameForgeProject  one game: template, title, the working config
//   GameForgeVersion  numbered snapshots (Apply, Save version, Restore)
//   GameForgeShare    a /play/[token] link: a frozen copy of the game, no
//                     names, until the kid or a parent turns it off
// Every read and write is scoped by studentId (no IDOR): the API passes the
// signed-in learner's id, never one from the request.
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import type { GameConfig, TemplateId } from "./schema";

export const MAX_PROJECTS = 30;
export const MAX_VERSIONS = 30;
export const MAX_ACTIVE_SHARES = 10;

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "GameForgeProject" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameForgeProject_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "GameForgeProject_studentId_updatedAt_idx" ON "GameForgeProject"("studentId","updatedAt")`,
  `CREATE TABLE IF NOT EXISTS "GameForgeVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameForgeVersion_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GameForgeVersion_projectId_n_key" ON "GameForgeVersion"("projectId","n")`,
  `CREATE INDEX IF NOT EXISTS "GameForgeVersion_studentId_idx" ON "GameForgeVersion"("studentId")`,
  `CREATE TABLE IF NOT EXISTS "GameForgeShare" (
    "token" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    CONSTRAINT "GameForgeShare_pkey" PRIMARY KEY ("token")
  )`,
  `CREATE INDEX IF NOT EXISTS "GameForgeShare_studentId_idx" ON "GameForgeShare"("studentId")`,
  `CREATE INDEX IF NOT EXISTS "GameForgeShare_projectId_idx" ON "GameForgeShare"("projectId")`,
  ...["GameForgeProject", "GameForgeVersion", "GameForgeShare"].map(
    (t) => `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${t}_studentId_fkey') THEN
      ALTER TABLE "${t}" ADD CONSTRAINT "${t}_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  ),
  ...["GameForgeVersion", "GameForgeShare"].map(
    (t) => `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${t}_projectId_fkey') THEN
      ALTER TABLE "${t}" ADD CONSTRAINT "${t}_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GameForgeProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  ),
];

let ready: Promise<void> | null = null;
export function ensureGameForgeTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

const newId = () => `gf_${randomBytes(12).toString("base64url")}`;
/** 32 random bytes: the link is the only key to the game. */
export const newShareToken = () => randomBytes(32).toString("base64url");
export const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export interface ProjectSummary {
  id: string;
  template: TemplateId;
  title: string;
  version: number;
  updatedAt: string;
}
export interface Project extends ProjectSummary {
  config: GameConfig;
}
export interface VersionSummary {
  n: number;
  source: string;
  note: string | null;
  createdAt: string;
}
export interface ShareSummary {
  token: string;
  projectId: string;
  title: string;
  template: string;
  views: number;
  createdAt: string;
  revokedAt: string | null;
}

type Row = Record<string, unknown>;
const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d));
const summary = (r: Row): ProjectSummary => ({
  id: String(r.id),
  template: r.template as TemplateId,
  title: String(r.title),
  version: Number(r.version),
  updatedAt: iso(r.updatedAt),
});

export async function listProjects(studentId: string): Promise<ProjectSummary[]> {
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT "id","template","title","version","updatedAt" FROM "GameForgeProject" WHERE "studentId" = $1 ORDER BY "updatedAt" DESC LIMIT ${MAX_PROJECTS}`,
    studentId,
  );
  return rows.map(summary);
}

export async function getProject(studentId: string, id: string): Promise<Project | null> {
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT "id","template","title","version","updatedAt","config" FROM "GameForgeProject" WHERE "id" = $1 AND "studentId" = $2`,
    id, studentId,
  );
  return rows[0] ? { ...summary(rows[0]), config: rows[0].config as GameConfig } : null;
}

export async function countProjects(studentId: string): Promise<number> {
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ n: bigint | number }>>(`SELECT COUNT(*) AS n FROM "GameForgeProject" WHERE "studentId" = $1`, studentId);
  return Number(rows[0]?.n ?? 0);
}

/** A new project with its first version ("start"). */
export async function createProject(studentId: string, config: GameConfig): Promise<Project> {
  await ensureGameForgeTables();
  const id = newId();
  const json = JSON.stringify(config);
  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `INSERT INTO "GameForgeProject" ("id","studentId","template","title","config","version") VALUES ($1,$2,$3,$4,$5::jsonb,1)`,
      id, studentId, config.template, config.title, json,
    ),
    prisma.$executeRawUnsafe(
      `INSERT INTO "GameForgeVersion" ("id","projectId","studentId","n","source","note","config") VALUES ($1,$2,$3,1,'start',NULL,$4::jsonb)`,
      newId(), id, studentId, json,
    ),
  ]);
  return (await getProject(studentId, id))!;
}

/**
 * Saves the working config; with `snapshot`, also as the next numbered
 * version (the oldest beyond MAX_VERSIONS are dropped). Null when the project
 * is not this learner's.
 */
export async function saveProject(
  studentId: string,
  id: string,
  config: GameConfig,
  snapshot: { source: "ai" | "quick" | "manual" | "restore" | "character"; note: string | null } | null,
): Promise<ProjectSummary | null> {
  await ensureGameForgeTables();
  const json = JSON.stringify(config);
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE "GameForgeProject" SET "config" = $3::jsonb, "title" = $4, "updatedAt" = CURRENT_TIMESTAMP${snapshot ? `, "version" = "version" + 1` : ""}
      WHERE "id" = $1 AND "studentId" = $2 AND "template" = $5
      RETURNING "id","template","title","version","updatedAt"`,
    id, studentId, json, config.title, config.template,
  );
  if (!rows[0]) return null;
  const p = summary(rows[0]);
  if (snapshot) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "GameForgeVersion" ("id","projectId","studentId","n","source","note","config") VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
        ON CONFLICT ("projectId","n") DO UPDATE SET "config" = EXCLUDED."config", "source" = EXCLUDED."source", "note" = EXCLUDED."note", "createdAt" = CURRENT_TIMESTAMP`,
      newId(), id, studentId, p.version, snapshot.source, snapshot.note, json,
    );
    await prisma.$executeRawUnsafe(`DELETE FROM "GameForgeVersion" WHERE "projectId" = $1 AND "studentId" = $2 AND "n" <= $3`, id, studentId, p.version - MAX_VERSIONS);
  }
  return p;
}

export async function deleteProject(studentId: string, id: string): Promise<boolean> {
  await ensureGameForgeTables();
  const n = await prisma.$executeRawUnsafe(`DELETE FROM "GameForgeProject" WHERE "id" = $1 AND "studentId" = $2`, id, studentId);
  return n > 0;
}

export async function listVersions(studentId: string, projectId: string): Promise<VersionSummary[]> {
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT "n","source","note","createdAt" FROM "GameForgeVersion" WHERE "projectId" = $1 AND "studentId" = $2 ORDER BY "n" DESC LIMIT ${MAX_VERSIONS}`,
    projectId, studentId,
  );
  return rows.map((r) => ({ n: Number(r.n), source: String(r.source), note: r.note == null ? null : String(r.note), createdAt: iso(r.createdAt) }));
}

export async function getVersion(studentId: string, projectId: string, n: number): Promise<GameConfig | null> {
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT "config" FROM "GameForgeVersion" WHERE "projectId" = $1 AND "studentId" = $2 AND "n" = $3`,
    projectId, studentId, n,
  );
  return rows[0] ? (rows[0].config as GameConfig) : null;
}

// ── Share links ─────────────────────────────────────────────────────────────

const share = (r: Row): ShareSummary => ({
  token: String(r.token),
  projectId: String(r.projectId),
  title: String(r.title),
  template: String(r.template),
  views: Number(r.views),
  createdAt: iso(r.createdAt),
  revokedAt: r.revokedAt ? iso(r.revokedAt) : null,
});

/** The learner's links, newest first (active ones, and ones turned off in the last 30 days). */
export async function listShares(studentId: string): Promise<ShareSummary[]> {
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT "token","projectId","title","template","views","createdAt","revokedAt" FROM "GameForgeShare"
      WHERE "studentId" = $1 AND ("revokedAt" IS NULL OR "revokedAt" > CURRENT_TIMESTAMP - INTERVAL '30 days')
      ORDER BY "createdAt" DESC LIMIT 50`,
    studentId,
  );
  return rows.map(share);
}

export async function countActiveShares(studentId: string): Promise<number> {
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ n: bigint | number }>>(
    `SELECT COUNT(*) AS n FROM "GameForgeShare" WHERE "studentId" = $1 AND "revokedAt" IS NULL`,
    studentId,
  );
  return Number(rows[0]?.n ?? 0);
}

/** A frozen copy of the project's game behind a new link. */
export async function createShare(studentId: string, project: Project): Promise<ShareSummary> {
  await ensureGameForgeTables();
  const token = newShareToken();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "GameForgeShare" ("token","projectId","studentId","template","title","config") VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    token, project.id, studentId, project.template, project.config.title, JSON.stringify(project.config),
  );
  return { token, projectId: project.id, title: project.config.title, template: project.template, views: 0, createdAt: new Date().toISOString(), revokedAt: null };
}

/** Turns a link off. Scoped to the learner (the kid, or a parent through their dashboard). */
export async function revokeShare(studentId: string, token: string, by: "kid" | "parent" | "staff"): Promise<boolean> {
  if (!SHARE_TOKEN_RE.test(token)) return false;
  await ensureGameForgeTables();
  const n = await prisma.$executeRawUnsafe(
    `UPDATE "GameForgeShare" SET "revokedAt" = CURRENT_TIMESTAMP, "revokedBy" = $3 WHERE "token" = $1 AND "studentId" = $2 AND "revokedAt" IS NULL`,
    token, studentId, by,
  );
  return n > 0;
}

/** The game behind an active link (counts the view), or null. */
export async function playShare(token: string): Promise<{ studentId: string; config: unknown } | null> {
  if (!SHARE_TOKEN_RE.test(token)) return null;
  await ensureGameForgeTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE "GameForgeShare" SET "views" = "views" + 1 WHERE "token" = $1 AND "revokedAt" IS NULL RETURNING "studentId","config"`,
    token,
  );
  return rows[0] ? { studentId: String(rows[0].studentId), config: rows[0].config } : null;
}
