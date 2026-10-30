"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, MoreHorizontal, Pause, Pencil, Play, Plus, Square, TicketPercent } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Menu,
  SearchInput,
  Segmented,
  Toolbar,
  useConfirm,
  useToast,
  type Column,
  type MenuItem,
} from "@/components/admin/ui";
import { discountLabel, durationLabel, type PromoStatus } from "@/lib/promotions/shared";
import type { SerialPromotion } from "@/lib/promotions/admin";
import { STATUS_LABEL, STATUS_TONE, api, scopeSummary, statusOf, usd, windowLabel } from "./format";

export type ListRow = SerialPromotion & { revenueCents: number; discountGivenCents: number };

const FILTERS: Array<{ value: "all" | PromoStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
];

export default function PromotionsList({ rows, names }: { rows: ListRow[]; names: Record<string, string> }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | PromoStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const withStatus = useMemo(() => rows.map((r) => ({ ...r, status: statusOf(r) })), [rows]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: withStatus.length };
    for (const r of withStatus) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [withStatus]);
  const shown = withStatus.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!q.trim() || `${r.name} ${r.code ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  async function act(r: ListRow & { status: PromoStatus }, action: "publish" | "pause" | "end" | "duplicate") {
    if (action === "pause") {
      const ok = await confirm({
        title: `Pause "${r.name}"?`,
        body: r.mode === "code" ? `${r.code} stops working at once, here and in Stripe. You can resume it later.` : "The sale stops at once. You can resume it later.",
        confirmLabel: "Pause promotion",
        danger: false,
      });
      if (!ok) return;
    }
    if (action === "end") {
      const ok = await confirm({
        title: `End "${r.name}" now?`,
        body: "It stops at once and cannot be resumed. Duplicate it to run it again.",
        confirmLabel: "End now",
      });
      if (!ok) return;
    }
    setBusy(r.id);
    try {
      const res = await api<{ promotion: SerialPromotion }>(`/api/admin/promotions/${r.id}/action`, { body: { action } });
      if (action === "duplicate") {
        toast.success("Duplicated as a draft", "Set a new code and dates, then publish.");
        router.push(`/admin_pro/promotions/${res.promotion.id}`);
        return;
      }
      const verb = { publish: r.status === "paused" ? "Resumed" : "Published", pause: "Paused", end: "Ended" }[action];
      const st = statusOf(res.promotion);
      toast.success(`${verb} "${r.name}"`, action === "publish" ? (st === "scheduled" ? "It goes live at its start date." : "It is live now.") : "Checkout no longer applies it.");
      router.refresh();
    } catch (err) {
      toast.error("Could not update the promotion", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const columns: Column<ListRow & { status: PromoStatus }>[] = [
    {
      key: "name",
      header: "Promotion",
      primary: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--a-ink)]">{r.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-[var(--a-ink-3)]">
            {r.mode === "code" ? (
              <code className="rounded bg-[var(--a-surface-2)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--a-ink-2)] ring-1 ring-inset ring-[var(--a-border)]">{r.code ?? "No code yet"}</code>
            ) : (
              <span>Automatic sale</span>
            )}
          </p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{STATUS_LABEL[r.status]}</Badge> },
    {
      key: "discount",
      header: "Discount",
      render: (r) => (
        <span className="tabular-nums">
          {discountLabel(r)}
          {r.scope.some((s) => s.key === "arfa_monthly" || s.key === "team" || s.key === "toolkit") ? (
            <span className="block text-[12px] text-[var(--a-ink-3)]">Subscriptions: {durationLabel(r)}</span>
          ) : null}
        </span>
      ),
    },
    { key: "scope", header: "Applies to", hideOnMobile: true, render: (r) => <span className="line-clamp-2 max-w-[240px] text-[13px]">{scopeSummary(r.scope, names)}</span> },
    { key: "window", header: "When (Toronto)", hideOnMobile: true, render: (r) => <span className="text-[12.5px]">{windowLabel(r)}</span> },
    {
      key: "redemptions",
      header: "Redemptions",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.redemptionCount.toLocaleString("en")}
          {r.maxRedemptions ? <span className="text-[var(--a-ink-3)]"> / {r.maxRedemptions.toLocaleString("en")}</span> : null}
        </span>
      ),
    },
    { key: "revenue", header: "Revenue", align: "right", render: (r) => <span className="tabular-nums">{usd(r.revenueCents)}</span> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "64px",
      render: (r) => {
        const items: MenuItem[] = [{ label: "Edit", icon: Pencil, href: `/admin_pro/promotions/${r.id}` }];
        if (r.status === "draft" || r.status === "paused") items.push({ label: r.status === "paused" ? "Resume" : "Publish", icon: Play, onSelect: () => act(r, "publish") });
        if (r.status === "live" || r.status === "scheduled") items.push({ label: "Pause", icon: Pause, onSelect: () => act(r, "pause") });
        items.push({ label: "Duplicate", icon: Copy, onSelect: () => act(r, "duplicate") });
        if (r.state !== "draft" && r.state !== "ended") items.push({ separator: true }, { label: "End now", icon: Square, danger: true, onSelect: () => act(r, "end") });
        return (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <Menu
              label={`Actions for ${r.name}`}
              items={items}
              trigger={(p) => (
                <button
                  {...p}
                  type="button"
                  aria-label={`Actions for ${r.name}`}
                  disabled={busy === r.id}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--a-radius-control)] text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)] disabled:opacity-50"
                >
                  <MoreHorizontal size={18} aria-hidden />
                </button>
              )}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or code" label="Search promotions" />
        <Segmented
          ariaLabel="Filter by status"
          size="sm"
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value] ?? 0 }))}
        />
      </Toolbar>
      <DataTable
        caption="Promotions"
        columns={columns}
        rows={shown}
        rowKey={(r) => r.id}
        rowHref={(r) => `/admin_pro/promotions/${r.id}`}
        onRowClick={(r) => router.push(`/admin_pro/promotions/${r.id}`)}
        empty={
          <EmptyState
            icon={TicketPercent}
            title={rows.length === 0 ? "No promotions yet" : "Nothing matches"}
            body={rows.length === 0 ? "Create a promo code or an automatic sale. It goes live the moment you publish it." : "Clear the search or pick another status."}
            action={rows.length === 0 ? <Button variant="primary" icon={Plus} href="/admin_pro/promotions/new">New promotion</Button> : undefined}
          />
        }
      />
    </div>
  );
}
