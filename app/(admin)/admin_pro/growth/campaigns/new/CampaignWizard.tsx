"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, ArrowRight, CalendarRange, Check, GraduationCap, Gift, Loader2, Mail, PhoneCall, RefreshCw,
  Rocket, ShoppingBag, Sparkles, Target, Users, Wallet,
} from "lucide-react";
import { Badge, Button, Card, SearchInput, useToast } from "@/components/admin/ui";
import type { CampaignInput, CampaignPlan, GoalType } from "@/lib/growth/campaigns";
import { input, label } from "../../_components/ui";

export interface WizardProduct {
  key: string;
  type: string;
  title: string;
  summary: string;
  price: string | null;
}

const CHANNEL_COLOR: Record<string, string> = {
  linkedin: "#0A66C2", x: "#0D1B2A", facebook: "#1877F2", instagram: "#C13584", whatsapp: "#25D366",
  email: "#F47C20", outreach: "#7C3AED", ads: "#B45309",
};
const CHANNEL_LABEL: Record<string, string> = {
  linkedin: "LinkedIn", x: "X", facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp Status",
  email: "Newsletter", outreach: "Cold outreach", ads: "Paid ads",
};

const PRESETS: { id: string; icon: typeof Target; goalType: GoalType; target: number; label: string; hint: string; product?: string }[] = [
  { id: "signups", icon: GraduationCap, goalType: "signups", target: 20, label: "20 Learn sign-ups", hint: "Grow the Learning Box", product: "learn-plan:monthly" },
  { id: "calls", icon: PhoneCall, goalType: "calls", target: 5, label: "5 discovery calls", hint: "Book calls for services", product: "service:agents" },
  { id: "realtor", icon: ShoppingBag, goalType: "sales", target: 10, label: "Sell 10 Realtor kits", hint: "Move a store product", product: "product:the-realtor-ai-toolkit" },
  { id: "leads", icon: Users, goalType: "leads", target: 15, label: "15 warm leads", hint: "Replies and bookings" },
  { id: "revenue", icon: Wallet, goalType: "revenue", target: 1000, label: "$1,000 revenue", hint: "Any product, paid" },
];

const GOAL_OPTIONS: { key: GoalType; label: string }[] = [
  { key: "signups", label: "Learn sign-ups" },
  { key: "calls", label: "Discovery calls" },
  { key: "sales", label: "Sales" },
  { key: "revenue", label: "Revenue (USD)" },
  { key: "leads", label: "Warm leads" },
];

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const STEPS = ["Goal", "Products", "Audience & budget", "Plan"];

export default function CampaignWizard({
  products,
  audiences,
  defaultLanguage,
  acquire,
  initialChannel,
}: {
  products: WizardProduct[];
  audiences: { id: string; name: string; language: string }[];
  defaultLanguage: string;
  acquire: boolean;
  initialChannel?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState<string | null>(null);
  const [goalType, setGoalType] = useState<GoalType>("signups");
  const [goalTarget, setGoalTarget] = useState(20);
  const [goalLabel, setGoalLabel] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [audienceId, setAudienceId] = useState(audiences.find((a) => a.language === defaultLanguage)?.id ?? audiences[0]?.id ?? "");
  const [language, setLanguage] = useState(defaultLanguage);
  const [hours, setHours] = useState(3);
  const [adBudget, setAdBudget] = useState(0);
  const [startDate, setStartDate] = useState(ymd(new Date()));
  const [endDate, setEndDate] = useState(ymd(new Date(Date.now() + 27 * 86_400_000)));
  const [notes, setNotes] = useState(initialChannel ? `Lean on ${CHANNEL_LABEL[initialChannel] ?? initialChannel}: it converts best for us lately.` : "");
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [planInput, setPlanInput] = useState<CampaignInput | null>(null);
  const [busy, setBusy] = useState<"plan" | "launch" | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => !s || `${p.title} ${p.summary} ${p.type}`.toLowerCase().includes(s)).slice(0, 60);
  }, [products, q]);

  function choosePreset(p: (typeof PRESETS)[number]) {
    setPreset(p.id);
    setGoalType(p.goalType);
    setGoalTarget(p.target);
    setGoalLabel(p.label);
    if (p.product && products.some((x) => x.key === p.product)) setPicked([p.product]);
  }

  const toggle = (k: string) => setPicked((x) => (x.includes(k) ? x.filter((y) => y !== k) : x.length >= 3 ? x : [...x, k]));
  const canNext = step === 0 ? goalTarget > 0 : step === 1 ? picked.length > 0 : step === 2 ? !!startDate && endDate > startDate : true;

  const input0 = (): Record<string, unknown> => ({
    goalType, goalTarget, goalLabel, productKeys: picked, audienceId, language, hoursPerWeek: hours, adBudget, startDate, endDate, notes,
  });

  async function draftPlan() {
    setBusy("plan");
    setStep(3);
    try {
      const res = await fetch("/api/admin/growth/campaigns/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: input0() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Planning failed");
      setPlan(j.plan);
      setPlanInput(j.input);
    } catch (e) {
      toast.error("Could not draft the plan", e instanceof Error ? e.message : undefined);
      if (!plan) setStep(2);
    } finally {
      setBusy(null);
    }
  }

  async function launch() {
    if (!plan || !planInput) return;
    setBusy("launch");
    try {
      const res = await fetch("/api/admin/growth/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: planInput, plan }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Could not create the campaign");
      const errs = j.campaign.assets?.errors ?? [];
      if (errs.length) toast.error("Created with some gaps", errs[0]);
      else toast.success("Campaign created as drafts", `${j.campaign.assets?.postsQueued ?? 0} posts queued, ${j.campaign.assets?.links?.length ?? 0} share links.`);
      router.push(`/admin_pro/growth/campaigns/${j.campaign.id}`);
    } catch (e) {
      toast.error("Launch failed", e instanceof Error ? e.message : undefined);
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button
              type="button"
              disabled={i > step || !!busy}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={`inline-flex h-8 items-center gap-2 rounded-full px-3 font-dm text-[12.5px] font-semibold ${i === step ? "bg-[var(--a-navy)] text-white" : i < step ? "bg-[var(--a-success-bg)] text-[var(--a-success)]" : "bg-[var(--a-surface-2)] text-[var(--a-ink-3)]"}`}
            >
              {i < step ? <Check size={13} aria-hidden /> : <span className="tabular-nums">{i + 1}</span>} {s}
            </button>
            {i < STEPS.length - 1 && <span className="hidden h-px w-6 bg-[var(--a-border-strong)] sm:block" aria-hidden />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card title="What do you want this campaign to achieve?" subtitle="Pick a goal or set your own. Progress is measured from tracked links and real records.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => choosePreset(p)} data-testid={`preset-${p.id}`}
                className={`flex flex-col items-start gap-2 rounded-[var(--a-radius-card)] border p-4 text-left transition-colors ${preset === p.id ? "border-[var(--a-orange)] bg-[var(--a-orange-bg)]/60 ring-2 ring-[var(--a-orange)]/20" : "border-[var(--a-border)] bg-white hover:border-[var(--a-border-strong)]"}`}>
                <p.icon size={20} className="text-[var(--a-orange-text)]" aria-hidden />
                <span className="font-dm text-[14px] font-bold text-[var(--a-ink)]">{p.label}</span>
                <span className="font-dm text-[12px] text-[var(--a-ink-3)]">{p.hint}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="cw-type">Goal</label>
              <select id="cw-type" className={input} value={goalType} onChange={(e) => { setGoalType(e.target.value as GoalType); setPreset(null); }}>
                {GOAL_OPTIONS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="cw-target">Target {goalType === "revenue" ? "(USD)" : ""}</label>
              <input id="cw-target" type="number" min={1} className={input} value={goalTarget} onChange={(e) => setGoalTarget(Math.max(0, Number(e.target.value)))} />
            </div>
            <div>
              <label className={label} htmlFor="cw-label">Name it (optional)</label>
              <input id="cw-label" className={input} value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)} placeholder="20 Learn sign-ups" />
            </div>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Which products?" subtitle="Up to 3. The first one gets the content kit; the plan can mention all of them." action={<Badge tone={picked.length ? "orange" : "neutral"}>{picked.length}/3 picked</Badge>}>
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" label="Search products" className="mb-3 sm:max-w-md" />
          <ul className="grid max-h-[460px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => {
              const on = picked.includes(p.key);
              return (
                <li key={p.key}>
                  <button type="button" onClick={() => toggle(p.key)} aria-pressed={on} data-key={p.key}
                    className={`flex w-full items-start gap-2 rounded-[var(--a-radius-control)] border p-3 text-left ${on ? "border-[var(--a-orange)] bg-[var(--a-orange-bg)]/60" : "border-[var(--a-border)] bg-white hover:bg-[var(--a-surface-2)]"}`}>
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-[var(--a-orange-text)] bg-[var(--a-orange-text)] text-white" : "border-[var(--a-border-strong)]"}`}>{on && <Check size={11} aria-hidden />}</span>
                    <span className="min-w-0">
                      <span className="a-micro block">{p.type}{picked[0] === p.key ? " · main" : ""}</span>
                      <span className="block font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{p.title}</span>
                      <span className="line-clamp-2 block font-dm text-[12px] text-[var(--a-ink-3)]">{p.summary}</span>
                      {p.price && <span className="block font-dm text-[11.5px] text-[var(--a-ink-3)]">{p.price}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {step === 2 && (
        <Card title="Audience, budget and dates" subtitle="The plan respects your time: fewer channels when time is short.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={label} htmlFor="cw-aud">Audience</label>
              <select id="cw-aud" className={input} value={audienceId} onChange={(e) => { setAudienceId(e.target.value); const a = audiences.find((x) => x.id === e.target.value); if (a) setLanguage(a.language); }}>
                {audiences.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="cw-lang">Language</label>
              <select id="cw-lang" className={input} value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option><option value="fr">French</option><option value="sw">Swahili</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="cw-hours">Your time: <b>{hours} h/week</b></label>
              <input id="cw-hours" type="range" min={1} max={15} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full accent-[#F47C20]" />
            </div>
            <div>
              <label className={label} htmlFor="cw-ads">Ad budget, total (USD, 0 for none)</label>
              <input id="cw-ads" type="number" min={0} className={input} value={adBudget} onChange={(e) => setAdBudget(Math.max(0, Number(e.target.value)))} />
            </div>
            <div>
              <label className={label} htmlFor="cw-start">Start</label>
              <input id="cw-start" type="date" className={input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="cw-end">End</label>
              <input id="cw-end" type="date" className={input} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={label} htmlFor="cw-notes">Anything the plan should know (optional)</label>
              <textarea id="cw-notes" rows={2} className={input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. focus on Ottawa dental clinics; I can record one short video a week" />
            </div>
          </div>
        </Card>
      )}

      {step === 3 && (
        busy === "plan" || !plan ? (
          <Card>
            <div className="flex flex-col items-center gap-3 py-12 text-center" role="status">
              <Loader2 size={28} className="animate-spin text-[var(--a-orange)]" aria-hidden />
              <p className="font-dm text-[15px] font-semibold text-[var(--a-ink)]">Drafting your campaign plan</p>
              <p className="max-w-md font-dm text-[13px] text-[var(--a-ink-3)]">Picking channels from your past results, setting the cadence, the outreach targets and the KPIs. Usually under a minute.</p>
            </div>
          </Card>
        ) : (
          <PlanReview plan={plan} setPlan={setPlan} acquire={acquire} />
        )
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--a-border)] pt-4">
        <Button icon={ArrowLeft} variant="ghost" disabled={step === 0 || !!busy} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        {step < 2 && <Button variant="primary" iconRight={ArrowRight} disabled={!canNext} onClick={() => setStep(step + 1)} data-testid="wizard-next">Next</Button>}
        {step === 2 && <Button variant="primary" icon={Sparkles} disabled={!canNext} onClick={draftPlan} data-testid="wizard-plan">Draft the plan</Button>}
        {step === 3 && plan && (
          <span className="flex flex-wrap gap-2">
            <Button icon={RefreshCw} disabled={!!busy} onClick={draftPlan}>Redo plan</Button>
            <Button variant="primary" icon={Rocket} loading={busy === "launch"} onClick={launch} data-testid="wizard-launch">Create everything as drafts</Button>
          </span>
        )}
      </div>
      {step === 3 && plan && (
        <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
          Creates a content kit with its posts on the calendar (drafts), tracked share links with this campaign&apos;s UTM, and {plan.outreach.enabled ? "an outreach sequence with its lead filter (nobody is enrolled until you choose)" : "no outreach"}. Nothing publishes or sends without your approval.
        </p>
      )}
    </div>
  );
}

function PlanReview({ plan, setPlan, acquire }: { plan: CampaignPlan; setPlan: (p: CampaignPlan) => void; acquire: boolean }) {
  const total = plan.channels.reduce((s, c) => s + c.share, 0) || 1;
  const f = plan.outreach.filter;
  return (
    <div className="space-y-4" data-testid="plan-review">
      <Card>
        <div className="space-y-3">
          <div>
            <label className={label} htmlFor="plan-name">Campaign name</label>
            <input id="plan-name" className={`${input} font-semibold`} value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} />
          </div>
          <p className="font-dm text-[14px] leading-relaxed text-[var(--a-ink-2)]">{plan.summary}</p>
          {plan.warnings.length > 0 && (
            <ul className="space-y-1">
              {plan.warnings.map((w, i) => <li key={i} className="flex gap-1.5 rounded-md bg-[var(--a-warn-bg)] px-2 py-1 font-dm text-[12px] text-[var(--a-warn)]"><AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />{w}</li>)}
            </ul>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Channel mix">
          <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
            {plan.channels.map((c) => <span key={c.channel} style={{ width: `${(c.share / total) * 100}%`, background: CHANNEL_COLOR[c.channel] ?? "#5A6E84" }} />)}
          </div>
          <ul className="mt-3 space-y-2">
            {plan.channels.map((c) => (
              <li key={c.channel} className="flex gap-2 font-dm text-[13px]">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHANNEL_COLOR[c.channel] ?? "#5A6E84" }} />
                <span className="min-w-0"><b className="text-[var(--a-ink)]">{CHANNEL_LABEL[c.channel] ?? c.channel} · {c.share}%</b> <span className="text-[var(--a-ink-3)]">{c.why}</span></span>
              </li>
            ))}
          </ul>
          {plan.cadence.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {plan.cadence.map((c) => <Badge key={c.channel} tone="neutral" title={c.note}>{CHANNEL_LABEL[c.channel] ?? c.channel}: {c.perWeek}/week</Badge>)}
            </div>
          )}
        </Card>

        <Card title="KPIs" subtitle="Measured in Growth from tracked links and attribution.">
          <ul className="space-y-2">
            {plan.kpis.map((k, i) => (
              <li key={i} className="font-dm text-[13px]"><b className="text-[var(--a-ink)]">{k.name}</b>{k.target ? <Badge tone="info" className="ml-2">{k.target}</Badge> : null}<span className="block text-[12px] text-[var(--a-ink-3)]">{k.how}</span></li>
            ))}
          </ul>
          {plan.risks.length > 0 && (
            <>
              <p className="a-micro mt-4">Watch out for</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 font-dm text-[12.5px] text-[var(--a-ink-2)]">{plan.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </>
          )}
        </Card>
      </div>

      <Card title={<span className="inline-flex items-center gap-1.5"><CalendarRange size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Week by week</span>}>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plan.weekly.map((w) => (
            <li key={w.week} className="rounded-[var(--a-radius-control)] border border-[var(--a-border)] p-3">
              <p className="a-micro">Week {w.week}</p>
              <p className="mt-1 font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{w.focus}</p>
              <ul className="mt-1.5 space-y-1">{w.actions.map((a, i) => <li key={i} className="flex gap-1.5 font-dm text-[12.5px] text-[var(--a-ink-2)]"><Check size={13} className="mt-0.5 shrink-0 text-[var(--a-success)]" aria-hidden />{a}</li>)}</ul>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title={<span className="inline-flex items-center gap-1.5"><Mail size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Outreach</span>}
          action={
            <label className="inline-flex items-center gap-2 font-dm text-[12.5px] text-[var(--a-ink-2)]">
              <input type="checkbox" checked={plan.outreach.enabled} onChange={(e) => setPlan({ ...plan, outreach: { ...plan.outreach, enabled: e.target.checked } })} /> Create sequence
            </label>
          }
        >
          {plan.outreach.enabled ? (
            <div className="space-y-2 font-dm text-[13px]">
              <p className="text-[var(--a-ink-2)]">{plan.outreach.why}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.industries.map((x) => <Badge key={x} tone="info">{x}</Badge>)}
                {f.areas.map((x) => <Badge key={x} tone="neutral">{x}</Badge>)}
                {f.minScore > 0 && <Badge tone="orange">score {f.minScore}+</Badge>}
                {f.hasEmail && <Badge tone="success">has email</Badge>}
              </div>
              <ol className="space-y-1.5">
                {plan.outreach.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px]"><Badge tone="info">Day {s.dayOffset}</Badge><span className="truncate text-[var(--a-ink-2)]">{s.subject}{s.personalise ? " · AI personalised" : ""}</span></li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No outreach for this campaign.</p>
          )}
        </Card>
        <Card title={<span className="inline-flex items-center gap-1.5"><Gift size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Lead magnet idea</span>}>
          {plan.leadMagnet ? (
            <div className="space-y-1.5 font-dm text-[13px]">
              <p className="font-semibold text-[var(--a-ink)]">{plan.leadMagnet.title} <Badge tone="neutral" className="ml-1">{plan.leadMagnet.format}</Badge></p>
              <p className="text-[var(--a-ink-2)]">{plan.leadMagnet.hook}</p>
              <p className="text-[12px] text-[var(--a-ink-3)]">{plan.leadMagnet.why}</p>
              <p className="pt-1 text-[12px] text-[var(--a-ink-3)]">{acquire ? "You can build it from the campaign page in Acquire." : "Saved with the campaign as a suggestion."}</p>
            </div>
          ) : <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No lead magnet suggested.</p>}
        </Card>
      </div>
    </div>
  );
}
