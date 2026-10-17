"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, CircleDollarSign, Gift, Link2, MousePointerClick, Share2, ShieldAlert, UserPlus, X } from "lucide-react";
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, Segmented, StatCard, Toolbar, useToast, type BadgeTone, type Column } from "@/components/admin/ui";
import type { AdminRewardRow } from "@/lib/learn/referrals/service";
import { api } from "../_components/form";

// Owner view of the ARFA learner referral program: the reward queue
// (approve grants the free month, reject, or mark a Stripe credit applied),
// the funnel, top referrers and sign-ups the fraud guards refused.

type Person = { id: string; email: string; name: string };
type Data = {
  totals: { links: number; visits: number; shares: number; signups: number; paid: number; rejected: number; pending: number; creditDue: number; granted: number };
  rewards: AdminRewardRow[];
  rejectedSignups: { id: string; reason: string | null; createdAt: string; referrer: Person; referred: Person }[];
  top: (Person & { signups: number; paid: number })[];
  cap: number;
  couponId: string | null;
};

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "warn" },
  capped: { label: "Over monthly cap", tone: "orange" },
  processing: { label: "Processing", tone: "info" },
  credit_due: { label: "Stripe credit due", tone: "info" },
  applied: { label: "Granted", tone: "success" },
  rejected: { label: "Rejected", tone: "neutral" },
};

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const money = (c: number | null) => (c == null ? "" : `$${(c / 100).toFixed(2)}`);

function Who({ p }: { p: Person }) {
  return (
    <span className="block min-w-0">
      <span className="block truncate font-semibold text-[var(--a-ink)]">{p.name || p.email}</span>
      {p.name ? <span className="block truncate text-[12px] text-[var(--a-ink-3)]">{p.email}</span> : null}
    </span>
  );
}

export default function ReferralsClient({ data }: { data: Data }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState(data.totals.pending || data.totals.creditDue ? "todo" : "all");
  const [busy, setBusy] = useState<string | null>(null);
  const t = data.totals;

  const rows = useMemo(() => {
    if (filter === "todo") return data.rewards.filter((r) => ["pending", "capped", "credit_due"].includes(r.status));
    if (filter === "done") return data.rewards.filter((r) => r.status === "applied" || r.status === "rejected");
    return data.rewards;
  }, [data.rewards, filter]);

  async function act(r: AdminRewardRow, action: "approve" | "reject" | "applied") {
    let note: string | null = null;
    if (action === "reject") {
      const v = window.prompt(`Reject the reward for ${r.referrer.email}? Add a short reason (optional).`, "");
      if (v === null) return;
      note = v;
    }
    if (action === "approve" && r.status === "capped" && !window.confirm(`${r.referrer.email} is over the monthly cap of ${data.cap}. Approve anyway?`)) return;
    setBusy(`${r.id}:${action}`);
    try {
      const out = await api<{ status: string; note?: string }>(`/api/admin/growth/acquire/referrals/${r.id}`, { body: { action, note } });
      toast.success(
        action === "approve" ? (out.status === "credit_due" ? "Approved: apply the credit in Stripe" : "Free month granted") : action === "reject" ? "Reward rejected" : "Marked as applied",
        out.note,
      );
      router.refresh();
    } catch (e) {
      toast.error("That did not work", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const cols: Column<AdminRewardRow>[] = [
    {
      key: "referrer",
      header: "Referrer earns, for friend",
      primary: true,
      render: (r) => (
        <span className="block min-w-0 max-w-[260px]">
          <Who p={r.referrer} />
          <span className="mt-1 block truncate text-[12px] text-[var(--a-ink-3)]">
            for {r.referred.name ? `${r.referred.name} (${r.referred.email})` : r.referred.email}
          </span>
        </span>
      ),
    },
    {
      key: "paid",
      header: "Paid for",
      hideOnMobile: true,
      render: (r) => (
        <span className="whitespace-nowrap">
          {r.payKind === "track" ? "A track" : r.payKind === "subscription" ? "Monthly plan" : "n/a"}
          {r.amountCents != null ? <span className="text-[var(--a-ink-3)]"> · {money(r.amountCents)}</span> : null}
          <span className="block text-[12px] tabular-nums text-[var(--a-ink-3)]">Earned {day(r.createdAt)}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className="block">
          <Badge tone={STATUS[r.status]?.tone ?? "neutral"} dot>{STATUS[r.status]?.label ?? r.status}</Badge>
          {r.note ? <span className="mt-1 block max-w-[240px] text-[12px] leading-snug text-[var(--a-ink-3)]">{r.note}</span> : null}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "120px",
      render: (r) =>
        r.status === "pending" || r.status === "capped" ? (
          <span className="inline-flex flex-col items-stretch gap-1.5">
            <Button size="sm" variant="primary" icon={Check} loading={busy === `${r.id}:approve`} disabled={!!busy} onClick={() => act(r, "approve")} aria-label={`Approve the reward for ${r.referrer.email}`}>
              Approve
            </Button>
            <Button size="sm" icon={X} loading={busy === `${r.id}:reject`} disabled={!!busy} onClick={() => act(r, "reject")} aria-label={`Reject the reward for ${r.referrer.email}`}>
              Reject
            </Button>
          </span>
        ) : r.status === "credit_due" ? (
          <span className="inline-flex flex-col items-stretch gap-1.5">
            <Button size="sm" variant="primary" icon={CircleDollarSign} loading={busy === `${r.id}:applied`} disabled={!!busy} onClick={() => act(r, "applied")}>
              Mark applied
            </Button>
            <Button size="sm" icon={X} loading={busy === `${r.id}:reject`} disabled={!!busy} onClick={() => act(r, "reject")} aria-label={`Reject the credit for ${r.referrer.email}`}>
              Reject
            </Button>
          </span>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Referrals"
        subtitle={`Learners share their /r/ link. When a referred friend pays, the referrer earns 1 free month once you approve it. Limit: ${data.cap} reward${data.cap === 1 ? "" : "s"} per referrer per month.`}
        className="!mb-0"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Personal links" value={t.links} icon={Link2} />
        <StatCard label="Shares" value={t.shares} icon={Share2} />
        <StatCard label="Link visits" value={t.visits} icon={MousePointerClick} />
        <StatCard label="Sign-ups" value={t.signups} icon={UserPlus} />
        <StatCard label="Paid" value={t.paid} icon={CircleDollarSign} tone="success" hint={t.signups ? `${Math.round((t.paid / t.signups) * 100)}% of sign-ups` : undefined} />
        <StatCard label="Rewards to review" value={t.pending + t.creditDue} icon={Gift} tone={t.pending + t.creditDue ? "warn" : "default"} hint={`${t.granted} granted so far`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <Toolbar>
            <Segmented
              ariaLabel="Rewards"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "todo", label: "Needs you", count: t.pending + t.creditDue },
                { value: "done", label: "Decided", count: data.rewards.filter((r) => r.status === "applied" || r.status === "rejected").length },
                { value: "all", label: "All", count: data.rewards.length },
              ]}
            />
          </Toolbar>
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(r) => r.id}
            caption="Referral rewards"
            empty={
              <EmptyState
                icon={Gift}
                title={filter === "todo" ? "Nothing to review" : "No rewards yet"}
                body={filter === "todo" ? "New rewards appear here when a referred learner pays. You also get an email." : "Rewards appear when a referred learner pays for the plan or a track."}
              />
            }
          />
        </section>

        <aside className="min-w-0 space-y-4">
          <Card title="How rewards are granted">
            <ul className="space-y-2 pl-4 font-dm text-[13px] leading-relaxed text-[var(--a-ink-2)] [list-style:disc]">
              <li>Approve gives the referrer 30 days of free access to every track (added to any free time they already have).</li>
              <li>If the referrer pays through Stripe, approval marks a one-month credit as due: apply it in Stripe, then mark it applied.</li>
              <li>Self-referrals (same email or Stripe customer) and repeat rewards for the same friend are refused automatically.</li>
              <li>
                Friend discount:{" "}
                {data.couponId ? (
                  <>Stripe coupon <code className="rounded bg-[var(--a-surface-2)] px-1 font-mono text-[12px]">{data.couponId}</code> applies at their first checkout.</>
                ) : (
                  <>off. Set STRIPE_REFERRAL_COUPON_ID to give referred friends a discount.</>
                )}
              </li>
            </ul>
          </Card>
          <Card title="Top referrers" padded={false}>
            {data.top.length ? (
              <ol className="divide-y divide-[var(--a-border)]">
                {data.top.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 font-dm text-[13px]">
                    <span className="w-4 shrink-0 text-right tabular-nums text-[var(--a-ink-3)]">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <Who p={p} />
                    </span>
                    <span className="shrink-0 text-right tabular-nums text-[var(--a-ink-2)]">
                      <strong className="text-[var(--a-ink)]">{p.paid}</strong> paid
                      <span className="block text-[12px] text-[var(--a-ink-3)]">{p.signups} sign-ups</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState compact icon={UserPlus} title="No referred sign-ups yet" body="Learners find their link under Invite friends." />
            )}
          </Card>
          <Card title="Refused by the fraud guards" icon={ShieldAlert} padded={false}>
            {data.rejectedSignups.length ? (
              <ul className="divide-y divide-[var(--a-border)]">
                {data.rejectedSignups.map((r) => (
                  <li key={r.id} className="px-5 py-2.5 font-dm text-[13px]">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{r.referred.email}</span>
                    <span className="block text-[12px] text-[var(--a-ink-3)]">
                      {r.reason ?? "Rejected"} · via {r.referrer.email} · {day(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 font-dm text-[13px] text-[var(--a-ink-3)]">None so far.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
