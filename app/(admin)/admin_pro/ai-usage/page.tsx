import { can } from "@/lib/admin/permissions";
import { redirect } from "next/navigation";
import { Gauge } from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { ensureAiUsageTable } from "@/lib/ai-usage";
import { ROUTES, routeFor, type AiTask } from "@/lib/claude";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// Claude API spend over the last 30 days, from the AiUsage log written by
// lib/claude.ts on every call. Costs are estimates at list prices (cache
// reads 0.1x, cache writes 1.25x, batch results half price); the Anthropic
// Console has the billed figure.

interface ByTaskRow {
  task: string;
  model: string;
  calls: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cents: number;
  truncated: number;
  batched: number;
}
interface DailyRow {
  day: Date;
  calls: number;
  cents: number;
}
interface LearnerRow {
  studentId: string;
  calls: number;
  cents: number;
}

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: cents < 100 ? 4 : 2 })}`;
const num = (n: number) => n.toLocaleString("en-US");

async function load() {
  await ensureAiUsageTable();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [byTask, daily, learners] = await Promise.all([
    prisma.$queryRawUnsafe<ByTaskRow[]>(
      `SELECT "task", "model",
              COUNT(*)::float8 AS "calls",
              COALESCE(SUM("inputTokens"), 0)::float8 AS "input",
              COALESCE(SUM("outputTokens"), 0)::float8 AS "output",
              COALESCE(SUM("cacheReadTokens"), 0)::float8 AS "cacheRead",
              COALESCE(SUM("cacheWriteTokens"), 0)::float8 AS "cacheWrite",
              COALESCE(SUM("costCents"), 0)::float8 AS "cents",
              COUNT(*) FILTER (WHERE "stopReason" = 'max_tokens')::float8 AS "truncated",
              COUNT(*) FILTER (WHERE "batch")::float8 AS "batched"
         FROM "AiUsage" WHERE "createdAt" >= $1
        GROUP BY "task", "model" ORDER BY "cents" DESC`,
      since,
    ),
    prisma.$queryRawUnsafe<DailyRow[]>(
      `SELECT date_trunc('day', "createdAt") AS "day", COUNT(*)::float8 AS "calls", COALESCE(SUM("costCents"), 0)::float8 AS "cents"
         FROM "AiUsage" WHERE "createdAt" >= $1
        GROUP BY 1 ORDER BY 1 DESC`,
      since,
    ),
    prisma.$queryRawUnsafe<LearnerRow[]>(
      `SELECT "studentId", COUNT(*)::float8 AS "calls", COALESCE(SUM("costCents"), 0)::float8 AS "cents"
         FROM "AiUsage" WHERE "createdAt" >= $1 AND "studentId" IS NOT NULL
        GROUP BY 1 ORDER BY 3 DESC LIMIT 10`,
      since,
    ),
  ]);
  return { byTask, daily, learners };
}

export default async function AiUsagePage() {
  const session = await requireAdminPage();
  // Spend data: owners and admins only, like Settings.
  if (!can(session.user, "ai_usage")) redirect("/admin_pro/no-access");

  let data: Awaited<ReturnType<typeof load>> | null = null;
  try {
    data = await load();
  } catch (err) {
    console.error("[admin/ai-usage]", err instanceof Error ? err.message : err);
  }

  const rows = data?.byTask ?? [];
  const total = rows.reduce((a, r) => a + r.cents, 0);
  const calls = rows.reduce((a, r) => a + r.calls, 0);
  const input = rows.reduce((a, r) => a + r.input + r.cacheRead + r.cacheWrite, 0);
  const cacheRead = rows.reduce((a, r) => a + r.cacheRead, 0);
  const maxDay = Math.max(1, ...(data?.daily ?? []).map((d) => d.cents));

  // Totals by task (all models together).
  const taskTotals = new Map<string, { calls: number; cents: number }>();
  for (const r of rows) {
    const t = taskTotals.get(r.task) ?? { calls: 0, cents: 0 };
    t.calls += r.calls;
    t.cents += r.cents;
    taskTotals.set(r.task, t);
  }

  const card = "min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]";
  const th = "py-2 pr-4 font-semibold";

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI usage"
        subtitle="Claude API calls over the last 30 days, by task and model. Costs are estimates at list prices; the Anthropic Console shows the billed amount."
        className="mb-0"
      />

      {!data && (
        <p className={`${card} font-dm text-sm text-[#B42318]`}>The usage log could not be read. Check the server log.</p>
      )}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estimated spend, 30 days" value={usd(total)} tone="orange" />
        <StatCard label="Calls" value={num(calls)} />
        <StatCard label="Average per call" value={calls ? usd(total / calls) : "None"} />
        <StatCard label="Input served from cache" value={input ? `${Math.round((cacheRead / input) * 100)}%` : "None"} tone="success" />
      </div>

      <div className={card}>
        <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">By task and model</h3>
        {rows.length === 0 ? (
          <EmptyState icon={Gauge} title="No calls logged in the last 30 days" body="Claude calls from the site, Learn and Growth are logged here as they happen." compact />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm font-dm">
              <thead>
                <tr className="border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                  <th className={th}>Task</th>
                  <th className={th}>Model</th>
                  <th className={`${th} text-right`}>Calls</th>
                  <th className={`${th} text-right`}>Input</th>
                  <th className={`${th} text-right`}>Cache read / write</th>
                  <th className={`${th} text-right`}>Output</th>
                  <th className={`${th} text-right`}>Cut off</th>
                  <th className="py-2 text-right font-semibold">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.task}|${r.model}`} className="border-b border-[var(--a-border)] last:border-0 hover:bg-[#f8fafd]">
                    <td className="py-2.5 pr-4 font-medium text-[var(--a-ink)]">
                      {r.task}
                      {r.batched > 0 && <span className="ml-1 text-xs text-[var(--a-ink-3)]">({num(r.batched)} batch)</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--a-ink-2)]">{r.model}</td>
                    <td className="py-2.5 pr-4 text-right text-[var(--a-ink-2)]">{num(r.calls)}</td>
                    <td className="py-2.5 pr-4 text-right text-[var(--a-ink-2)]">{num(r.input)}</td>
                    <td className="py-2.5 pr-4 text-right text-[var(--a-ink-2)]">
                      {num(r.cacheRead)} / {num(r.cacheWrite)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-[var(--a-ink-2)]">{num(r.output)}</td>
                    <td className={`py-2.5 pr-4 text-right ${r.truncated ? "text-[#B42318]" : "text-[var(--a-ink-3)]"}`}>
                      {r.truncated ? `${Math.round((r.truncated / r.calls) * 100)}%` : "0"}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[var(--a-ink)]">{usd(r.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Daily totals</h3>
          {(data?.daily ?? []).length === 0 ? (
            <p className="py-8 text-center font-dm text-sm text-[var(--a-ink-3)]">Nothing yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data!.daily.map((d) => (
                <li key={new Date(d.day).toISOString()} className="font-dm text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--a-ink-2)]">
                      {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                      <span className="ml-2 text-xs text-[var(--a-ink-3)]">{num(d.calls)} calls</span>
                    </span>
                    <span className="font-semibold text-[var(--a-ink)]">{usd(d.cents)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[#F4F7FB] overflow-hidden">
                    <div className="h-full rounded-full bg-[#2251A3]" style={{ width: `${(d.cents / maxDay) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div className={card}>
            <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">By task</h3>
            <ul className="mt-4 space-y-1.5 font-dm text-sm">
              {[...taskTotals.entries()]
                .sort((a, b) => b[1].cents - a[1].cents)
                .map(([task, v]) => (
                  <li key={task} className="flex justify-between">
                    <span className="text-[var(--a-ink-2)]">
                      {task} <span className="text-xs text-[var(--a-ink-3)]">{num(v.calls)} calls</span>
                    </span>
                    <span className="font-semibold text-[var(--a-ink)]">{usd(v.cents)}</span>
                  </li>
                ))}
              {taskTotals.size === 0 && <li className="text-[var(--a-ink-3)]">Nothing yet.</li>}
            </ul>
          </div>

          <div className={card}>
            <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Top learners by spend</h3>
            <ul className="mt-4 space-y-1.5 font-dm text-sm">
              {(data?.learners ?? []).map((l) => (
                <li key={l.studentId} className="flex justify-between">
                  <span className="text-[var(--a-ink-2)] font-mono text-xs">
                    {l.studentId} <span className="font-dm text-[var(--a-ink-3)]">{num(l.calls)} calls</span>
                  </span>
                  <span className="font-semibold text-[var(--a-ink)]">{usd(l.cents)}</span>
                </li>
              ))}
              {(data?.learners ?? []).length === 0 && <li className="text-[var(--a-ink-3)]">Nothing yet.</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">Current routing</h3>
        <p className="mt-1 font-dm text-xs text-[var(--a-ink-3)]">
          From lib/claude.ts, with environment overrides applied (CLAUDE_MODEL_&lt;TASK&gt;, CLAUDE_THINKING_&lt;TASK&gt;,
          CLAUDE_EFFORT_&lt;TASK&gt;, CLAUDE_MAX_TOKENS_&lt;TASK&gt;).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-dm">
            <thead>
              <tr className="border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                <th className={th}>Task</th>
                <th className={th}>Model</th>
                <th className={th}>Thinking</th>
                <th className={th}>Effort</th>
                <th className={`${th} text-right`}>max_tokens</th>
                <th className="py-2 font-semibold">Prompt cache</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(ROUTES) as AiTask[]).map((task) => {
                const r = routeFor(task);
                return (
                  <tr key={task} className="border-b border-[var(--a-border)] last:border-0 hover:bg-[#f8fafd]">
                    <td className="py-2 pr-4 font-medium text-[var(--a-ink)]">{task}</td>
                    <td className="py-2 pr-4 text-[var(--a-ink-2)]">{r.model}</td>
                    <td className="py-2 pr-4 text-[var(--a-ink-2)]">{r.thinking ?? "model default"}</td>
                    <td className="py-2 pr-4 text-[var(--a-ink-2)]">{r.effort ?? "default"}</td>
                    <td className="py-2 pr-4 text-right text-[var(--a-ink-2)]">{num(r.maxTokens)}</td>
                    <td className="py-2 text-[var(--a-ink-2)]">
                      {[r.cacheSystem && "system", r.cacheHistory && "history"].filter(Boolean).join(" + ") || "off"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
