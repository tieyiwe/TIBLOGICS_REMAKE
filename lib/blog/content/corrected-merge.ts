import { CORRECTION_BY_OLD_TITLE } from "./corrected";

/**
 * A seed entry, with its words replaced by the corrected version when it is
 * listed in corrected.ts. Cover image, emoji and the rest are kept.
 */
export function withCorrection<T extends { title: string; excerpt: string; category: string; tags: string[]; content: string; author?: string }>(entry: T): T {
  const c = CORRECTION_BY_OLD_TITLE.get(entry.title.toLowerCase().trim());
  if (!c) return entry;
  return { ...entry, title: c.title, excerpt: c.excerpt, category: c.category, tags: c.tags, content: c.content, ...(c.author ? { author: c.author } : {}) };
}
