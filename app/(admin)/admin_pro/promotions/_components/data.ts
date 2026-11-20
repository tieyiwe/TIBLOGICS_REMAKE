import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { trackPriceCents } from "@/lib/learn/pricing";

/** Team & Roles "promotions" (the same rule as the API; owner and admins always). */
export async function requirePromotionsPage(): Promise<Session> {
  const s = await requireAdminPage();
  if (!can(s.user, "promotions")) redirect("/admin_pro/no-access");
  return s;
}

export interface ScopeOption {
  id: string;
  label: string;
  hint: string;
}

/** Tracks and store products the editor can narrow a promotion to. */
export async function scopeOptions(): Promise<{ tracks: ScopeOption[]; products: ScopeOption[] }> {
  await ensureLearnEditColumns().catch(() => {});
  const [tracks, products] = await Promise.all([
    prisma.learnTrack
      .findMany({ select: { id: true, title: true, level: true, status: true, priceCents: true }, orderBy: { title: "asc" }, take: 300 })
      .catch(() => []),
    prisma.product
      .findMany({ select: { id: true, name: true, price: true, published: true }, orderBy: { name: "asc" }, take: 500 })
      .catch(() => []),
  ]);
  const usd = (c: number) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
  return {
    tracks: tracks.map((t) => ({ id: t.id, label: t.title, hint: `${usd(trackPriceCents(t.level, t.priceCents))}${t.status === "live" ? "" : ` · ${t.status}`}` })),
    products: products.map((p) => ({ id: p.id, label: p.name, hint: `${usd(p.price)}${p.published ? "" : " · unpublished"}` })),
  };
}
