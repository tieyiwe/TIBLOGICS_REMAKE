import type { Locale } from "@/lib/i18n/config";
import { loadTrackSources, localizedTracks, type TrackText } from "@/lib/i18n/sources/learn";

/** Track, module and lesson titles in the reader's language, by track id. */
export async function trackTexts(ids: string[], locale: Locale): Promise<Map<string, TrackText & { slug: string }>> {
  const out = new Map<string, TrackText & { slug: string }>();
  if (ids.length === 0) return out;
  const sources = await loadTrackSources({ id: { in: ids } });
  const { texts } = await localizedTracks(sources, locale).catch(() => ({ texts: new Map<string, TrackText>() }));
  for (const s of sources) {
    const text = texts.get(s.slug);
    if (text) out.set(s.id, { ...text, slug: s.slug });
  }
  return out;
}
