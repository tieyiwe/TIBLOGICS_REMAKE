import type { ImageResponse } from "next/og";
import { starlinkGlobalCarrierCover } from "./starlink-global-carrier";
import { OCTOBER_FEATURE_COVERS } from "./october-feature";
import { LATE_OCTOBER_COVERS } from "./late-october";

// Custom article covers drawn in code, served at /og/covers/<name>
// (app/og/covers/[name]/route.ts). A post's coverImage can point at one, and
// the article's share card and structured data use it like a picture file.
export const CUSTOM_COVERS: Record<string, () => Promise<ImageResponse>> = {
  "starlink-global-carrier": starlinkGlobalCarrierCover,
  ...OCTOBER_FEATURE_COVERS,
  ...LATE_OCTOBER_COVERS,
};

const PREFIX = "/og/covers/";

/** The cover's name when a coverImage is one of ours, else null. */
export function customCoverName(coverImage: string | null | undefined): string | null {
  if (!coverImage?.startsWith(PREFIX)) return null;
  const name = coverImage.slice(PREFIX.length).split(/[?#]/)[0];
  return Object.hasOwn(CUSTOM_COVERS, name) ? name : null;
}

/** The PNG of one of our covers, as a data URL (for the share card). */
export async function customCoverDataUrl(coverImage: string): Promise<string | null> {
  const name = customCoverName(coverImage);
  if (!name) return null;
  try {
    const res = await CUSTOM_COVERS[name]();
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
