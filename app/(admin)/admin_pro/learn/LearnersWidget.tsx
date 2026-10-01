import Link from "next/link";
import type { LearnerStats } from "@/lib/learn/admin/learners";

// Sign-ups, activity and conversion on the admin Learn page. A server
// component, handed to LearnAdminClient as a prop.
export default function LearnersWidget({ stats }: { stats: LearnerStats | null }) {
  if (!stats) return null;
  const rate = stats.signups30 ? Math.round((stats.converted30 / stats.signups30) * 100) : 0;
  const tiles: Array<[string, string | number, string?]> = [
    ["Sign-ups today", stats.signupsToday, "UTC day"],
    ["Sign-ups 7 days", stats.signups7],
    ["Sign-ups 30 days", stats.signups30],
    ["Active learners 7 days", stats.active7, "signed in, lesson or XP"],
    ["Converted to paid, 30 days", `${stats.converted30} · ${rate}%`, `of 30-day sign-ups · ${stats.newSubs30} new subs, ${stats.newPurchases30} track buys`],
  ];
  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[var(--ink)]">Learners</h2>
        <Link href="/admin_pro/learn/learners" className="text-xs font-semibold text-[var(--blue2)] underline">
          All learners, plans, progress and sign-ins →
        </Link>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(([label, value, hint]) => (
          <div key={label} className="rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{value}</p>
            {hint && <p className="mt-0.5 text-[11px] text-[var(--ink3)]">{hint}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
