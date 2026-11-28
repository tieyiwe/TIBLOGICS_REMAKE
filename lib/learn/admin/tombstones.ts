import prisma from "@/lib/prisma";

// Seeded content that staff deleted in the admin. The seed identifies modules
// and lessons by position, so without this a deleted seeded lesson would come
// back the next time someone clicks "Seed Learning Box Content".
//
// Keys:  track:<slug>   module:<slug>#<m>   lesson:<slug>#<m>#<l>   lab:<slug>

const KEY = "learn_seed_tombstones";

export async function getTombstones(): Promise<Set<string>> {
  const row = await prisma.adminSettings.findUnique({ where: { key: KEY } }).catch(() => null);
  try {
    return new Set(row ? (JSON.parse(row.value) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function addTombstone(key: string): Promise<void> {
  const set = await getTombstones();
  set.add(key);
  const value = JSON.stringify([...set]);
  await prisma.adminSettings.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
}
