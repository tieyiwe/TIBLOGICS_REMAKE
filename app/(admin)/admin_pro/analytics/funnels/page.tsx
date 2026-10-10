import { redirect } from "next/navigation";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { PageHeader } from "@/components/admin/ui";
import { filterQuery, fmtDay, parseFilters } from "@/lib/analytics/filters";
import { biggestLeak, getFunnels } from "@/lib/analytics/funnels";
import { knownSources } from "@/lib/analytics/acquisition";
import { splits } from "@/lib/analytics/usage";
import { FilterBar, Panel, Trend } from "../kit";
import { AnalyticsTabs } from "../tabs";

export const dynamic = "force-dynamic";

// Funnels: services, scanner, ARFA, store and youth, step by step, with the
// conversion from each step and where people drop off. Filter by source,
// device and country. Visitor analytics permission (counts only, no money).

const BASE = "/admin_pro/analytics/funnels";
const int = (n: number) => n.toLocaleString("en-US");

export default async function FunnelsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  if (!can(session.user, "analytics")) redirect("/admin_pro/no-access");
  const f = parseFilters(await searchParams);
  const qs = filterQuery(f);
  const [funnels, split, sources] = await Promise.all([getFunnels(f), splits(f), knownSources()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funnels"
        subtitle={<>Each step, the share that continued from the step before, and the drop-off, {fmtDay(f.from)} to {fmtDay(new Date(f.to.getTime() - 1))} (UTC). Visits are sessions; later steps are real records (bookings, scans, sign-ups, payments).</>}
        className="mb-0"
      />
      <AnalyticsTabs active={BASE} viewer={session.user} qs={qs} />
      <FilterBar base={BASE} f={f} show={["custom", "device", "country", "source"]} ranges={[7, 30, 90, 365]} countries={split.countries.map((c) => c.key).filter((c) => c !== "??")} sources={sources} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        {funnels.map((fn) => {
          const top = fn.steps[0]?.n ?? 0;
          const leak = biggestLeak(fn);
          return (
            <Panel
              key={fn.key}
              id={`f-${fn.key}`}
              title={fn.label}
              subtitle={fn.note}
              csvHref={`/api/admin/analytics/data/export${qs ? `${qs}&` : "?"}section=funnels`}
            >
              <ol className="space-y-3" data-testid={`funnel-${fn.key}`}>
                {fn.steps.map((s, i) => {
                  const before = i ? fn.steps[i - 1].n : null;
                  const rate = before ? Math.min(1, s.n / before) : null;
                  const width = top ? Math.max(2, Math.min(100, (s.n / top) * 100)) : 0;
                  const isLeak = leak && leak.to.key === s.key;
                  return (
                    <li key={s.key} className="font-dm text-sm">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 text-[var(--a-ink-2)]">
                          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--a-surface-2)] text-[11px] font-semibold text-[var(--a-ink-3)]">{i + 1}</span>
                          {s.label}
                          {s.kind === "records" && <span className="ml-1 text-[11px] text-[var(--a-ink-3)]">(records)</span>}
                        </span>
                        <span className="shrink-0 text-right tabular-nums">
                          <span className="font-semibold text-[var(--a-ink)]" data-testid={`step-${fn.key}-${s.key}`}>{int(s.n)}</span>{" "}
                          <span className="text-xs"><Trend cur={s.n} prev={s.prev} /></span>
                        </span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[var(--a-surface-2)]">
                        <div className="h-full rounded-full" style={{ width: `${width}%`, background: isLeak ? "#D92D20" : i === 0 ? "#1B3A6B" : "#2251A3" }} />
                      </div>
                      {rate != null && (
                        <p className={`mt-1 text-[11px] ${isLeak ? "font-semibold text-[var(--a-danger)]" : "text-[var(--a-ink-3)]"}`}>
                          {Math.round(rate * 100)}% continued · {int(Math.max(0, (before ?? 0) - s.n))} dropped off{isLeak ? " · biggest leak" : ""}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
              {top > 0 && (
                <p className="mt-4 font-dm text-xs text-[var(--a-ink-3)]">
                  End to end: {int(fn.steps[fn.steps.length - 1].n)} of {int(top)} ({Math.round((fn.steps[fn.steps.length - 1].n / top) * 1000) / 10}%).
                </p>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
