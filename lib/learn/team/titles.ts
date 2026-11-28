import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import type { Locale } from "@/lib/i18n/config";

// Track and lesson titles in the viewer's language for the team pages
// (cached translations; English where a translation is not ready yet).

export interface LocalTitles {
  track: (id: string, fallback: string) => string;
  lesson: (trackId: string | null, lessonId: string | null, fallback: string) => string;
  /** id -> localized title, for passing to client components. */
  map: Record<string, string>;
}

export async function localTitles(locale: Locale, trackIds?: string[]): Promise<LocalTitles> {
  const sources = await loadTrackSources(trackIds ? { id: { in: trackIds } } : { status: "live" });
  const { texts } = await localizedTracks(sources, locale).catch(() => ({ texts: new Map() }));
  const byId = new Map(sources.map((s) => [s.id, texts.get(s.slug)]));
  const map: Record<string, string> = {};
  for (const s of sources) map[s.id] = byId.get(s.id)?.title ?? s.title;
  return {
    track: (id, fallback) => byId.get(id)?.title ?? fallback,
    lesson: (trackId, lessonId, fallback) => (trackId && lessonId ? byId.get(trackId)?.lessons[lessonId]?.title ?? fallback : fallback),
    map,
  };
}
