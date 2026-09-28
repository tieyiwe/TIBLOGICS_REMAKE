"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Check, ClipboardCopy, CreditCard, History, Loader2, Search, ShieldCheck, Sparkles, UserRound, Wand2, XCircle,
} from "lucide-react";
import ToolkitShell from "./ToolkitShell";

export interface IndexEntry {
  id: string;
  vertical: string;
  category: string;
  title: string;
  useWhen: string;
}

export interface Finding {
  ruleId: string;
  severity: "high" | "medium" | "low";
  quote: string;
  index: number;
  why: string;
  basis: string;
  fix: string;
  source: "rule" | "ai";
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  kind: string;
  title: string;
  text: string;
  findings: Finding[];
}

interface Profile {
  businessName: string;
  vertical: string;
  location: string;
  audience: string;
  offer: string;
  voice: string;
  differentiators: string;
  compliance: string;
}

interface FullPrompt extends IndexEntry {
  prompt: string;
  proTip: string;
  fields: string[];
}

const INDUSTRIES: Array<[string, string]> = [
  ["realtor", "Real estate"],
  ["finance", "Financial services"],
  ["nonprofit", "Nonprofit"],
  ["agency", "Marketing agency"],
  ["restaurant", "Restaurant"],
  ["general", "General business"],
];

const input =
  "w-full px-3.5 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] bg-white";

async function post<T = Record<string, unknown>>(url: string, body: unknown, method = "POST"): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const data = (res ? await res.json().catch(() => ({})) : { error: "Could not reach the server." }) as T & { error?: string };
  return { ok: !!res?.ok, data };
}

// ── Findings ────────────────────────────────────────────────────────────────

function Highlighted({ text, findings }: { text: string; findings: Finding[] }) {
  const parts: Array<{ t: string; sev?: Finding["severity"] }> = [];
  let cursor = 0;
  for (const f of [...findings].sort((a, b) => a.index - b.index)) {
    if (f.index < cursor || text.slice(f.index, f.index + f.quote.length) !== f.quote) continue;
    parts.push({ t: text.slice(cursor, f.index) });
    parts.push({ t: f.quote, sev: f.severity });
    cursor = f.index + f.quote.length;
  }
  parts.push({ t: text.slice(cursor) });
  return (
    <div className="whitespace-pre-wrap font-dm text-sm leading-7 text-[#0D1B2A]">
      {parts.map((p, i) =>
        p.sev ? (
          <mark key={i} className={`rounded px-0.5 ${p.sev === "high" ? "bg-red-100 text-red-900" : p.sev === "medium" ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"}`}>{p.t}</mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </div>
  );
}

function FindingList({ findings, checked }: { findings: Finding[]; checked: boolean }) {
  if (!checked) return null;
  if (findings.length === 0) {
    return (
      <p className="flex items-center gap-2 font-dm text-sm text-green-700">
        <Check size={16} /> Nothing flagged. That is not a legal clearance; read it through before it goes out.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {findings.map((f, i) => (
        <li key={`${f.index}-${i}`} className="border border-[#D2DCE8] rounded-xl p-3.5 bg-white font-dm text-sm">
          <p className="flex items-start gap-2 font-semibold text-[#0D1B2A]">
            {f.severity === "high" ? <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className={`${f.severity === "medium" ? "text-amber-600" : "text-sky-600"} shrink-0 mt-0.5`} />}
            <span>&ldquo;{f.quote}&rdquo;</span>
            {f.source === "ai" && <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-[#7c3aed] font-bold">AI review</span>}
          </p>
          <p className="text-[#3A4A5C] mt-1">{f.why}</p>
          {f.fix && <p className="text-[#0F6E56] mt-1">Try: {f.fix}</p>}
          {f.basis && <p className="text-xs text-[#7A8FA6] mt-1">{f.basis}</p>}
        </li>
      ))}
    </ul>
  );
}

// ── Workspace ───────────────────────────────────────────────────────────────

export default function ToolkitWorkspace(props: {
  email: string;
  plan: { id: string; name: string; generate: boolean; monthlyRuns: number };
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  hasBilling: boolean;
  runsUsed: number;
  welcome: boolean;
  verticals: Array<{ id: string; label: string; count: number }>;
  index: IndexEntry[];
  history: HistoryItem[];
  profile: Profile;
}) {
  const router = useRouter();
  const tabs = [
    ...(props.plan.generate ? [{ id: "write", label: "Write", icon: Wand2 }] : []),
    { id: "guard", label: "Compliance Guard", icon: ShieldCheck },
    { id: "profile", label: "Business profile", icon: UserRound },
    { id: "history", label: "History", icon: History },
  ] as const;
  const profileEmpty = !props.profile.businessName;
  const [tab, setTab] = useState<string>(profileEmpty ? "profile" : tabs[0].id);
  const [runsLeft, setRunsLeft] = useState(Math.max(0, props.plan.monthlyRuns - props.runsUsed));
  const [billingBusy, setBillingBusy] = useState(false);

  async function billing() {
    setBillingBusy(true);
    const { ok, data } = await post<{ url?: string }>("/api/toolkit/billing", {});
    if (ok && data.url) window.location.href = data.url;
    else {
      alert(data.error ?? "Could not open billing.");
      setBillingBusy(false);
    }
  }

  return (
    <ToolkitShell email={props.email}>
      {props.welcome && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 font-dm text-sm text-green-800">
          You&apos;re subscribed to {props.plan.name}. Start by filling in your business profile so every draft sounds like you.
        </div>
      )}
      {props.status === "past_due" && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-dm text-sm text-amber-900">
          Your last payment failed. Update your card under Manage billing to keep access.
        </div>
      )}
      {props.cancelAtPeriodEnd && props.currentPeriodEnd && (
        <div className="mb-6 rounded-2xl border border-[#D2DCE8] bg-white p-4 font-dm text-sm text-[#3A4A5C]">
          Your plan is set to end on {new Date(props.currentPeriodEnd).toLocaleDateString()}.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-[#0D1B2A]">{props.plan.name}</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">
            {runsLeft} of {props.plan.monthlyRuns} AI runs left this month. The instant compliance check is unlimited.
          </p>
        </div>
        {props.hasBilling && (
          <button onClick={billing} disabled={billingBusy} className="btn-ghost text-sm self-start md:self-auto">
            {billingBusy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Manage billing
          </button>
        )}
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-[#D2DCE8]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-dm text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === t.id ? "border-[#B8500A] text-[#0D1B2A]" : "border-transparent text-[#7A8FA6] hover:text-[#0D1B2A]"}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "write" && (
          <WriteTab verticals={props.verticals} index={props.index} defaultVertical={props.profile.vertical} onRun={(left) => { setRunsLeft(left); router.refresh(); }} />
        )}
        {tab === "guard" && <GuardTab defaultVertical={props.profile.vertical} onRun={(left) => { if (left != null) setRunsLeft(left); router.refresh(); }} />}
        {tab === "profile" && <ProfileTab initial={props.profile} onSaved={() => router.refresh()} />}
        {tab === "history" && <HistoryTab items={props.history} />}
      </div>
    </ToolkitShell>
  );
}

// ── Write ───────────────────────────────────────────────────────────────────

function WriteTab(props: {
  verticals: Array<{ id: string; label: string; count: number }>;
  index: IndexEntry[];
  defaultVertical: string;
  onRun: (runsLeft: number) => void;
}) {
  const start = props.verticals.some((v) => v.id === props.defaultVertical) ? props.defaultVertical : props.verticals[0]?.id;
  const [vertical, setVertical] = useState(start);
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FullPrompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [deepBusy, setDeepBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Full prompt text already fetched this session, so repeat copies are instant.
  const [cache, setCache] = useState<Record<string, FullPrompt>>({});

  function flash(id: string) {
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  }

  /** Copy a prompt straight from the list, without opening it. */
  async function quickCopy(id: string) {
    let p = cache[id];
    if (!p) {
      const res = await fetch(`/api/toolkit/prompt/${encodeURIComponent(id)}`).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) : {};
      if (!res?.ok || !d.prompt) return setError(d.error ?? "Could not copy that prompt.");
      p = d.prompt as FullPrompt;
      setCache((c) => ({ ...c, [id]: p }));
    }
    try {
      await navigator.clipboard.writeText(p.prompt);
      flash(id);
    } catch {
      // Some browsers refuse clipboard access after a network wait; open it instead.
      open(id);
    }
  }

  /** The prompt with whatever fields have been filled in so far. */
  const filledPrompt = selected
    ? selected.fields.reduce((text, f) => (fields[f]?.trim() ? text.split(`[${f}]`).join(fields[f].trim()) : text), selected.prompt)
    : "";

  const categories = useMemo(() => [...new Set(props.index.filter((p) => p.vertical === vertical).map((p) => p.category))], [props.index, vertical]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return props.index.filter(
      (p) =>
        p.vertical === vertical &&
        (category === "all" || p.category === category) &&
        (!needle || p.title.toLowerCase().includes(needle) || p.useWhen.toLowerCase().includes(needle)),
    );
  }, [props.index, vertical, category, q]);

  useEffect(() => setCategory("all"), [vertical]);

  async function open(id: string) {
    setLoadingPrompt(true);
    setError(null);
    setOutput(null);
    setFindings([]);
    const res = await fetch(`/api/toolkit/prompt/${encodeURIComponent(id)}`).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setLoadingPrompt(false);
    if (!res?.ok) return setError(d.error ?? "Could not open that prompt.");
    setSelected(d.prompt);
    setCache((c) => ({ ...c, [d.prompt.id]: d.prompt }));
    setFields({});
    setExtra("");
  }

  async function run() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const { ok, data } = await post<{ output?: string; findings?: Finding[]; runsLeft?: number }>("/api/toolkit/generate", { promptId: selected.id, fields, extra });
    setBusy(false);
    if (!ok) return setError(data.error ?? "Generation failed.");
    setOutput(data.output ?? "");
    setFindings(data.findings ?? []);
    if (typeof data.runsLeft === "number") props.onRun(data.runsLeft);
  }

  async function deepCheck() {
    if (!output) return;
    setDeepBusy(true);
    const { ok, data } = await post<{ findings?: Finding[]; runsLeft?: number }>("/api/toolkit/check", { text: output, vertical, deep: true });
    setDeepBusy(false);
    if (!ok) return setError(data.error ?? "The deep check failed.");
    setFindings(data.findings ?? []);
    if (typeof data.runsLeft === "number") props.onRun(data.runsLeft);
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
      <aside className="bg-white border border-[#D2DCE8] rounded-2xl p-4 lg:sticky lg:top-6">
        <select className={input} value={vertical} onChange={(e) => setVertical(e.target.value)} aria-label="Industry">
          {props.verticals.map((v) => <option key={v.id} value={v.id}>{v.label} ({v.count})</option>)}
        </select>
        <select className={`${input} mt-2`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative mt-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
          <input className={`${input} pl-8`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts" />
        </div>
        <ul className="mt-3 max-h-[60vh] overflow-y-auto -mx-1">
          {list.map((p) => (
            <li key={p.id} className={`group flex items-start gap-1 rounded-lg ${selected?.id === p.id ? "bg-[#FEF6EE]" : "hover:bg-[#F4F7FB]"}`}>
              <button
                onClick={() => open(p.id)}
                className={`flex-1 text-left px-2.5 py-2 font-dm text-sm ${selected?.id === p.id ? "text-[#0D1B2A] font-semibold" : "text-[#3A4A5C]"}`}
              >
                {p.title}
              </button>
              <button
                onClick={() => quickCopy(p.id)}
                title="Copy this prompt"
                aria-label={`Copy the prompt: ${p.title}`}
                className="shrink-0 mt-1.5 mr-1 rounded-md p-1.5 text-[#7A8FA6] hover:bg-white hover:text-[#B8500A]"
              >
                {copiedId === p.id ? <Check size={14} className="text-green-600" /> : <ClipboardCopy size={14} />}
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-2.5 py-2 font-dm text-sm text-[#7A8FA6]">No prompts match.</li>}
        </ul>
      </aside>

      <section className="space-y-5 min-w-0">
        {!selected && !loadingPrompt && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center font-dm text-sm text-[#7A8FA6]">
            Pick a prompt on the left. Fill in what you know; anything you leave blank is taken from your business profile or kept as a placeholder.
          </div>
        )}
        {loadingPrompt && <div className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center"><Loader2 className="animate-spin inline text-[#7A8FA6]" /></div>}

        {selected && !loadingPrompt && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
            <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#B8500A]">{selected.category}</p>
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A] mt-1">{selected.title}</h2>
            <p className="font-dm text-sm text-[#3A4A5C] mt-2"><span className="font-semibold">Use this when:</span> {selected.useWhen}</p>
            <div className="mt-4 rounded-xl border border-[#E6EBF1] bg-[#F8FAFD] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#7A8FA6]">The prompt</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(filledPrompt).then(() => flash(`full:${selected.id}`)).catch(() => {})}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#D2DCE8] px-3 py-1.5 font-dm text-xs font-semibold text-[#0D1B2A] hover:border-[#B8500A]"
                >
                  {copiedId === `full:${selected.id}` ? <><Check size={13} className="text-green-600" /> Copied</> : <><ClipboardCopy size={13} /> Copy prompt</>}
                </button>
              </div>
              <p className="font-dm text-sm text-[#0D1B2A] mt-2 whitespace-pre-wrap leading-relaxed">{filledPrompt}</p>
              <p className="font-dm text-xs text-[#7A8FA6] mt-2">Copies with the fields you&apos;ve filled in below. Use it in any AI tool, or press &ldquo;Write it&rdquo; to have it written here with your business profile and a compliance check.</p>
            </div>
            {selected.fields.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                {selected.fields.map((f) => (
                  <label key={f} className="block">
                    <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{f.charAt(0) + f.slice(1).toLowerCase()}</span>
                    <input className={`${input} mt-1`} value={fields[f] ?? ""} onChange={(e) => setFields((prev) => ({ ...prev, [f]: e.target.value }))} placeholder="From your profile, or leave blank" />
                  </label>
                ))}
              </div>
            )}
            <label className="block mt-4">
              <span className="font-dm text-xs font-semibold text-[#3A4A5C]">Anything else it should know (optional)</span>
              <textarea className={`${input} mt-1 min-h-[70px]`} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Paste the lead's message, the listing details, the numbers…" />
            </label>
            {selected.proTip && <p className="font-dm text-xs text-[#7A8FA6] mt-3"><span className="font-semibold">Pro tip:</span> {selected.proTip}</p>}
            {error && <p className="font-dm text-sm text-red-600 mt-3">{error}</p>}
            <button onClick={run} disabled={busy} className="btn-primary mt-4 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {busy ? "Writing…" : "Write it"}
            </button>
          </div>
        )}

        {output != null && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Your draft</h3>
              <button
                onClick={() => { navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
                className="btn-ghost text-sm"
              >
                {copied ? <Check size={15} /> : <ClipboardCopy size={15} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-[#F8FAFD] p-4"><Highlighted text={output} findings={findings} /></div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Compliance Guard</h3>
              <button onClick={deepCheck} disabled={deepBusy} className="btn-secondary text-sm !py-1.5 disabled:opacity-60">
                {deepBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Deep check (1 run)
              </button>
            </div>
            <div className="mt-3"><FindingList findings={findings} checked /></div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Compliance Guard ────────────────────────────────────────────────────────

function GuardTab({ defaultVertical, onRun }: { defaultVertical: string; onRun: (runsLeft: number | null) => void }) {
  const [vertical, setVertical] = useState(defaultVertical || "general");
  const [text, setText] = useState("");
  const [checkedText, setCheckedText] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<"quick" | "deep" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(deep: boolean) {
    setBusy(deep ? "deep" : "quick");
    setError(null);
    const { ok, data } = await post<{ findings?: Finding[]; runsLeft?: number | null }>("/api/toolkit/check", { text, vertical, deep });
    setBusy(null);
    if (!ok && !data.findings) return setError(data.error ?? "The check failed.");
    if (!ok) setError(data.error ?? null);
    setFindings(data.findings ?? []);
    setCheckedText(text);
    setChecked(true);
    onRun(data.runsLeft ?? null);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
        <label className="font-dm text-xs font-semibold text-[#3A4A5C]">Industry rules to apply</label>
        <select className={`${input} mt-1`} value={vertical} onChange={(e) => setVertical(e.target.value)}>
          {INDUSTRIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <label className="block mt-4 font-dm text-xs font-semibold text-[#3A4A5C]">Text to check</label>
        <textarea className={`${input} mt-1 min-h-[260px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a listing, an email, a post, an ad…" maxLength={12000} />
        <p className="font-dm text-xs text-[#7A8FA6] mt-1">{text.length.toLocaleString()} / 12,000 characters</p>
        {error && <p className="font-dm text-sm text-red-600 mt-3">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => check(false)} disabled={!text.trim() || !!busy} className="btn-primary disabled:opacity-60">
            {busy === "quick" ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Check now
          </button>
          <button onClick={() => check(true)} disabled={!text.trim() || !!busy} className="btn-secondary disabled:opacity-60">
            {busy === "deep" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Deep check (1 run)
          </button>
        </div>
        <p className="font-dm text-xs text-[#7A8FA6] mt-4">
          &ldquo;Check now&rdquo; runs our phrase rules instantly and is unlimited. A deep check adds an AI review for risks that depend on context.
          Compliance Guard is a screening tool, not legal advice.
        </p>
      </div>
      <div className="space-y-4">
        {checked && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
            <Highlighted text={checkedText} findings={findings} />
          </div>
        )}
        <FindingList findings={findings} checked={checked} />
      </div>
    </div>
  );
}

// ── Profile ─────────────────────────────────────────────────────────────────

function ProfileTab({ initial, onSaved }: { initial: Profile; onSaved: () => void }) {
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Profile, v: string) => setP((prev) => ({ ...prev, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { ok, data } = await post("/api/toolkit/profile", p, "PUT");
    setBusy(false);
    setMsg(ok ? { ok: true, text: "Saved. Every draft now uses these details." } : { ok: false, text: data.error ?? "Could not save." });
    if (ok) onSaved();
  }

  const field = (k: keyof Profile, label: string, hint: string, area = false) => (
    <label className="block">
      <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{label}</span>
      {area ? (
        <textarea className={`${input} mt-1 min-h-[80px]`} value={p[k]} onChange={(e) => set(k, e.target.value)} placeholder={hint} />
      ) : (
        <input className={`${input} mt-1`} value={p[k]} onChange={(e) => set(k, e.target.value)} placeholder={hint} />
      )}
    </label>
  );

  return (
    <form onSubmit={save} className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6 max-w-3xl space-y-4">
      <p className="font-dm text-sm text-[#3A4A5C]">
        This is what the writer knows about you. The more specific it is, the less you have to fill in each time.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {field("businessName", "Business name", "Rivera Realty Group")}
        <label className="block">
          <span className="font-dm text-xs font-semibold text-[#3A4A5C]">Industry</span>
          <select className={`${input} mt-1`} value={p.vertical} onChange={(e) => set("vertical", e.target.value)}>
            {INDUSTRIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        {field("location", "Where you work", "Austin, Texas")}
        {field("voice", "Your voice", "Warm, plain-spoken, no jargon")}
      </div>
      {field("audience", "Your customers", "First-time buyers and downsizing retirees in central Austin", true)}
      {field("offer", "What you sell", "Residential buying and selling, relocation help", true)}
      {field("differentiators", "What sets you apart", "15 years in Travis County; bilingual (English/Spanish)", true)}
      {field("compliance", "Required disclosures and licensing", "Brokerage: Rivera Realty Group, TREC #0000000. Equal Housing Opportunity.", true)}
      {msg && <p className={`font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
        {busy && <Loader2 size={15} className="animate-spin" />} Save profile
      </button>
    </form>
  );
}

// ── History ─────────────────────────────────────────────────────────────────

function HistoryTab({ items }: { items: HistoryItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (items.length === 0) {
    return <p className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center font-dm text-sm text-[#7A8FA6]">Nothing yet. Your drafts and checks appear here.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="bg-white border border-[#D2DCE8] rounded-2xl">
          <button onClick={() => setOpen(open === it.id ? null : it.id)} className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left">
            <span className="min-w-0">
              <span className="block font-dm text-sm font-semibold text-[#0D1B2A] truncate">{it.title}</span>
              <span className="block font-dm text-xs text-[#7A8FA6]">
                {new Date(it.createdAt).toLocaleString()} · {it.findings.length} flag{it.findings.length === 1 ? "" : "s"}
              </span>
            </span>
            {it.kind === "generate" ? <Wand2 size={15} className="text-[#B8500A] shrink-0" /> : <ShieldCheck size={15} className="text-[#2251A3] shrink-0" />}
          </button>
          {open === it.id && (
            <div className="px-5 pb-5 space-y-4">
              <div className="rounded-xl bg-[#F8FAFD] p-4"><Highlighted text={it.text} findings={it.findings} /></div>
              <FindingList findings={it.findings} checked />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
