import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { acquireLabels } from "@/lib/growth/acquire/labels";
import { recentCaptures, statsFor } from "@/lib/growth/acquire/stats";
import { normalizePage } from "@/lib/growth/acquire/types";
import { getCatalog, TYPE_LABEL } from "@/lib/growth/catalog";
import { getGrowthSettings } from "@/lib/growth/settings";
import { shortUrl, siteUrl } from "@/lib/growth/links";
import type { Locale } from "@/lib/i18n/config";
import AcquireNav from "../../_components/AcquireNav";
import PageEditor from "./PageEditor";

export const dynamic = "force-dynamic";

export default async function LandingPageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireGrowthAdminPage();
  await ensureAcquireTables();
  const { id } = await params;
  const p = await prisma.acquirePage.findUnique({ where: { id } });
  if (!p) notFound();
  const [stats, recent, catalog, settings] = await Promise.all([
    statsFor("page", [p]),
    recentCaptures(10, { refType: "page", refId: p.id }),
    getCatalog(),
    getGrowthSettings(),
  ]);
  // Preview labels in every language, so switching the page language updates the preview.
  const labels = Object.fromEntries((["en", "fr", "sw"] as Locale[]).map((l) => [l, acquireLabels(l)]));
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AcquireNav />
      <PageEditor
        site={siteUrl()}
        initial={{
          id: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
          language: p.language,
          productKey: p.productKey ?? "",
          noindex: p.noindex,
          content: normalizePage(p.content),
          shortLink: p.linkCode ? shortUrl(p.linkCode) : null,
          fromKit: !!p.kitId,
        }}
        stats={stats.get(p.id)!}
        recent={recent}
        products={catalog
          .filter((c) => c.type !== "article" && c.type !== "event" && c.type !== "live")
          .map((c) => ({ key: c.key, label: c.title, group: TYPE_LABEL[c.type], url: c.url }))}
        proofPoints={settings.proofPoints}
        labels={labels}
      />
    </div>
  );
}
