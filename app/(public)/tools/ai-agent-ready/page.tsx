import { getLocale } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/blueprint/config";
import { kitCents, reportCents } from "@/lib/agent-ready/prices";
import { KIT_RESCANS } from "@/lib/agent-ready/limits";
import AgentReadyLanding from "@/components/agent-ready/AgentReadyLanding";

// /tools/ai-agent-ready: prices come from the server's settings.

export default async function AgentReadyPage() {
  const locale = await getLocale();
  const money = (c: number | null) => (c ? formatMoney(c, locale) : null);
  return <AgentReadyLanding prices={{ report: money(reportCents()), kit: money(kitCents()) }} rescans={KIT_RESCANS} />;
}
