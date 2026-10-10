import { normaliseChapters, type Captions, type Chapter } from "./shared";
import type { TtsLocale } from "./tts";

// Generated narrated videos as stored on LessonVideoMeta.variants: one per
// language, each with its own file link, chapters and captions. Light (no
// Node or ffmpeg imports) so the lesson page can read it.

export const ASSET_PREFIX = "/api/learn/video/asset/";

/** A link to a generated video (as opposed to the owner's own YouTube/Vimeo/file). */
export function isGeneratedUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith(ASSET_PREFIX);
}

export interface Variant {
  url: string;
  webm?: string;
  assetIds: string[];
  chapters: Chapter[];
  captions: Captions;
  durationSec: number;
  voice: string;
  provider: string;
  generatedAt: string;
}

export type Variants = Partial<Record<TtsLocale, Variant>>;

export function readVariants(v: unknown): Variants {
  const out: Variants = {};
  if (!v || typeof v !== "object") return out;
  for (const l of ["en", "fr"] as const) {
    const x = (v as Record<string, unknown>)[l] as Partial<Variant> | undefined;
    if (x && typeof x.url === "string" && isGeneratedUrl(x.url)) {
      out[l] = {
        url: x.url,
        webm: typeof x.webm === "string" && isGeneratedUrl(x.webm) ? x.webm : undefined,
        assetIds: Array.isArray(x.assetIds) ? x.assetIds.filter((a): a is string => typeof a === "string") : [],
        chapters: normaliseChapters(x.chapters),
        captions: (x.captions && typeof x.captions === "object" ? x.captions : {}) as Captions,
        durationSec: Number(x.durationSec) || 0,
        voice: String(x.voice ?? ""),
        provider: String(x.provider ?? ""),
        generatedAt: String(x.generatedAt ?? ""),
      };
    }
  }
  return out;
}

