"use client";

import Link from "next/link";
import { AlertTriangle, Megaphone } from "lucide-react";
import { Avatar, Card, EmptyState } from "@/components/admin/ui";
import type { UpdateDTO } from "@/lib/admin/command-center/pm";
import { fmtDay, startOfWeek } from "@/lib/admin/command-center/dates";
import { CcShell, type ProjectLite } from "../_components/CcShell";
import { HealthBadge, type StaffLite } from "../_components/fields";
import { Markdown } from "../_components/Markdown";

type U = UpdateDTO & { projectName: string; projectColor: string };

export default function UpdatesClient({
  shell,
  updates,
  quiet,
}: {
  shell: { staff: StaffLite[]; viewerId: string; projects: ProjectLite[]; canFinance: boolean };
  updates: U[];
  quiet: Array<{ id: string; name: string; color: string; lastUpdateAt: string | null; text: string }>;
}) {
  const weeks = new Map<string, U[]>();
  for (const u of updates) {
    const w = startOfWeek(u.createdAt.slice(0, 10));
    weeks.set(w, [...(weeks.get(w) ?? []), u]);
  }
  return (
    <CcShell {...shell} title="Updates" subtitle="Weekly status updates from every project, newest first.">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {updates.length ? (
            [...weeks.entries()].map(([w, list]) => (
              <section key={w} aria-labelledby={`wk-${w}`}>
                <h2 id={`wk-${w}`} className="mb-2 font-syne text-[16px] font-bold text-[var(--a-ink)]">
                  Week of {fmtDay(w, { withYear: true })}
                </h2>
                <div className="space-y-3">
                  {list.map((u) => (
                    <article key={u.id} className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-card)]">
                      <header className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: u.projectColor }} aria-hidden />
                        <Link href={`/admin_pro/command-center/projects/${u.projectId}?tab=updates`} className="font-dm text-[14.5px] font-semibold text-[var(--a-ink)] hover:underline">
                          {u.projectName}
                        </Link>
                        <HealthBadge health={u.health} />
                        <span className="font-dm text-[12.5px] font-semibold tabular-nums text-[var(--a-ink-2)]">{u.progress}%</span>
                        <span className="ml-auto flex items-center gap-1.5 font-dm text-[12.5px] text-[var(--a-ink-3)]">
                          <Avatar name={u.authorName} size={20} /> {u.authorName} · {fmtDay(u.createdAt.slice(0, 10))}
                        </span>
                      </header>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Part title="Done" md={u.doneMd} />
                        <Part title="Next" md={u.nextMd} />
                        <Part title="Blockers" md={u.blockersMd} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <EmptyState icon={Megaphone} title="No updates in the last 8 weeks" body="Open a project and use Updates to post what is done, what is next and any blockers." />
          )}
        </div>
        <aside>
          <Card title="Quiet projects" icon={AlertTriangle} subtitle="Active, with no update in 14 days." padded={false}>
            {quiet.length ? (
              <ul className="divide-y divide-[var(--a-border)]">
                {quiet.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 px-5 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                    <Link href={`/admin_pro/command-center/projects/${p.id}?tab=updates`} className="min-w-0 flex-1 truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)] hover:underline">
                      {p.name}
                    </Link>
                    <span className="shrink-0 font-dm text-[12px] text-[var(--a-warn)]">{p.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 font-dm text-[13px] text-[var(--a-ink-3)]">Every active project has a recent update.</p>
            )}
          </Card>
        </aside>
      </div>
    </CcShell>
  );
}

function Part({ title, md }: { title: string; md: string }) {
  return (
    <div className="min-w-0">
      <p className="a-micro mb-1">{title}</p>
      {md.trim() ? <Markdown source={md} className="text-[13px]" /> : <p className="font-dm text-[13px] text-[var(--a-ink-3)]">None</p>}
    </div>
  );
}
