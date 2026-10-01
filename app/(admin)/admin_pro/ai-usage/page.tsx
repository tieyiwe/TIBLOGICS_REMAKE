import { redirect } from "next/navigation";
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
  if (!session.user?.isAdmin && !session.user?.isOwner) redirect("/admin_pro");

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

  const card = "bg-white border border-[#D2DCE8] rounded-2xl p-6";
  const th = "py-2 pr-4 font-semibold";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">AI usage</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
          Claude API calls over the last 30 days, by task and model. Costs are estimates at list prices; the Anthropic
          Console shows the billed amount.
        </p>
      </div>

      {!data && (
        <p className={`${card} font-dm text-sm text-[#B42318]`}>The usage log could not be read. Check the server log.</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Estimated spend, 30 days", usd(total)],
          ["Calls", num(calls)],
          ["Average per call", calls ? usd(total / calls) : "—"],
          ["Input served from cache", input ? `${Math.round((cacheRead / input) * 100)}%` : "—"],
        ].map(([label, value]) => (
          <div key={label} className={card}>
            <p className="font-dm text-xs uppercase tracking-wider text-[#7A8FA6]">{label}</p>
            <p className="mt-2 font-syne font-bold text-2xl text-[#0D1B2A]">{value}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        <h3 className="font-syne font-bold text-base text-[#0D1B2A]">By task and model</h3>
        {rows.length === 0 ? (
          <p className="py-8 text-center font-dm text-sm text-[#7A8FA6]">No calls logged in the last 30 days.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm font-dm">
              <thead>
                <tr className="border-b border-[#F4F7FB] text-left text-xs uppercase tracking-wider text-[#7A8FA6]">
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
                  <tr key={`${r.task}|${r.model}`} className="border-b border-[#F4F7FB] last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-[#0D1B2A]">
                      {r.task}
                      {r.batched > 0 && <span className="ml-1 text-xs text-[#7A8FA6]">({num(r.batched)} batch)</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-[#3A4A5C]">{r.model}</td>
                    <td className="py-2.5 pr-4 text-right text-[#3A4A5C]">{num(r.calls)}</td>
                    <td className="py-2.5 pr-4 text-right text-[#3A4A5C]">{num(r.input)}</td>
                    <td className="py-2.5 pr-4 text-right text-[#3A4A5C]">
                      {num(r.cacheRead)} / {num(r.cacheWrite)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-[#3A4A5C]">{num(r.output)}</td>
                    <td className={`py-2.5 pr-4 text-right ${r.truncated ? "text-[#B42318]" : "text-[#7A8FA6]"}`}>
                      {r.truncated ? `${Math.round((r.truncated / r.calls) * 100)}%` : "0"}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#0D1B2A]">{usd(r.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Daily totals</h3>
          {(data?.daily ?? []).length === 0 ? (
            <p className="py-8 text-center font-dm text-sm text-[#7A8FA6]">Nothing yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data!.daily.map((d) => (
                <li key={new Date(d.day).toISOString()} className="font-dm text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#3A4A5C]">
                      {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                      <span className="ml-2 text-xs text-[#7A8FA6]">{num(d.calls)} calls</span>
                    </span>
                    <span className="font-semibold text-[#0D1B2A]">{usd(d.cents)}</span>
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
            <h3 className="font-syne font-bold text-base text-[#0D1B2A]">By task</h3>
            <ul className="mt-4 space-y-1.5 font-dm text-sm">
              {[...taskTotals.entries()]
                .sort((a, b) => b[1].cents - a[1].cents)
                .map(([task, v]) => (
                  <li key={task} className="flex justify-between">
                    <span className="text-[#3A4A5C]">
                      {task} <span className="text-xs text-[#7A8FA6]">{num(v.calls)} calls</span>
                    </span>
                    <span className="font-semibold text-[#0D1B2A]">{usd(v.cents)}</span>
                  </li>
                ))}
              {taskTotals.size === 0 && <li className="text-[#7A8FA6]">Nothing yet.</li>}
            </ul>
          </div>

          <div className={card}>
            <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Top learners by spend</h3>
            <ul className="mt-4 space-y-1.5 font-dm text-sm">
              {(data?.learners ?? []).map((l) => (
                <li key={l.studentId} className="flex justify-between">
                  <span className="text-[#3A4A5C] font-mono text-xs">
                    {l.studentId} <span className="font-dm text-[#7A8FA6]">{num(l.calls)} calls</span>
                  </span>
                  <span className="font-semibold text-[#0D1B2A]">{usd(l.cents)}</span>
                </li>
              ))}
              {(data?.learners ?? []).length === 0 && <li className="text-[#7A8FA6]">Nothing yet.</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Current routing</h3>
        <p className="mt-1 font-dm text-xs text-[#7A8FA6]">
          From lib/claude.ts, with environment overrides applied (CLAUDE_MODEL_&lt;TASK&gt;, CLAUDE_THINKING_&lt;TASK&gt;,
          CLAUDE_EFFORT_&lt;TASK&gt;, CLAUDE_MAX_TOKENS_&lt;TASK&gt;).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm font-dm">
            <thead>
              <tr className="border-b border-[#F4F7FB] text-left text-xs uppercase tracking-wider text-[#7A8FA6]">
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
                  <tr key={task} className="border-b border-[#F4F7FB] last:border-0">
                    <td className="py-2 pr-4 font-medium text-[#0D1B2A]">{task}</td>
                    <td className="py-2 pr-4 text-[#3A4A5C]">{r.model}</td>
                    <td className="py-2 pr-4 text-[#3A4A5C]">{r.thinking ?? "model default"}</td>
                    <td className="py-2 pr-4 text-[#3A4A5C]">{r.effort ?? "—"}</td>
                    <td className="py-2 pr-4 text-right text-[#3A4A5C]">{num(r.maxTokens)}</td>
                    <td className="py-2 text-[#3A4A5C]">
                      {[r.cacheSystem && "system", r.cacheHistory && "history"].filter(Boolean).join(" + ") || "—"}
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
