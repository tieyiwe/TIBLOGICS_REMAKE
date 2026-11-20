import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { readCached } from "@/lib/i18n/sources/learn";
import { labFields, labKey } from "@/lib/i18n/sources/labs";
import type { RealCase } from "./cases";

// Where a case's "Practise it" link goes: its lab when that lab exists and is
// published (title in the learner's language when the translation is cached,
// never starting a translation), else the track page.

export interface CaseLab {
  href: string;
  /** Null when the link falls back to the track page. */
  title: string | null;
}

export async function caseLabs(cases: RealCase[], locale: Locale): Promise<Map<string, CaseLab>> {
  const slugs = [...new Set(cases.map((c) => c.labSlug).filter((s): s is string => !!s))];
  const labs = slugs.length
    ? await prisma.lab
        .findMany({
          where: { slug: { in: slugs }, isPublished: true },
          select: {
            slug: true, title: true, labType: true, briefMd: true, scenarioMd: true, objectives: true, config: true,
            track: { select: { slug: true } },
          },
        })
        .catch(() => [])
    : [];
  const cached = await readCached(locale, labs.map((l) => ({ key: labKey(l.slug), fields: labFields(l) })));
  const bySlug = new Map(labs.map((l) => [l.slug, l]));
  const out = new Map<string, CaseLab>();
  for (const c of cases) {
    const lab = c.labSlug ? bySlug.get(c.labSlug) : undefined;
    // A lab moved to another track would send the learner somewhere unrelated.
    if (lab && lab.track.slug === c.trackSlug) {
      out.set(c.id, { href: `/learn/lab/${lab.slug}`, title: cached.get(labKey(lab.slug))?.title || lab.title });
    } else {
      out.set(c.id, { href: `/learn/track/${c.trackSlug}`, title: null });
    }
  }
  return out;
}
