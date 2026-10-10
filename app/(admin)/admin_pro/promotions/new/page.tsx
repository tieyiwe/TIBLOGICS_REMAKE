import { PageHeader } from "@/components/admin/ui";
import PromotionEditor from "../_components/PromotionEditor";
import { requirePromotionsPage, scopeOptions } from "../_components/data";

export const dynamic = "force-dynamic";

export default async function NewPromotionPage() {
  await requirePromotionsPage();
  const { tracks, products } = await scopeOptions();
  return (
    <div>
      <PageHeader
        title="New promotion"
        subtitle="Save a draft, or publish to make it live at once."
        breadcrumb={[{ label: "Promotions", href: "/admin_pro/promotions" }, { label: "New" }]}
      />
      <PromotionEditor promotion={null} tracks={tracks} products={products} />
    </div>
  );
}
