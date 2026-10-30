import { requireGrowthPage } from "@/lib/growth/outreach/auth";
import { ensureDefaultSequence } from "@/lib/growth/outreach/sequences";
import { MERGE_FIELDS } from "@/lib/growth/outreach/templates";
import OutreachClient from "./OutreachClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata = { title: "Outreach · Growth" };

export default async function GrowthOutreachPage() {
  const { canSend } = await requireGrowthPage();
  await ensureDefaultSequence().catch(() => {});
  return <OutreachClient canSend={canSend} mergeFields={MERGE_FIELDS} />;
}
