import { redirect } from "next/navigation";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { adminCounts, adminList, type AdminTab } from "@/lib/blog/engage/db";
import { MODERATE_PERMISSION } from "@/lib/blog/engage/identity";
import CommentsClient from "./CommentsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

const TABS: AdminTab[] = ["review", "reported", "published", "hidden"];

// Reader comments under AI Times articles (lib/blog/engage): approve held
// comments, pin, hide, delete, block. Reading needs "blog", changes need
// "blog:manage" (the API checks again).
export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireAdminPage();
  if (!can(session.user, "blog")) redirect("/admin_pro/no-access");
  const sp = await searchParams;
  const tab: AdminTab = (TABS as string[]).includes(sp.tab ?? "") ? (sp.tab as AdminTab) : "review";
  const [comments, counts] = await Promise.all([
    adminList(tab).catch((err) => {
      console.error("[admin/comments page]", err instanceof Error ? err.message : err);
      return [];
    }),
    adminCounts().catch(() => ({ review: 0, reported: 0, published: 0, hidden: 0 })),
  ]);
  return <CommentsClient tab={tab} comments={comments} counts={counts} canManage={can(session.user, MODERATE_PERMISSION)} />;
}
