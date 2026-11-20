import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { getGrowthSettings } from "@/lib/growth/settings";
import { getCatalog, TYPE_LABEL } from "@/lib/growth/catalog";
import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "@/lib/growth/db";
import GrowthTabs from "../_components/GrowthTabs";
import { PageHeader } from "../_components/ui";
import ContentClient from "./ContentClient";

export const dynamic = "force-dynamic";

export default async function GrowthContentPage() {
  await requireGrowthAdminPage();
  await ensureGrowthTables();
  const [settings, catalog, kits, queued] = await Promise.all([
    getGrowthSettings(),
    getCatalog(),
    prisma.growthKit.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, slug: true, productKey: true, productType: true, productTitle: true, language: true, audienceId: true, warnings: true, createdAt: true },
    }),
    prisma.growthPost.groupBy({ by: ["kitId"], where: { kitId: { not: null } }, _count: { _all: true } }),
  ]);
  const q = new Map(queued.map((r) => [r.kitId, r._count._all]));
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Product marketing kits"
        subtitle="Pick anything you sell. One click writes positioning, hero copy, 10 platform-native posts, a 3-email launch sequence, 3 ads, a reel script and a 2-week calendar from the product's own data. Review, edit, then queue."
      />
      <GrowthTabs />
      <ContentClient
        catalog={catalog}
        types={TYPE_LABEL}
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, language: a.language }))}
        defaultLanguage={settings.defaultLanguage}
        kits={kits.map((k) => ({
          id: k.id, slug: k.slug, productKey: k.productKey, productType: k.productType, productTitle: k.productTitle,
          language: k.language, audienceId: k.audienceId, createdAt: k.createdAt.toISOString(),
          warningCount: Array.isArray(k.warnings) ? k.warnings.length : 0, queued: q.get(k.id) ?? 0,
        }))}
      />
    </div>
  );
}
