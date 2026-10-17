import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { statsFor } from "@/lib/growth/acquire/stats";
import { getCatalog, TYPE_LABEL } from "@/lib/growth/catalog";
import { getGrowthSettings } from "@/lib/growth/settings";
import AcquireNav from "../_components/AcquireNav";
import PagesClient from "./PagesClient";

export const dynamic = "force-dynamic";

export default async function LandingPagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireGrowthAdminPage();
  await Promise.all([ensureAcquireTables(), ensureGrowthTables()]);
  const sp = await searchParams;
  const [rows, kits, catalog, settings] = await Promise.all([
    prisma.acquirePage.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.growthKit.findMany({ orderBy: { createdAt: "desc" }, take: 60, select: { id: true, productTitle: true, language: true, createdAt: true } }),
    getCatalog(),
    getGrowthSettings(),
  ]);
  const stats = await statsFor("page", rows);
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <AcquireNav />
      <PagesClient
        openNew={sp.new === "1"}
        presetKit={typeof sp.kit === "string" ? sp.kit : null}
        pages={rows.map((p) => ({ id: p.id, slug: p.slug, title: p.title, status: p.status, language: p.language, noindex: p.noindex, updatedAt: p.updatedAt.toISOString(), stats: stats.get(p.id)! }))}
        kits={kits.map((k) => ({ id: k.id, label: `${k.productTitle} (${k.language.toUpperCase()}, ${k.createdAt.toISOString().slice(0, 10)})` }))}
        products={catalog.filter((c) => c.type !== "article" && c.type !== "live").map((c) => ({ key: c.key, label: c.title, group: TYPE_LABEL[c.type] }))}
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
