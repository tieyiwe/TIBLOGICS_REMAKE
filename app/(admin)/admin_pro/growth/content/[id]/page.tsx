import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { getCatalogItem, TYPE_LABEL, type CatalogType } from "@/lib/growth/catalog";
import { getGrowthSettings } from "@/lib/growth/settings";
import { normalizeKit } from "@/lib/growth/content/kit-types";
import { listPosts } from "@/lib/growth/content/posts";
import { siteUrl } from "@/lib/growth/links";
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
    <div className="mx-auto max-w-[1600px] space-y-4">
      <PageHeader
        breadcrumb={[{ label: "Growth", href: "/admin_pro/growth" }, { label: "Content kits", href: "/admin_pro/growth/content" }, { label: kit.productTitle }]}
        title={kit.productTitle}
        subtitle={`${TYPE_LABEL[kit.productType as CatalogType] ?? kit.productType} · ${kit.language.toUpperCase()}${audience ? ` · ${audience.name}` : ""} · campaign "${kit.slug}" · created ${kit.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}`}
      />
      <KitEditor
        kit={{ id: kit.id, slug: kit.slug, productUrl: kit.productUrl, language: kit.language, content: normalizeKit(kit.content), warnings: (kit.warnings as string[]) ?? [] }}
        facts={item?.facts ?? []}
        site={siteUrl()}
        initialPosts={posts}
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, language: a.language }))}
        rules={{ proofPoints: settings.proofPoints, bannedClaims: settings.bannedClaims }}
        product={{ title: kit.productTitle, typeLabel: TYPE_LABEL[kit.productType as CatalogType] ?? kit.productType }}
      />
    </div>
  );
}
