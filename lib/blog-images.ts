// Cover images for AI TIMES articles.
//
// WHY THIS EXISTS
// The article agent used to fetch covers from source.unsplash.com. Unsplash
// retired that endpoint, so the fetch silently failed and every generated
// article was saved with coverImage = null — which is why agent-written posts
// had no preview image while hand-seeded ones did.
//
// This module replaces that dead dependency with a fixed pool of direct
// images.unsplash.com URLs. Every ID below was already in production use on
// this site, so they are known to render.
//
// UNIQUENESS
// pickCoverImage() is told which images are already taken and will not return
// one of them while any unused image remains. Selection starts from a hash of
// the article slug so the same article always resolves to the same image
// (stable across re-runs), then probes forward until it finds a free one.

/** Photo IDs only — the full URL is built by coverImageUrl(). */
export const COVER_IMAGE_POOL: readonly string[] = [
  "photo-1434030216411-0b793f4b6f6d",
  "photo-1451187580459-43490279c0fa",
  "photo-1454165804606-c3d57bc86b40",
  "photo-1456324504439-367cee3b3c32",
  "photo-1460925895917-afdab827c52f",
  "photo-1461749280684-dccba630e2f6",
  "photo-1475721027785-f74eccf877e2",
  "photo-1481627834876-b7833e8f5570",
  "photo-1484480974693-6ca0a78fb36b",
  "photo-1484557052118-f32bd25b45b5",
  "photo-1485827404703-89b55fcc595e",
  "photo-1486312338219-ce68d2c6f44d",
  "photo-1488229098732-f4b06aced80b",
  "photo-1492684223066-81342ee5ff30",
  "photo-1495592822108-9e6261896da8",
  "photo-1498050108023-c5249f4df085",
  "photo-1499750310107-5fef28a66643",
  "photo-1501504905252-473c47e087f8",
  "photo-1504384764586-bb4cdc1707b0",
  "photo-1504711434969-e33886168f5c",
  "photo-1504868584819-f8e8b4b6d7e3",
  "photo-1505373877841-8d25f7d46678",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1507238691740-187a5b1d37b8",
  "photo-1507679799987-c73779587ccf",
  "photo-1509023464722-18d996393ca8",
  "photo-1513258496099-48168024aec0",
  "photo-1516110833967-0b5716ca1387",
  "photo-1516321318423-f06f85e504b3",
  "photo-1516321497487-e288fb19713f",
  "photo-1517842645767-c639042777db",
  "photo-1518432031352-d6fc5c10da5a",
  "photo-1518770660439-4636190af475",
  "photo-1519389950473-47ba0277781c",
  "photo-1522071820081-009f0129c71c",
  "photo-1522202176988-66273c2fd55f",
  "photo-1526374965328-7f61d4dc18c5",
  "photo-1526470498-9ae73c665de8",
  "photo-1531297484001-80022131f5a1",
  "photo-1531482615713-2afd69097998",
  "photo-1531746790731-6c087fecd65a",
  "photo-1535378620166-273bee7c",
  "photo-1540575467063-178a50c2df87",
  "photo-1542744173-8e7e53415bb0",
  "photo-1543286386-713bdd548da4",
  "photo-1544197150-b99a580bb7a8",
  "photo-1550745165-9bc0b252726f",
  "photo-1550751827-4bd374c3f58b",
  "photo-1551288049-bebda4e38f71",
  "photo-1552664730-d307ca884978",
  "photo-1553729459-efe14ef6055d",
  "photo-1553877522-43269d4ea984",
  "photo-1554224154-26032ffc0d07",
  "photo-1555949963-aa79dcee981c",
  "photo-1556742049-0cfed4f6a45d",
  "photo-1556761175-4b46a572b786",
  "photo-1557804506-669a67965ba0",
  "photo-1558494949-ef010cbdcc31",
  "photo-1558655146-9f40138edfeb",
  "photo-1560472354-b33ff0c44a43",
  "photo-1560472355-536de3962603",
  "photo-1568952433726-3896e3881c65",
  "photo-1572021335469-31706a17aaef",
  "photo-1573164713988-8665fc963095",
  "photo-1573496359142-b8d87734a5a2",
  "photo-1573497019940-1c28c88b4f3e",
  "photo-1573804633927-bfcbcd909acd",
  "photo-1576091160399-112ba8d25d1d",
  "photo-1579389083175-b5aded5da8a3",
  "photo-1581291518633-83b4ebd1d83e",
  "photo-1587440871875-191322ee64b0",
  "photo-1587620962725-abab7fe55159",
  "photo-1588072432836-e10032774350",
  "photo-1589829545856-d10d557cf95f",
  "photo-1593642632559-0c6d3fc62b89",
  "photo-1600880292203-757bb62b4baf",
  "photo-1620288627223-53302f4e8c74",
  "photo-1620712943543-bcc4688e7485",
  "photo-1633356122544-f134324a6cee",
  "photo-1639322537228-f710d846310a",
  "photo-1655720031554-a929595ffad7",
  "photo-1664575601786-b00d7c1e9d6c",
  "photo-1664575602276-acd073f104c1",
  "photo-1676299081847-824916de030a",
  "photo-1677442136019-21780ecad995",
  "photo-1677696795873-45e6b77fa4c0",
  "photo-1779509742657-97f3e5c76f4f",
];

/** Rendering params. Kept in one place so every cover is sized consistently. */
const IMG_PARAMS = "auto=format&fit=crop&w=1200&q=80";

export function coverImageUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?${IMG_PARAMS}`;
}

/** Extract the photo ID from a stored cover URL, for comparison. */
export function photoIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /(photo-[0-9]{10,}-[a-z0-9]+)/.exec(url);
  return m ? m[1] : null;
}

/** Stable string hash — same slug always starts at the same pool offset. */
function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface PickResult {
  url: string;
  photoId: string;
  /** True when the pool was exhausted and an image had to be reused. */
  reused: boolean;
}

/**
 * Choose a cover image that is not already in use.
 *
 * @param slug        Article slug — makes the choice deterministic.
 * @param usedPhotoIds Photo IDs already assigned to other articles.
 *
 * If every image in the pool is taken, this reuses the hash-selected one and
 * flags `reused: true` so the caller can surface that the pool needs topping
 * up, rather than silently duplicating.
 */
export function pickCoverImage(slug: string, usedPhotoIds: Iterable<string>): PickResult {
  const taken = new Set(usedPhotoIds);
  const pool = COVER_IMAGE_POOL;
  const start = hashSlug(slug) % pool.length;

  for (let step = 0; step < pool.length; step++) {
    const id = pool[(start + step) % pool.length];
    if (!taken.has(id)) {
      return { url: coverImageUrl(id), photoId: id, reused: false };
    }
  }

  const fallback = pool[start];
  return { url: coverImageUrl(fallback), photoId: fallback, reused: true };
}

/** How many distinct covers are available. */
export const COVER_POOL_SIZE = COVER_IMAGE_POOL.length;
