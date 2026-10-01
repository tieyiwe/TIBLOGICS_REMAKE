import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { getCatalogItem, TYPE_LABEL, type CatalogType } from "@/lib/growth/catalog";
import { getGrowthSettings } from "@/lib/growth/settings";
import { normalizeKit } from "@/lib/growth/content/kit-types";
import { listPosts } from "@/lib/growth/content/posts";
import { siteUrl } from "@/lib/growth/links";
import GrowthTabs from "../../_components/GrowthTabs";
import { PageHeader } from "../../_components/ui";
import KitEditor from "./KitEditor";

export const dynamic = "force-dynamic";

export default async function KitPage({ params }: { params: Promise<{ id: string }> }) {
  await requireGrowthAdminPage();
  await ensureGrowthTables();
  const { id } = await params;
  const kit = await prisma.growthKit.findUnique({ where: { id } });
  if (!kit) notFound();
  const [item, settings, posts] = await Promise.all([getCatalogItem(kit.productKey), getGrowthSettings(), listPosts({ kitId: id })]);
  const audience = settings.audiences.find((a) => a.id === kit.audienceId);
  return (
    <div className="space-y-5 max-w-[1400px]">
      <GrowthTabs />
      <Link href="/admin_pro/growth/content" className="font-dm text-sm text-[#2251A3] hover:underline">← All kits</Link>
      <PageHeader
        title={kit.productTitle}
        subtitle={`${TYPE_LABEL[kit.productType as CatalogType] ?? kit.productType} · ${kit.language.toUpperCase()}${audience ? ` · ${audience.name}` : ""} · campaign “${kit.slug}” · created ${kit.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}`}
      />
      <KitEditor
        kit={{ id: kit.id, slug: kit.slug, productUrl: kit.productUrl, language: kit.language, content: normalizeKit(kit.content), warnings: (kit.warnings as string[]) ?? [] }}
        facts={item?.facts ?? []}
        site={siteUrl()}
        initialPosts={posts}
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, language: a.language }))}
      />
    </div>
  );
}
