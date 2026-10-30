import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { statsFor } from "@/lib/growth/acquire/stats";
import { getCatalog, TYPE_LABEL } from "@/lib/growth/catalog";
import { getGrowthSettings } from "@/lib/growth/settings";
import AcquireNav from "../_components/AcquireNav";
import MagnetsClient from "./MagnetsClient";

export const dynamic = "force-dynamic";

export default async function MagnetsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireGrowthAdminPage();
  await ensureAcquireTables();
  const sp = await searchParams;
  const [rows, catalog, settings] = await Promise.all([
    prisma.acquireMagnet.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    getCatalog(),
    getGrowthSettings(),
  ]);
  const stats = await statsFor("magnet", rows);
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <AcquireNav />
      <MagnetsClient
        openNew={sp.new === "1"}
        magnets={rows.map((m) => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          type: m.type,
          status: m.status,
          language: m.language,
          updatedAt: m.updatedAt.toISOString(),
          stats: stats.get(m.id)!,
        }))}
        products={catalog
          .filter((c) => c.type !== "article" && c.type !== "event" && c.type !== "live")
          .map((c) => ({ key: c.key, label: c.title, group: TYPE_LABEL[c.type] }))}
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, language: a.language }))}
      />
    </div>
  );
}
