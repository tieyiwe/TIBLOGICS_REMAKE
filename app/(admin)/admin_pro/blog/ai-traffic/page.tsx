import { requireAdminPage } from "../../_lib/admin-page-auth";
import { trafficEntries } from "@/lib/ai-traffic";
import TrafficEditor from "./TrafficEditor";

// AI vs Humans: the figures on the home page and /ai-vs-humans.

export const dynamic = "force-dynamic";

export default async function AiTrafficAdminPage() {
  await requireAdminPage();
  const entries = await trafficEntries();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-syne text-2xl font-bold text-[var(--a-ink)]">AI vs Humans</h1>
        <p className="mt-1 max-w-3xl font-dm text-sm text-[var(--a-ink-3)]">
          The share of web traffic made by bots and AI agents, shown on the home page and at <a href="/ai-vs-humans" target="_blank" className="text-[var(--a-blue)] hover:underline">/ai-vs-humans</a>.
          Add a reading once or twice a month from a published study (Cloudflare Radar, Imperva Bad Bot Report, HUMAN Security…). The newest
          date is shown first; older readings stay as history. Always link the source.
        </p>
      </div>
      <TrafficEditor initial={entries} />
    </div>
  );
}
