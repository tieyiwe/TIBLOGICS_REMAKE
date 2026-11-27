// Written by scripts/covers-webp.mjs: the covers in public/covers that have
// WebP copies (<name>.webp at 1200 px, <name>-640.webp). Do not edit by hand.

export const WEBP_COVERS: ReadonlySet<string> = new Set([
  "africa-ai-november",
  "africa-ai-week",
  "agents-showdown",
  "ai-price-war",
  "anthropic-bill",
  "anthropic-ipo",
  "datacenter-cleaning",
  "design-for-agents",
  "kind-words",
  "nvidia-week",
  "patch-week",
  "php2shell",
  "roadster-flight",
  "roadster-grip",
  "roadster-thrust",
  "scifi-reality",
  "starlink-global-carrier-v2",
  "tesla-q3",
]);

/**
 * WebP sources for one of our cover PNGs (/covers/<name>.png), or null for any
 * other image (Unsplash, a cover without copies yet).
 */
export function coverWebpSrcSet(src: string | null | undefined): string | null {
  const name = /^\/covers\/([a-z0-9-]+)\.png$/.exec(src ?? "")?.[1];
  if (!name || !WEBP_COVERS.has(name)) return null;
  return `/covers/${name}-640.webp 640w, /covers/${name}.webp 1200w`;
}
