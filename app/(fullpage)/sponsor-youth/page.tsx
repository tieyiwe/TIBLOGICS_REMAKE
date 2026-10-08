import type { Metadata } from "next";
import Link from "next/link";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ClientMessages from "@/components/i18n/ClientMessages";
import SponsorFlow from "@/components/learn/youth/SponsorFlow";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { trackPriceCents } from "@/lib/learn/pricing";
import { trackMonthlyCents } from "@/lib/learn/track-monthly";
import { YOUTH_EXPLORER, YOUTH_SLUGS, isYouthSlug } from "@/lib/learn/youth";
import { sponsorSiblingPct } from "@/lib/learn/youth-sponsor";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.youth.sponsor.metaTitle"), description: t("learn.youth.sponsor.intro"), robots: { index: true, follow: true } };
}

// "Sponsor a young person": anybody pays for a place in AI-Empowered Youth
// (components/learn/youth/SponsorFlow.tsx, app/api/learn/youth/sponsor).
// Prices shown here are display only; the server computes them again.
export default async function SponsorYouthPage({ searchParams }: { searchParams: Promise<{ lane?: string; cancelled?: string }> }) {
  const sp = await searchParams;
  const [t, locale, student] = await Promise.all([getT(), getLocale(), getStudent()]);
  await ensureLearnEditColumns().catch(() => {});
  const tracks = await prisma.learnTrack
    .findMany({ where: { slug: { in: [...YOUTH_SLUGS] } }, select: { slug: true, title: true, level: true, priceCents: true, status: true } })
    .catch(() => []);
  const lanes = YOUTH_SLUGS.map((slug) => tracks.find((x) => x.slug === slug))
    .filter((x): x is NonNullable<typeof x> => !!x && x.status === "live")
    .map((x) => ({ slug: x.slug, title: x.title, lifetimeCents: trackPriceCents(x.level, x.priceCents), monthlyCents: trackMonthlyCents(x.slug) ?? 0 }));
  // A signed-in sponsor already paying for a child sees the sibling discount now.
  const siblingPct = student ? await sponsorSiblingPct(student.email, "") : 0;

  return (
    <ClientMessages area="learn">
      <div className="min-h-screen bg-[var(--s2)]">
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/learning-box"><ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} /></Link>
            <LanguageSwitcher />
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-xl px-4 py-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">{t("learn.youth.program")}</p>
          <h1 className="mt-1 text-2xl font-black text-[var(--ink)] sm:text-3xl">{t("learn.youth.sponsor.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.youth.sponsor.intro")}</p>
          {sp.cancelled === "1" && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t("learn.youth.sponsor.cancelled")}</p>}
          {lanes.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--ink2)]">{t("learn.youth.sponsor.unavailable")}</p>
          ) : (
            <SponsorFlow
              lanes={lanes}
              initialLane={isYouthSlug(sp.lane) ? sp.lane! : YOUTH_EXPLORER}
              locale={locale}
              sponsor={student ? { name: student.name, email: student.email } : null}
              siblingPct={siblingPct}
            />
          )}
        </main>
      </div>
    </ClientMessages>
  );
}
