import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureDraftTable } from "./db";
import { DRAFTS_PER_LEARNER, draftBytes, isEmptyDraft } from "./shared";

// Server side of learner drafts. Every function takes the student id from the
// signed-in session (never from the client), so one learner's drafts can
// never be read or written by another.

export interface StoredDraft {
  value: unknown;
  updatedAt: Date;
}

export async function getDraft(studentId: string, key: string): Promise<StoredDraft | null> {
  await ensureDraftTable();
  const row = await prisma.learnerDraft.findUnique({
    where: { studentId_key: { studentId, key } },
    select: { value: true, updatedAt: true },
  });
  return row ? { value: row.value, updatedAt: row.updatedAt } : null;
}

/** Same, but null on any failure: for pages, where a draft is a bonus. */
export async function readDraft(studentId: string, key: string): Promise<StoredDraft | null> {
  return getDraft(studentId, key).catch((err) => {
    console.error("[learn/drafts] read", err);
    return null;
  });
}

/**
 * Last write wins, with one exception: an empty value never replaces a
 * non-empty one (a second tab or device that loaded before the work was
 * typed must not wipe it). Clearing on purpose goes through deleteDrafts.
 */
export async function saveDraft(
  studentId: string,
  key: string,
  value: unknown,
): Promise<{ updatedAt: Date; kept: boolean; value: unknown }> {
  await ensureDraftTable();
  if (isEmptyDraft(value)) {
    const existing = await prisma.learnerDraft.findUnique({
      where: { studentId_key: { studentId, key } },
      select: { value: true, updatedAt: true },
    });
    if (existing && !isEmptyDraft(existing.value)) {
      return { updatedAt: existing.updatedAt, kept: true, value: existing.value };
    }
  }
  const json = (value ?? null) as Prisma.InputJsonValue;
  const size = draftBytes(value);
  const row = await prisma.learnerDraft.upsert({
    where: { studentId_key: { studentId, key } },
    create: { studentId, key, value: json, size },
    update: { value: json, size },
    select: { updatedAt: true },
  });
  await prune(studentId).catch((err) => console.error("[learn/drafts] prune", err));
  return { updatedAt: row.updatedAt, kept: false, value };
}

/** Removes drafts by key, e.g. after the work they hold was submitted. */
export async function deleteDrafts(studentId: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await ensureDraftTable();
  await prisma.learnerDraft.deleteMany({ where: { studentId, key: { in: keys } } });
}

/** Keeps at most DRAFTS_PER_LEARNER drafts: reading positions go first, then the oldest work. */
async function prune(studentId: string): Promise<void> {
  const count = await prisma.learnerDraft.count({ where: { studentId } });
  let excess = count - DRAFTS_PER_LEARNER;
  if (excess <= 0) return;
  const positions = await prisma.learnerDraft.findMany({
    where: { studentId, key: { startsWith: "pos:" } },
    orderBy: { updatedAt: "asc" },
    take: excess,
    select: { id: true },
  });
  const ids = positions.map((p) => p.id);
  excess -= ids.length;
  if (excess > 0) {
    const oldest = await prisma.learnerDraft.findMany({
      where: { studentId, NOT: { key: { startsWith: "pos:" } } },
      orderBy: { updatedAt: "asc" },
      take: excess,
      select: { id: true },
    });
    ids.push(...oldest.map((p) => p.id));
  }
  if (ids.length) await prisma.learnerDraft.deleteMany({ where: { studentId, id: { in: ids } } });
}

/**
 * A short, stable tag for the signed-in learner. The browser keeps it next to
 * its local copies of drafts, so when a different learner signs in on the same
 * browser those copies are discarded instead of shown to them.
 */
export function ownerTag(studentId: string): string {
  return createHash("sha256")
    .update(`${process.env.NEXTAUTH_SECRET ?? ""}:learner-draft:${studentId}`)
    .digest("base64url")
    .slice(0, 16);
}
