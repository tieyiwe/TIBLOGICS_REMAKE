"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, Pause, Play, Save, Square, Trash2 } from "lucide-react";
import { Badge, Button, Card, Notice, Segmented, Select, useConfirm, useToast } from "@/components/admin/ui";
import {
  CODE_RE,
  PROMO_TZ,
  SCOPE_KEYS,
  SCOPE_LABELS,
  SCOPE_WITH_IDS,
  discountLabel,
  durationLabel,
  fromZonedInput,
  normaliseCode,
  toZonedInput,
  type PromoDuration,
  type PromoKind,
  type PromoMode,
  type ScopeEntry,
  type ScopeKey,
} from "@/lib/promotions/shared";
import type { SerialPromotion } from "@/lib/promotions/admin";
import { STATUS_LABEL, STATUS_TONE, api, scopeSummary, statusOf } from "./format";
import { hintCls, inputCls, labelCls, legendCls } from "./fields";
import type { ScopeOption } from "./data";

interface Form {
  name: string;
  mode: PromoMode;
  code: string;
  kind: PromoKind;
  value: string;
  duration: PromoDuration;
  months: string;
  scope: Partial<Record<ScopeKey, { on: boolean; all: boolean; ids: string[] }>>;
  startsAt: string;
  endsAt: string;
  maxRedemptions: string;
  firstTimeOnly: boolean;
  minimum: string;
  bannerEn: string;
  bannerFr: string;
  bannerSw: string;
}

function initialForm(p: SerialPromotion | null): Form {
  const scope: Form["scope"] = {};
  for (const k of SCOPE_KEYS) {
    const e = p?.scope.find((s) => s.key === k);
    scope[k] = { on: !!e, all: !e?.ids?.length, ids: e?.ids ?? [] };
  }
  return {
    name: p?.name ?? "",
    mode: p?.mode ?? "code",
    code: p?.code ?? "",
    kind: p?.kind ?? "percent",
    value: p ? String(p.kind === "percent" ? p.percentOff ?? "" : (p.amountOffCents ?? 0) / 100) : "20",
    duration: p?.duration ?? "once",
    months: String(p?.durationMonths ?? 3),
    scope,
    startsAt: toZonedInput(p?.startsAt ? new Date(p.startsAt) : null),
    endsAt: toZonedInput(p?.endsAt ? new Date(p.endsAt) : null),
    maxRedemptions: p?.maxRedemptions ? String(p.maxRedemptions) : "",
    firstTimeOnly: p?.firstTimeOnly ?? false,
    minimum: p?.minimumCents ? String(p.minimumCents / 100) : "",
    bannerEn: p?.bannerEn ?? "",
    bannerFr: p?.bannerFr ?? "",
    bannerSw: p?.bannerSw ?? "",
  };
}

const money = (s: string) => {
  const n = Number(String(s).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

export default function PromotionEditor({
  promotion,
  tracks,
  products,
}: {
  promotion: SerialPromotion | null;
  tracks: ScopeOption[];
  products: ScopeOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [p, setP] = useState<SerialPromotion | null>(promotion);
  const [f, setF] = useState<Form>(() => initialForm(promotion));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [translating, setTranslating] = useState(false);
  const status = p ? statusOf(p) : "draft";
  const ended = p?.state === "ended";
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const setScope = (k: ScopeKey, v: Partial<{ on: boolean; all: boolean; ids: string[] }>) =>
    setF((x) => ({ ...x, scope: { ...x.scope, [k]: { ...x.scope[k]!, ...v } } }));

  const code = normaliseCode(f.code);
  const codeProblem = f.mode === "code" && code && !CODE_RE.test(code) ? "3 to 32 characters: letters, digits, dash or underscore." : "";
  const subs = (["arfa_monthly", "team", "toolkit"] as ScopeKey[]).some((k) => f.scope[k]?.on);

  function scopeList(): ScopeEntry[] {
    const out: ScopeEntry[] = [];
    for (const k of SCOPE_KEYS) {
      const s = f.scope[k];
      if (!s?.on) continue;
      out.push(SCOPE_WITH_IDS.includes(k) && !s.all ? { key: k, ids: s.ids } : { key: k });
    }
    return out;
  }

  function body(confirmRecreate = false) {
    const v = Number(String(f.value).replace(/[$,%\s]/g, ""));
    return {
      name: f.name,
      kind: f.kind,
      percentOff: f.kind === "percent" ? v : null,
      amountOffCents: f.kind === "amount" ? Math.round(v * 100) : null,
      duration: f.duration,
      durationMonths: f.duration === "repeating" ? Number(f.months) || 1 : null,
      scope: scopeList(),
      mode: f.mode,
      code: f.mode === "code" ? code || null : null,
      startsAt: f.startsAt || null,
      endsAt: f.endsAt || null,
      maxRedemptions: f.maxRedemptions ? Math.round(Number(f.maxRedemptions)) || null : null,
      firstTimeOnly: f.firstTimeOnly,
      minimumCents: money(f.minimum),
      bannerEn: f.bannerEn,
      bannerFr: f.bannerFr,
      bannerSw: f.bannerSw,
      ...(confirmRecreate ? { confirmRecreate: true } : {}),
    };
  }

  function localCheck(): string {
    if (!f.name.trim()) return "Give the promotion a name.";
    const v = Number(String(f.value).replace(/[$,%\s]/g, ""));
    if (f.kind === "percent" && !(v > 0 && v <= 100)) return "Percent off must be between 1 and 100.";
    if (f.kind === "amount" && !(v > 0)) return "Enter the amount off in dollars.";
    if (codeProblem) return `Code: ${codeProblem}`;
    if (f.startsAt && f.endsAt && (fromZonedInput(f.endsAt)?.getTime() ?? 0) <= (fromZonedInput(f.startsAt)?.getTime() ?? 0)) return "The end date must be after the start date.";
    for (const k of SCOPE_WITH_IDS) {
      const s = f.scope[k];
      if (s?.on && !s.all && s.ids.length === 0) return `Pick at least one item under ${SCOPE_LABELS[k]}, or choose All.`;
    }
    return "";
  }

  /** Saves; returns the saved promotion or null. */
  async function save(): Promise<SerialPromotion | null> {
    const problem = localCheck();
    if (problem) {
      setError(problem);
      return null;
    }
    setError("");
    try {
      if (!p) {
        const res = await api<{ promotion: SerialPromotion }>("/api/admin/promotions", { body: body() });
        setP(res.promotion);
        return res.promotion;
      }
      try {
        const res = await api<{ promotion: SerialPromotion; recreated: boolean }>(`/api/admin/promotions/${p.id}`, { method: "PUT", body: body() });
        setP(res.promotion);
        return res.promotion;
      } catch (err) {
        if (!(err as { needsConfirm?: boolean }).needsConfirm) throw err;
        const ok = await confirm({
          title: "Replace the Stripe coupon?",
          body: (err as Error).message,
          confirmLabel: "Archive and recreate",
        });
        if (!ok) return null;
        const res = await api<{ promotion: SerialPromotion; recreated: boolean }>(`/api/admin/promotions/${p.id}`, { method: "PUT", body: body(true) });
        setP(res.promotion);
        toast.info("Stripe coupon replaced", "New checkouts use the new amount.");
        return res.promotion;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save.";
      setError(msg);
      toast.error("Could not save", msg);
      return null;
    }
  }

  async function onSave() {
    setBusy("save");
    const saved = await save();
    setBusy(null);
    if (!saved) return;
    toast.success(saved.state === "published" ? "Saved. Changes are live." : "Draft saved");
    if (!promotion) router.replace(`/admin_pro/promotions/${saved.id}`);
    else router.refresh();
  }

  async function action(a: "publish" | "pause" | "end") {
    if (a === "pause" || a === "end") {
      const ok = await confirm(
        a === "pause"
          ? { title: "Pause this promotion?", body: "It stops at once at checkout and in Stripe. You can resume it later.", confirmLabel: "Pause", danger: false }
          : { title: "End this promotion now?", body: "It stops at once and cannot be resumed. Duplicate it to run it again.", confirmLabel: "End now" },
      );
      if (!ok) return;
    }
    setBusy(a);
    try {
      let target = p;
      if (a === "publish") {
        target = await save();
        if (!target) return;
      }
      const res = await api<{ promotion: SerialPromotion }>(`/api/admin/promotions/${target!.id}/action`, { body: { action: a } });
      setP(res.promotion);
      const st = statusOf(res.promotion);
      if (a === "publish") toast.success(st === "scheduled" ? "Published. It goes live at its start date." : "Published. It is live now.");
      else toast.success(a === "pause" ? "Paused" : "Ended", "Checkout no longer applies it.");
      if (!promotion) router.replace(`/admin_pro/promotions/${res.promotion.id}`);
      else router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update.";
      setError(msg);
      toast.error("Could not update the promotion", msg);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!p) return;
    const ok = await confirm({ title: "Delete this draft?", body: "It was never published, so nothing changes in Stripe.", confirmLabel: "Delete draft" });
    if (!ok) return;
    setBusy("delete");
    try {
      await api(`/api/admin/promotions/${p.id}`, { method: "DELETE" });
      toast.success("Draft deleted");
      router.push("/admin_pro/promotions");
    } catch (err) {
      toast.error("Could not delete", err instanceof Error ? err.message : undefined);
      setBusy(null);
    }
  }

  async function translate() {
    if (!f.bannerEn.trim()) return toast.error("Write the English banner first");
    setTranslating(true);
    try {
      const res = await api<{ fr: string; sw: string }>("/api/admin/promotions/translate", { body: { text: f.bannerEn } });
      setF((x) => ({ ...x, bannerFr: res.fr || x.bannerFr, bannerSw: res.sw || x.bannerSw }));
      toast.success("Translated", "Check the French and Swahili before saving.");
    } catch (err) {
      toast.error("Could not translate", err instanceof Error ? err.message : undefined);
    } finally {
      setTranslating(false);
    }
  }

  const names = useMemo(() => Object.fromEntries([...tracks, ...products].map((o) => [o.id, o.label])), [tracks, products]);
  const summary = useMemo(() => {
    const v = Number(String(f.value).replace(/[$,%\s]/g, "")) || 0;
    const d = discountLabel({ kind: f.kind, percentOff: v, amountOffCents: Math.round(v * 100) });
    const how = f.mode === "code" ? (code ? `with code ${code}` : "with a code") : "applied automatically";
    return `${d} ${scopeSummary(scopeList(), names)}, ${how}${subs ? `, ${durationLabel({ duration: f.duration, durationMonths: Number(f.months) || 1 })} on subscriptions` : ""}.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, code, names, subs]);

  const canPublish = !ended && (status === "draft" || status === "paused");
  const canPause = status === "live" || status === "scheduled";

  return (
    <div className="space-y-5 pb-24">
      {p ? (
        <div className="flex flex-wrap items-center gap-2 font-dm text-[13px] text-[var(--a-ink-3)]">
          <Badge tone={STATUS_TONE[status]} dot>{STATUS_LABEL[status]}</Badge>
          {p.stripeCouponId ? <span>Stripe coupon <code className="font-mono text-[12px]">{p.stripeCouponId}</code></span> : <span>Not in Stripe yet (publish creates it)</span>}
          {p.stripePromotionCodeId ? <span>· code {p.stripeCodeActive ? "active" : "inactive"} in Stripe</span> : null}
        </div>
      ) : null}

      {ended ? <Notice tone="info" title="This promotion has ended">It no longer applies anywhere. Duplicate it from the list to run it again.</Notice> : null}
      {error ? <Notice tone="danger" title="Not saved">{error}</Notice> : null}

      <Card title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Name (internal)</span>
            <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={120} placeholder="Back to school 2026" disabled={ended} />
            <span className={hintCls}>Customers never see this. Stripe shows the first 40 characters on receipts.</span>
          </label>
          <div>
            <span className={labelCls} id="mode-label">How customers get it</span>
            <Segmented
              ariaLabel="How customers get it"
              value={f.mode}
              onChange={(v) => !ended && set("mode", v as PromoMode)}
              options={[{ value: "code", label: "Promo code" }, { value: "auto", label: "Automatic sale" }]}
            />
            <span className={hintCls}>
              {f.mode === "code" ? "Customers type the code before or at checkout." : "Applied at checkout to eligible items, no code. Public pages show the sale price."}
            </span>
          </div>
          {f.mode === "code" ? (
            <label className="block">
              <span className={labelCls}>Code</span>
              <input
                className={`${inputCls} font-mono uppercase tracking-wide`}
                value={f.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                maxLength={32}
                placeholder="LAUNCH20"
                aria-invalid={!!codeProblem}
                aria-describedby="code-hint"
                disabled={ended}
              />
              <span id="code-hint" className={hintCls} style={codeProblem ? { color: "var(--a-danger)" } : undefined}>
                {codeProblem || "Uppercase. Customers can type it in any case."}
              </span>
            </label>
          ) : null}
        </div>
      </Card>

      <Card title="Discount">
        <div className="grid gap-4 md:grid-cols-3 md:items-start">
          <div>
            <span className={labelCls}>Type</span>
            <Segmented
              ariaLabel="Discount type"
              value={f.kind}
              onChange={(v) => !ended && set("kind", v as PromoKind)}
              options={[{ value: "percent", label: "Percent off" }, { value: "amount", label: "Amount off (USD)" }]}
            />
          </div>
          <label className="block">
            <span className={labelCls}>{f.kind === "percent" ? "Percent off" : "Amount off (USD)"}</span>
            <div className="relative">
              {f.kind === "amount" ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-dm text-[13.5px] text-[var(--a-ink-3)]">$</span> : null}
              <input
                className={`${inputCls} tabular-nums ${f.kind === "amount" ? "pl-7" : "pr-8"}`}
                inputMode="decimal"
                value={f.value}
                onChange={(e) => set("value", e.target.value)}
                disabled={ended}
              />
              {f.kind === "percent" ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-dm text-[13.5px] text-[var(--a-ink-3)]">%</span> : null}
            </div>
            <span className={hintCls}>{f.kind === "amount" ? "Off the checkout total. Never below $0.50." : "Of each eligible item. Never below $0.50."}</span>
          </label>
          <div className={subs ? "" : "opacity-60"}>
            <label className="block">
              <span className={labelCls}>On subscriptions</span>
              <Select value={f.duration} onChange={(e) => set("duration", e.target.value as PromoDuration)} className="w-full" label="Duration on subscriptions" disabled={ended}>
                <option value="once">First payment only</option>
                <option value="repeating">For a number of months</option>
                <option value="forever">Every payment</option>
              </Select>
            </label>
            {f.duration === "repeating" ? (
              <label className="mt-2 block">
                <span className={labelCls}>Months</span>
                <input className={inputCls} inputMode="numeric" value={f.months} onChange={(e) => set("months", e.target.value)} disabled={ended} />
              </label>
            ) : null}
            <span className={hintCls}>For the ARFA monthly plan, team seats and Toolkit Live. One-time purchases get it once.</span>
          </div>
        </div>
      </Card>

      <Card title="Applies to" subtitle="Only checkouts with these items get the discount. Other items in the same cart pay full price.">
        <fieldset>
          <legend className="sr-only">Applies to</legend>
          <ul className="grid items-start gap-3 md:grid-cols-2">
            {SCOPE_KEYS.map((k) => {
              const s = f.scope[k]!;
              const opts = k === "tracks" ? tracks : k === "store" ? products : null;
              return (
                <li key={k} className={`rounded-[var(--a-radius-control)] border p-3 ${s.on ? "border-[var(--a-blue)] bg-[var(--a-info-bg)]/40" : "border-[var(--a-border)]"}`}>
                  <label className="flex min-h-9 cursor-pointer items-center gap-2.5 font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--a-blue)]" checked={s.on} onChange={(e) => setScope(k, { on: e.target.checked })} disabled={ended} />
                    {SCOPE_LABELS[k]}
                  </label>
                  {s.on && opts ? (
                    <ScopePicker
                      label={SCOPE_LABELS[k]}
                      all={s.all}
                      ids={s.ids}
                      options={opts}
                      disabled={ended}
                      onChange={(all, ids) => setScope(k, { all, ids })}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </fieldset>
      </Card>

      <Card title="Schedule and limits" subtitle={`Times are Toronto time (${PROMO_TZ}). Leave blank to start at once and run until you end it.`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelCls}>Starts (Toronto)</span>
            <input type="datetime-local" className={inputCls} value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} disabled={ended} />
          </label>
          <label className="block">
            <span className={labelCls}>Ends (Toronto)</span>
            <input type="datetime-local" className={inputCls} value={f.endsAt} onChange={(e) => set("endsAt", e.target.value)} disabled={ended} />
          </label>
          <label className="block">
            <span className={labelCls}>Max total redemptions</span>
            <input className={inputCls} inputMode="numeric" value={f.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value.replace(/\D/g, ""))} placeholder="No limit" disabled={ended} />
          </label>
          <label className="block">
            <span className={labelCls}>Minimum order (USD)</span>
            <input className={inputCls} inputMode="decimal" value={f.minimum} onChange={(e) => set("minimum", e.target.value)} placeholder="None" disabled={ended} />
          </label>
        </div>
        <label className="mt-4 flex min-h-9 cursor-pointer items-center gap-2.5 font-dm text-[13.5px] text-[var(--a-ink)]">
          <input type="checkbox" className="h-4 w-4 accent-[var(--a-blue)]" checked={f.firstTimeOnly} onChange={(e) => set("firstTimeOnly", e.target.checked)} disabled={ended} />
          First-time customers only
          <span className="text-[12px] text-[var(--a-ink-3)]">(no earlier paid purchase from us)</span>
        </label>
      </Card>

      <Card
        title="Public banner (optional)"
        subtitle="Shown across the site and on ARFA pages while the promotion is live."
        action={
          <Button size="sm" variant="secondary" icon={Languages} onClick={translate} loading={translating} disabled={ended}>
            Translate with AI
          </Button>
        }
      >
        <div className="grid gap-4">
          {(
            [
              ["bannerEn", "English", "Back to school: 20% off every ARFA track until Sept 30. Code LAUNCH20."],
              ["bannerFr", "French", "Traduction française"],
              ["bannerSw", "Swahili", "Tafsiri ya Kiswahili"],
            ] as const
          ).map(([k, label, ph]) => (
            <label key={k} className="block">
              <span className={labelCls}>{label}</span>
              <input className={inputCls} value={f[k]} onChange={(e) => set(k, e.target.value)} maxLength={200} placeholder={ph} disabled={ended} />
            </label>
          ))}
          <span className={hintCls}>Up to 200 characters. French and Swahili fall back to English when blank.</span>
        </div>
      </Card>

      <p className="font-dm text-[13px] text-[var(--a-ink-3)]">
        <span className={legendCls}>Summary</span>
        <br />
        <span className="text-[var(--a-ink-2)]">{summary}</span>
      </p>

      {!ended ? (
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-[var(--a-border)] bg-[var(--a-surface)]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Button variant={canPublish ? "secondary" : "primary"} icon={Save} onClick={onSave} loading={busy === "save"} disabled={!!busy && busy !== "save"}>
            {!p || p.state === "draft" ? "Save draft" : "Save changes"}
          </Button>
          {canPublish ? (
            <Button variant="primary" icon={Play} onClick={() => action("publish")} loading={busy === "publish"} disabled={!!busy && busy !== "publish"}>
              {status === "paused" ? "Save and resume" : "Save and publish"}
            </Button>
          ) : null}
          {canPause ? (
            <Button variant="secondary" icon={Pause} onClick={() => action("pause")} loading={busy === "pause"} disabled={!!busy && busy !== "pause"}>
              Pause
            </Button>
          ) : null}
          <span className="ml-auto flex gap-2">
            {p && p.state !== "draft" ? (
              <Button variant="ghost" icon={Square} onClick={() => action("end")} loading={busy === "end"} disabled={!!busy && busy !== "end"}>
                End now
              </Button>
            ) : null}
            {p && p.state === "draft" && !p.stripeCouponId ? (
              <Button variant="ghost" icon={Trash2} onClick={remove} loading={busy === "delete"} disabled={!!busy && busy !== "delete"}>
                Delete draft
              </Button>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ScopePicker({
  label,
  all,
  ids,
  options,
  disabled,
  onChange,
}: {
  label: string;
  all: boolean;
  ids: string[];
  options: ScopeOption[];
  disabled?: boolean;
  onChange: (all: boolean, ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const shown = options.filter((o) => !q.trim() || o.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 80);
  return (
    <div className="mt-2 space-y-2 pl-6">
      <div role="radiogroup" aria-label={`${label}: which ones`} className="flex flex-wrap gap-3 font-dm text-[13px] text-[var(--a-ink-2)]">
        <label className="flex min-h-9 items-center gap-1.5">
          <input type="radio" checked={all} onChange={() => onChange(true, ids)} disabled={disabled} className="accent-[var(--a-blue)]" /> All
        </label>
        <label className="flex min-h-9 items-center gap-1.5">
          <input type="radio" checked={!all} onChange={() => onChange(false, ids)} disabled={disabled} className="accent-[var(--a-blue)]" /> Selected ({ids.length})
        </label>
      </div>
      {!all ? (
        <div>
          {options.length > 8 ? (
            <input className={`${inputCls} mb-2`} placeholder="Filter" value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Filter ${label}`} />
          ) : null}
          <ul className="max-h-56 space-y-0.5 overflow-auto rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface)] p-1">
            {shown.length === 0 ? <li className="px-2 py-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">Nothing to choose from.</li> : null}
            {shown.map((o) => (
              <li key={o.id}>
                <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 font-dm text-[13px] text-[var(--a-ink)] hover:bg-[var(--a-surface-2)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[var(--a-blue)]"
                    checked={ids.includes(o.id)}
                    disabled={disabled}
                    onChange={(e) => onChange(false, e.target.checked ? [...ids, o.id] : ids.filter((x) => x !== o.id))}
                  />
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  <span className="shrink-0 text-[12px] tabular-nums text-[var(--a-ink-3)]">{o.hint}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
