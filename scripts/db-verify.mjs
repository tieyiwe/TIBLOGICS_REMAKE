#!/usr/bin/env node
// Restore-drill check (security checklist, door 30).
//
// Connects to a database READ ONLY and reports whether it looks like a
// complete TIBLOGICS database: the critical tables exist, how many rows each
// holds, and the newest record in the tables that show how recent the data is
// (the restore point). Nothing is written.
//
//   npm run db:verify                                  # uses DATABASE_URL
//   npm run db:verify -- "postgresql://...restored"   # a restored copy
//   VERIFY_DATABASE_URL="postgresql://..." npm run db:verify
//
// Exit code 0 when every critical table is present, 1 otherwise, so it can be
// scripted. The connection string is never printed.

import { PrismaClient } from "@prisma/client";

const url = process.argv[2] || process.env.VERIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("No database given. Pass a connection string, or set VERIFY_DATABASE_URL or DATABASE_URL.");
  process.exit(2);
}

// One connection, so the read-only setting below applies to every query.
const withLimit = url.includes("connection_limit=") ? url : `${url}${url.includes("?") ? "&" : "?"}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url: withLimit } } });

// Must exist in any working copy (the app cannot run without them).
const CRITICAL = [
  "Student", "LearnTrack", "LearnModule", "Lesson", "LearnSubscription", "TrackPurchase",
  "LessonProgress", "LearnCertificate", "Collaborator", "AdminSettings", "Order", "Product",
  "DownloadGrant", "Appointment", "Event", "EventRegistration", "BlogPost", "NewsletterSubscriber",
  "Team", "TeamMember",
];
// Created by the app at runtime; missing on a very new database, which is fine.
const RUNTIME = [
  "AdminAuditLog", "AiUsage", "RateLimit", "LearnerAccount", "InboxThread", "CommsCampaign",
  "Promotion", "ContentTranslation", "LoginEvent", "TutorThread",
];
// Newest row per table: shows how far the restored data goes.
const FRESHNESS = [
  ["Student", "createdAt"], ["Order", "createdAt"], ["LessonProgress", "completedAt"],
  ["Appointment", "createdAt"], ["EventRegistration", "createdAt"], ["AdminAuditLog", "at"],
  ["AiUsage", "createdAt"],
];

const ident = (s) => `"${s.replace(/"/g, '""')}"`;
const host = (() => {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? ":" + u.port : ""}${u.pathname}`;
  } catch {
    return "(unparsed)";
  }
})();

let missingCritical = 0;
try {
  await prisma.$executeRawUnsafe("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY");
  const [{ version }] = await prisma.$queryRawUnsafe("SELECT version() AS version");
  console.log(`Database: ${host}`);
  console.log(`Server:   ${String(version).split(",")[0]}`);

  const rows = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  );
  const present = new Set(rows.map((r) => r.table_name));
  console.log(`Tables:   ${present.size} in schema "public"\n`);

  const count = async (t) => Number((await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS n FROM ${ident(t)}`))[0].n);

  console.log("Critical tables");
  for (const t of CRITICAL) {
    if (!present.has(t)) {
      missingCritical++;
      console.log(`  MISSING  ${t}`);
    } else {
      console.log(`  ok       ${t.padEnd(22)} ${String(await count(t)).padStart(9)} rows`);
    }
  }
  console.log("\nRuntime tables (created on first use)");
  for (const t of RUNTIME) {
    console.log(present.has(t) ? `  ok       ${t.padEnd(22)} ${String(await count(t)).padStart(9)} rows` : `  absent   ${t}`);
  }
  console.log("\nNewest records (the restore point)");
  for (const [t, col] of FRESHNESS) {
    if (!present.has(t)) continue;
    try {
      const [{ latest }] = await prisma.$queryRawUnsafe(`SELECT MAX(${ident(col)}) AS latest FROM ${ident(t)}`);
      console.log(`  ${t.padEnd(22)} ${latest ? new Date(latest).toISOString() : "(empty)"}`);
    } catch {
      console.log(`  ${t.padEnd(22)} (no ${col} column)`);
    }
  }
  const owner = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "AdminSettings" WHERE "key" = 'admin_password_hash'`).catch(() => [{ n: 0 }]);
  console.log(`\nOwner password hash stored: ${owner[0].n ? "yes" : "no (ADMIN_PASSWORD secret still works)"}`);
} catch (err) {
  console.error("Could not read the database:", err instanceof Error ? err.message.split("\n")[0] : err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

if (missingCritical) {
  console.error(`\nFAIL: ${missingCritical} critical table(s) missing.`);
  process.exit(1);
}
console.log("\nPASS: every critical table is present.");
