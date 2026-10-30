// Makes the WebP copies of the article covers in public/covers and the list
// the site reads (lib/blog/cover-webp.ts). Run after adding a cover PNG:
//
//   node scripts/covers-webp.mjs
//
// For each public/covers/<name>.png: <name>.webp (1200 px wide) and
// <name>-640.webp. The PNG stays: share previews (Open Graph) and the article
// share card use it. A cover missing from the list is simply shown as PNG.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp"); // installed with Next.js

const dir = path.join(process.cwd(), "public", "covers");
const WIDTHS = [
  [1200, ""],
  [640, "-640"],
];

const names = [];
for (const file of fs.readdirSync(dir).sort()) {
  if (!file.endsWith(".png")) continue;
  const name = file.slice(0, -4);
  if (!/^[a-z0-9-]+$/.test(name)) continue;
  for (const [width, suffix] of WIDTHS) {
    const out = path.join(dir, `${name}${suffix}.webp`);
    await sharp(path.join(dir, file)).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
  }
  names.push(name);
}

const list = names.map((n) => `  "${n}",`).join("\n");
fs.writeFileSync(
  path.join(process.cwd(), "lib", "blog", "cover-webp.ts"),
  `// Written by scripts/covers-webp.mjs: the covers in public/covers that have
// WebP copies (<name>.webp at 1200 px, <name>-640.webp). Do not edit by hand.

export const WEBP_COVERS: ReadonlySet<string> = new Set([
${list}
]);

/**
 * WebP sources for one of our cover PNGs (/covers/<name>.png), or null for any
 * other image (Unsplash, a cover without copies yet).
 */
export function coverWebpSrcSet(src: string | null | undefined): string | null {
  const name = /^\\/covers\\/([a-z0-9-]+)\\.png$/.exec(src ?? "")?.[1];
  if (!name || !WEBP_COVERS.has(name)) return null;
  return \`/covers/\${name}-640.webp 640w, /covers/\${name}.webp 1200w\`;
}
`,
);
console.log(`${names.length} covers: WebP copies and lib/blog/cover-webp.ts written`);
