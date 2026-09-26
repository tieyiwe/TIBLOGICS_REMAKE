// Assigning cover images to articles, with database-backed uniqueness.
//
// Kept separate from lib/blog-images.ts (which is pure data + selection logic)
// so the pool can be unit-tested without a database.
import prisma from "@/lib/prisma";
import { pickCoverImage, photoIdFromUrl, type PickResult } from "@/lib/blog-images";

/**
 * Photo IDs currently assigned to articles.
 *
 * @param excludePostId Ignore this post's own image, so re-assigning a post
 *                      doesn't treat its current image as a conflict.
 */
export async function getUsedCoverPhotoIds(excludePostId?: string): Promise<Set<string>> {
  const rows = await prisma.blogPost
    .findMany({
      where: {
        coverImage: { not: null },
        ...(excludePostId ? { id: { not: excludePostId } } : {}),
      },
      select: { coverImage: true },
    })
    .catch(() => [] as Array<{ coverImage: string | null }>);

  const used = new Set<string>();
  for (const r of rows) {
    const id = photoIdFromUrl(r.coverImage);
    if (id) used.add(id);
  }
  return used;
}

/**
 * Pick a cover image for a new or existing article that no other article is
 * using. Falls back gracefully if the database is unreachable — a post with a
 * possibly-duplicate image is better than a post with no image at all.
 */
export async function assignCoverImage(
  slug: string,
  excludePostId?: string,
): Promise<PickResult> {
  const used = await getUsedCoverPhotoIds(excludePostId);
  const result = pickCoverImage(slug, used);
  if (result.reused) {
    console.warn(
      `[blog-cover] Cover pool exhausted (${used.size} in use) — reused an image for "${slug}". ` +
        `Add more IDs to COVER_IMAGE_POOL in lib/blog-images.ts.`,
    );
  }
  return result;
}
