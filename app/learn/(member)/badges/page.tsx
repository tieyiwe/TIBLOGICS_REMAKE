import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStudent } from "@/lib/learn/session";
import { skillBadgeShelf, type ShelfBadge, type ReqProgress } from "@/lib/learn/skill-badges/engine";
import { CAPSTONE_DISTINCTION_SCORE, FAMILY_LABEL_EN, type SkillBadgeFamily } from "@/lib/learn/skill-badges/catalog";
import { badgeSvg } from "@/lib/learn/skill-badges/svg";
import { siteBase } from "@/lib/learn/skill-badges/signing";
import SkillBadgeCard, { type CardData, type CardReq } from "@/components/learn/badges/SkillBadgeCard";
import { fmtDate } from "@/lib/learn/format";
import { getLocale, getT, type T } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("badges.meta.title") };
}

function reqLabel(t: T, r: ReqProgress): CardReq["label"] {
  switch (r.kind) {
    case "quiz":
      return t("badges.req.quiz");
    case "lab":
      return t("badges.req.lab");
    case "labs":
      return t("badges.req.labs", { n: r.need });
    case "quizzes":
      return t("badges.req.quizzes", { n: r.need });
    case "challenges":
      return t("badges.req.challenges");
    case "capstone":
      return t("badges.req.capstone", { n: CAPSTONE_DISTINCTION_SCORE });
    default:
      return t("badges.req.tracks", { n: r.need });
  }
}

export default async function SkillBadgesPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [{ badges, tracks }, t, locale] = await Promise.all([skillBadgeShelf(student.id), getT(), getLocale()]);

  // Track and module titles in the learner's language (English until cached).
  const sources = locale === "en" ? [] : await loadTrackSources({ slug: { in: [...tracks.keys()] } });
  const { texts } = await localizedTracks(sources, locale);
  const moduleTitle = new Map<string, string>();
  for (const s of sources) {
    const tx = texts.get(s.slug);
    if (!tx) continue;
    for (const m of s.modules) moduleTitle.set(`${s.slug}\u0000${m.title}`, tx.modules[m.id]?.title ?? m.title);
  }
  const trackTitle = (slug: string) => texts.get(slug)?.title ?? tracks.get(slug)?.title ?? slug;

  const base = siteBase();
  const card = (b: ShelfBadge, compact = false): CardData => {
    let title = b.name;
    let description = b.description;
    if (b.family === "skill") {
      const slug = b.key.slice("skill:".length);
      title = t(`badges.skill.${slug}.name`);
      description = t(`badges.skill.${slug}.desc`);
    } else if (b.family === "studio" && b.subject) {
      title = t(`studio.${b.subject}.name`);
      description = "";
    } else if (b.family === "module" && b.trackSlug) {
      title = moduleTitle.get(`${b.trackSlug}\u0000${b.name}`) ?? b.name;
      description = "";
    } else if (b.family === "capstone" && b.trackSlug) {
      title = trackTitle(b.trackSlug);
      description = "";
    }
    const parts = b.reqs.map((r) => (r.need > 0 ? Math.min(1, r.have / r.need) : 0));
    return {
      key: b.key,
      svg: badgeSvg({ glyph: b.glyph, kicker: FAMILY_LABEL_EN[b.family], name: b.name, idSuffix: b.key.replace(/[^a-z0-9]/gi, "") }),
      kicker: t(`badges.family.${b.family}`),
      title,
      description,
      progress: b.earned ? 1 : parts.length ? parts.reduce((x, y) => x + y, 0) / parts.length : 0,
      reqs: b.reqs.map((r) => ({
        label: reqLabel(t, r),
        have: r.have,
        need: r.need,
        counted: r.kind !== "quiz" && r.kind !== "lab" && r.kind !== "capstone",
        items: r.items.map((i) => ({
          title: moduleTitle.get(`${i.trackSlug}\u0000${i.title}`) ?? i.title,
          done: i.done,
          track: b.family === "skill" ? trackTitle(i.trackSlug) : undefined,
        })),
      })),
      award: b.award
        ? {
            id: b.award.id,
            issuedLabel: fmtDate(b.award.issuedAt, locale),
            issuedAt: b.award.issuedAt.toISOString(),
            isPublic: b.award.isPublic,
            revoked: b.award.revoked,
            signed: b.award.signed,
            credentialName: b.name,
          }
        : null,
      extraLink: b.family === "studio" && b.subject ? { href: `/learn/studio/${b.subject}`, label: t("badges.studio.open") } : undefined,
      compact,
    };
  };

  const by = (f: SkillBadgeFamily) => badges.filter((b) => b.family === f);
  const earnedFirst = (a: ShelfBadge, b: ShelfBadge) => Number(!!b.award) - Number(!!a.award);
  const earnedCount = badges.filter((b) => b.award && !b.award.revoked).length;

  const moduleBadges = by("module");
  const moduleTracks = [...new Set(moduleBadges.map((b) => b.trackSlug!))].filter(
    (slug) => tracks.get(slug)?.live || moduleBadges.some((b) => b.trackSlug === slug && b.award),
  );
  const capstones = by("capstone").filter((b) => b.award || b.liveTrack);

  const Section = ({ id, title, blurb, children }: { id: string; title: string; blurb: string; children: React.ReactNode }) => (
    <section aria-labelledby={`sec-${id}`} className="mt-10">
      <h2 id={`sec-${id}`} className="text-lg font-black text-[#1B3A6B]">{title}</h2>
      <p className="mt-0.5 text-sm text-[var(--ink3)]">{blurb}</p>
      {children}
    </section>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-black text-[var(--ink)]">{t("badges.title")}</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">{t("badges.intro")}</p>
        </div>
        <p className="rounded-full bg-[#1B3A6B] px-4 py-1.5 text-sm font-bold text-white">
          {earnedCount === 1 ? t("badges.earnedOne") : t("badges.earnedCount", { n: earnedCount })}
        </p>
      </div>
      {earnedCount === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm text-[var(--ink2)]">{t("badges.empty")}</p>
      )}

      <Section id="skill" title={t("badges.section.skill")} blurb={t("badges.section.skill.blurb")}>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {by("skill").sort(earnedFirst).map((b) => (
            <SkillBadgeCard key={b.key} data={card(b)} siteBase={base} />
          ))}
        </div>
      </Section>

      <Section id="module" title={t("badges.section.module")} blurb={t("badges.section.module.blurb")}>
        <div className="mt-4 space-y-3">
          {moduleTracks.map((slug) => {
            const list = moduleBadges.filter((b) => b.trackSlug === slug);
            const got = list.filter((b) => b.award && !b.award.revoked).length;
            const active = list.some((b) => b.award || b.reqs.some((r) => r.have > 0));
            return (
              <details key={slug} open={active} className="rounded-2xl border border-[var(--border)] bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 text-sm font-bold text-[var(--ink)]">
                  <span>{trackTitle(slug)}</span>
                  <span className="text-xs font-semibold text-[var(--ink3)]">{t("badges.track.count", { n: got, total: list.length })}</span>
                </summary>
                <div className="grid gap-3 border-t border-[var(--border)] p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((b) => (
                    <SkillBadgeCard key={b.key} data={card(b, true)} siteBase={base} />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      <Section id="studio" title={t("badges.section.studio")} blurb={t("badges.section.studio.blurb")}>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {by("studio").sort(earnedFirst).map((b) => (
            <SkillBadgeCard key={b.key} data={card(b, true)} siteBase={base} />
          ))}
        </div>
      </Section>

      <Section id="capstone" title={t("badges.section.capstone")} blurb={t("badges.section.capstone.blurb", { n: CAPSTONE_DISTINCTION_SCORE })}>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capstones.sort(earnedFirst).map((b) => (
            <SkillBadgeCard key={b.key} data={card(b, true)} siteBase={base} />
          ))}
        </div>
      </Section>
    </div>
  );
}
