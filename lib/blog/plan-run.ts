// Topic selection for the AI Times news agent (app/api/blog/auto-refresh).
// Pure function, kept out of the route so it can be tested on its own.

export type GenItem = { title: string; category: string; url?: string; sourceLabel: string };
export type NewsItem = { title: string; url?: string; source: string };

/**
 * Share of a run that may go to advanced tech (chips, quantum, robotics,
 * space, biotech, energy...). AI stays the main subject of AI Times.
 */
export const ADVANCED_TECH_SHARE = 0.3;

/**
 * Which items a run writes about, in order. AI news leads; advanced-tech news
 * takes up to ADVANCED_TECH_SHARE of the run; evergreen topic-bank pieces only
 * fill what real news could not, with advanced-tech explainers counted against
 * the same cap.
 */
export function planRun({
  want, aiNews, advancedNews, topicBank, isKnown,
}: {
  want: number;
  aiNews: NewsItem[];
  advancedNews: NewsItem[];
  topicBank: GenItem[];
  isKnown: (item: NewsItem) => boolean;
}): GenItem[] {
  const advCap = Math.max(1, Math.round(want * ADVANCED_TECH_SHARE));
  const seen = new Set<string>();
  const fresh = (list: NewsItem[]) =>
    list.filter((i) => {
      const key = (i.url ?? i.title).toLowerCase();
      if (seen.has(key) || isKnown(i)) return false;
      seen.add(key);
      return true;
    });

  const adv = fresh(advancedNews).slice(0, advCap);
  const ai = fresh(aiNews).slice(0, want - adv.length);
  const toItem = (i: NewsItem): GenItem => ({ title: i.title, category: "", url: i.url, sourceLabel: i.source });

  // Interleave so a run that stops early still has both kinds.
  const news: GenItem[] = [];
  const step = adv.length > 0 ? Math.max(1, Math.ceil(ai.length / adv.length)) : Infinity;
  let ia = 0;
  for (const a of ai) {
    news.push(toItem(a));
    if ((news.length - ia) % step === 0 && ia < adv.length) news.push(toItem(adv[ia++]));
  }
  while (ia < adv.length) news.push(toItem(adv[ia++]));

  // News first; evergreen topics only make up the shortfall. If neither can
  // fill the run, publish fewer articles rather than repeating old ones.
  let advUsed = adv.length;
  const out = news.slice(0, want);
  for (const t of topicBank) {
    if (out.length >= want) break;
    if (t.category === "advanced-tech") {
      if (advUsed >= advCap) continue;
      advUsed++;
    }
    out.push(t);
  }
  return out;
}
