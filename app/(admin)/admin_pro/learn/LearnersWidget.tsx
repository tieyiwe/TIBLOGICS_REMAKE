import { Button, Card, StatCard } from "@/components/admin/ui";
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
    <Card
      title="Learners"
      padded
      action={
        <Button href="/admin_pro/learn/learners" variant="ghost" size="sm">
          All learners, plans and sign-ins
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-5">
        {tiles.map(([label, value, hint]) => (
          <StatCard key={label} label={label} value={value} hint={hint} className="shadow-none" />
        ))}
      </div>
    </Card>
  );
}
