import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { recentCaptures, statsFor } from "@/lib/growth/acquire/stats";
import { normalizeMagnet } from "@/lib/growth/acquire/types";
import { getCatalog, TYPE_LABEL } from "@/lib/growth/catalog";
import { shortUrl, siteUrl } from "@/lib/growth/links";
import AcquireNav from "../../_components/AcquireNav";
import MagnetEditor from "./MagnetEditor";

export const dynamic = "force-dynamic";

export default async function MagnetEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireGrowthAdminPage();
  await ensureAcquireTables();
  const { id } = await params;
  const m = await prisma.acquireMagnet.findUnique({ where: { id } });
  if (!m) notFound();
  const [stats, recent, catalog] = await Promise.all([statsFor("magnet", [m]), recentCaptures(10, { refType: "magnet", refId: m.id }), getCatalog()]);
  const links = [
    ...catalog.filter((c) => c.type === "tool" || c.type === "blueprint" || c.type === "learn-plan" || c.type === "track"),
    ...catalog.filter((c) => c.type === "article").slice(0, 12),
  ].map((c) => ({ href: c.url, label: `${c.title} (${TYPE_LABEL[c.type]})` }));
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <AcquireNav />
      <MagnetEditor
        site={siteUrl()}
        initial={{
          id: m.id,
          slug: m.slug,
          type: m.type,
          title: m.title,
          status: m.status,
          language: m.language,
          productKey: m.productKey ?? "",
          noindex: m.noindex,
          content: normalizeMagnet(m.content),
          shortLink: m.linkCode ? shortUrl(m.linkCode) : null,
        }}
        stats={stats.get(m.id)!}
        recent={recent}
        products={catalog.filter((c) => c.type !== "article" && c.type !== "event" && c.type !== "live").map((c) => ({ key: c.key, label: c.title, group: TYPE_LABEL[c.type] }))}
        links={links}
      />
    </div>
  );
}
