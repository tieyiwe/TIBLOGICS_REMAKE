"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Check, ClipboardCopy, CreditCard, History, Loader2, Search, ShieldCheck, Sparkles, UserRound, Wand2, XCircle,
} from "lucide-react";
import ToolkitShell from "./ToolkitShell";
import { useLocale, useT } from "@/lib/i18n/client";
import { INDUSTRY_IDS, categoryKey, industryKey, libraryKey, ruleKey } from "@/lib/toolkit/labels";

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

interface SearchHit {
  id: string;
  vertical: string;
  verticalLabel: string;
  category: string;
  title: string;
  useWhen: string;
  match: "exact" | "close";
  snippet: string;
}
interface SearchResult {
  hits: SearchHit[];
  unmatched: string[];
  didYouMean: string | null;
}

interface FullPrompt extends IndexEntry {
  prompt: string;
  proTip: string;
  fields: string[];
}

type Translate = ReturnType<typeof useT>;

/** t(key), or `fallback` when the dictionary has no such key. */
function tOr(t: Translate, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/** "[AUDIENCE, e.g. first-time buyers]" is a label plus an example, in any of the three languages. */
const EXAMPLE_SPLIT = /,\s*(?:e\.g\.|p\.\s?ex\.|par ex(?:emple)?\.?|k\.m\.|kwa mfano)\s*/i;

const input =
  "w-full px-3.5 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] bg-white";

async function post<T = Record<string, unknown>>(url: string, body: unknown, networkError: string, method = "POST"): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const data = (res ? await res.json().catch(() => ({})) : { error: networkError }) as T & { error?: string };
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
  const t = useT();
  if (!checked) return null;
  if (findings.length === 0) {
    return (
      <p className="flex items-center gap-2 font-dm text-sm text-green-700">
        <Check size={16} className="shrink-0" /> {t("toolkit.find.none")}
      </p>
    );
  }
  // Rule findings are shown in the reader's language by rule id (history
  // stores the English); AI findings are already in their language.
  const text = (f: Finding, part: "why" | "basis" | "fix") => (f.source === "rule" ? tOr(t, ruleKey(f.ruleId, part), f[part]) : f[part]);
  return (
    <ul className="space-y-2.5">
      {findings.map((f, i) => (
        <li key={`${f.index}-${i}`} className="border border-[#D2DCE8] rounded-xl p-3.5 bg-white font-dm text-sm">
          <p className="flex items-start gap-2 font-semibold text-[#0D1B2A]">
            {f.severity === "high" ? <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className={`${f.severity === "medium" ? "text-amber-600" : "text-sky-600"} shrink-0 mt-0.5`} />}
            <span>&ldquo;{f.quote}&rdquo;</span>
            {f.source === "ai" && <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-[#7c3aed] font-bold">{t("toolkit.find.aiReview")}</span>}
          </p>
          <p className="text-[#3A4A5C] mt-1">{text(f, "why")}</p>
          {f.fix && <p className="text-[#0F6E56] mt-1">{t("toolkit.find.try")} {text(f, "fix")}</p>}
          {f.basis && <p className="text-xs text-[#7A8FA6] mt-1">{text(f, "basis")}</p>}
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
  /** Some prompt categories are still being translated (shown in English). */
  indexPending: boolean;
  history: HistoryItem[];
  profile: Profile;
}) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const tabs = [
    ...(props.plan.generate ? [{ id: "write", label: t("toolkit.tab.write"), icon: Wand2 }] : []),
    { id: "guard", label: t("toolkit.tab.guard"), icon: ShieldCheck },
    { id: "profile", label: t("toolkit.tab.profile"), icon: UserRound },
    { id: "history", label: t("toolkit.tab.history"), icon: History },
  ] as const;
  const profileEmpty = !props.profile.businessName;
  const [tab, setTab] = useState<string>(profileEmpty ? "profile" : tabs[0].id);
  const [runsLeft, setRunsLeft] = useState(Math.max(0, props.plan.monthlyRuns - props.runsUsed));
  const [billingBusy, setBillingBusy] = useState(false);

  async function billing() {
    setBillingBusy(true);
    const { ok, data } = await post<{ url?: string }>("/api/toolkit/billing", {}, t("toolkit.err.network"));
    if (ok && data.url) window.location.href = data.url;
    else {
      alert(data.error ?? t("toolkit.ws.billingFailed"));
      setBillingBusy(false);
    }
  }

  return (
    <ToolkitShell email={props.email}>
      {props.welcome && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 font-dm text-sm text-green-800">
          {t("toolkit.ws.welcome", { plan: props.plan.name })}
        </div>
      )}
      {props.status === "past_due" && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-dm text-sm text-amber-900">
          {t("toolkit.ws.pastDue")}
        </div>
      )}
      {props.cancelAtPeriodEnd && props.currentPeriodEnd && (
        <div className="mb-6 rounded-2xl border border-[#D2DCE8] bg-white p-4 font-dm text-sm text-[#3A4A5C]">
          {t("toolkit.ws.endsOn", { date: new Date(props.currentPeriodEnd).toLocaleDateString(locale, { dateStyle: "long" }) })}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-[#0D1B2A]">{props.plan.name}</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">
            {t("toolkit.ws.runsLeft", { left: runsLeft.toLocaleString(locale), total: props.plan.monthlyRuns.toLocaleString(locale) })}
          </p>
        </div>
        {props.hasBilling && (
          <button onClick={billing} disabled={billingBusy} className="btn-ghost text-sm self-start md:self-auto">
            {billingBusy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} {t("toolkit.ws.manageBilling")}
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
          <WriteTab verticals={props.verticals} index={props.index} pending={props.indexPending} defaultVertical={props.profile.vertical} onRun={(left) => { setRunsLeft(left); router.refresh(); }} />
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
  pending: boolean;
  defaultVertical: string;
  onRun: (runsLeft: number) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const start = props.verticals.some((v) => v.id === props.defaultVertical) ? props.defaultVertical : props.verticals[0]?.id;
  const [vertical, setVertical] = useState(start);
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [allIndustries, setAllIndustries] = useState(false);
  const [search, setSearch] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  // Keyword search runs on the server (it reads the prompt text itself),
  // shortly after typing stops.
  const needle = q.trim();
  useEffect(() => {
    if (needle.length < 2) {
      setSearch(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ q: needle, ...(allIndustries ? {} : { vertical }) });
      const res = await fetch(`/api/toolkit/search?${params}`).catch(() => null);
      const d = res?.ok ? ((await res.json().catch(() => null)) as SearchResult | null) : null;
      if (!cancelled) {
        setSearch(d);
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // locale: results come back in the interface language, so switching language re-runs the search.
  }, [needle, vertical, allIndustries, locale]);
  const [selected, setSelected] = useState<FullPrompt | null>(null);
  /** The open prompt is the English one because its category is still being translated. */
  const [selectedPending, setSelectedPending] = useState(false);
  const [deepDone, setDeepDone] = useState(false);
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
  const [cache, setCache] = useState<Record<string, { prompt: FullPrompt; pending: boolean }>>({});

  function flash(id: string) {
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  }

  /** Copy a prompt straight from the list, without opening it. */
  async function quickCopy(id: string) {
    let p = cache[id]?.prompt;
    if (!p) {
      const res = await fetch(`/api/toolkit/prompt/${encodeURIComponent(id)}`).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) : {};
      if (!res?.ok || !d.prompt) return setError(d.error ?? t("toolkit.write.copyFailed"));
      const got = d.prompt as FullPrompt;
      p = got;
      setCache((c) => ({ ...c, [id]: { prompt: got, pending: !!d.pending } }));
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
  const list = useMemo(
    () => props.index.filter((p) => p.vertical === vertical && (category === "all" || p.category === category)),
    [props.index, vertical, category],
  );
  const labelOf = (v: string) => tOr(t, libraryKey(v), props.verticals.find((x) => x.id === v)?.label ?? v);
  const catLabel = (c: string) => tOr(t, categoryKey(c), c);
  const hits = (search?.hits ?? []).filter((h) => category === "all" || allIndustries || h.category === category);
  const exactHits = hits.filter((h) => h.match === "exact");
  const closeHits = hits.filter((h) => h.match === "close");

  useEffect(() => setCategory("all"), [vertical]);

  async function open(id: string) {
    setLoadingPrompt(true);
    setError(null);
    setOutput(null);
    setFindings([]);
    const res = await fetch(`/api/toolkit/prompt/${encodeURIComponent(id)}`).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setLoadingPrompt(false);
    if (!res?.ok) return setError(d.error ?? t("toolkit.write.openFailed"));
    setSelected(d.prompt);
    setSelectedPending(!!d.pending);
    setDeepDone(false);
    setCache((c) => ({ ...c, [d.prompt.id]: { prompt: d.prompt, pending: !!d.pending } }));
    setFields({});
    setExtra("");
  }

  async function run() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const { ok, data } = await post<{ output?: string; findings?: Finding[]; runsLeft?: number }>(
      "/api/toolkit/generate",
      // "english": the fields above belong to the English prompt, so the server uses that version.
      { promptId: selected.id, fields, extra, english: selectedPending },
      t("toolkit.err.network"),
    );
    setBusy(false);
    if (!ok) return setError(data.error ?? t("toolkit.write.genFailed"));
    setOutput(data.output ?? "");
    setFindings(data.findings ?? []);
    setDeepDone(false);
    if (typeof data.runsLeft === "number") props.onRun(data.runsLeft);
  }

  async function deepCheck() {
    if (!output) return;
    setDeepBusy(true);
    const { ok, data } = await post<{ findings?: Finding[]; runsLeft?: number }>("/api/toolkit/check", { text: output, vertical, deep: true }, t("toolkit.err.network"));
    setDeepBusy(false);
    if (!ok) return setError(data.error ?? t("toolkit.guard.deepFailed"));
    setFindings(data.findings ?? []);
    setDeepDone(true);
    if (typeof data.runsLeft === "number") props.onRun(data.runsLeft);
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
      <aside className="bg-white border border-[#D2DCE8] rounded-2xl p-4 lg:sticky lg:top-6">
        {props.pending && (
          <p className="mb-2 rounded-xl bg-[#F4F7FB] border border-[#D2DCE8] px-3 py-2 font-dm text-xs text-[#3A4A5C]">{t("common.translationPending")}</p>
        )}
        <select className={input} value={vertical} onChange={(e) => setVertical(e.target.value)} aria-label={t("toolkit.write.industry")}>
          {props.verticals.map((v) => <option key={v.id} value={v.id}>{labelOf(v.id)} ({v.count})</option>)}
        </select>
        {["medical", "social-work", "legal", "hr", "insurance"].includes(vertical) && (
          <p className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 font-dm text-xs text-amber-900">
            {t("toolkit.write.privacy")}
          </p>
        )}
        <select className={`${input} mt-2`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t("toolkit.write.category")}>
          <option value="all">{t("toolkit.write.allCategories")}</option>
          {categories.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
        </select>
        <div className="relative mt-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
          <input className={`${input} pl-8`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("toolkit.write.searchPlaceholder")} aria-label={t("toolkit.write.searchPlaceholder")} />
        </div>
        <label className="mt-2 flex items-center gap-2 font-dm text-xs text-[#3A4A5C]">
          <input type="checkbox" checked={allIndustries} onChange={(e) => setAllIndustries(e.target.checked)} className="accent-[#F47C20]" />
          {t("toolkit.write.searchAll")}
        </label>

        {needle.length >= 2 ? (
          <div className="mt-3 max-h-[60vh] overflow-y-auto -mx-1">
            {searching && !search && <p className="px-2.5 py-2 font-dm text-sm text-[#7A8FA6]">{t("toolkit.write.searching")}</p>}
            {search?.didYouMean && (
              <p className="px-2.5 pb-2 font-dm text-xs text-[#3A4A5C]">
                {t("toolkit.write.didYouMean").split("{q}")[0]}
                <button onClick={() => setQ(search.didYouMean!)} className="font-semibold text-[#2251A3] underline">{search.didYouMean}</button>
                {t("toolkit.write.didYouMean").split("{q}")[1]}
              </p>
            )}
            {search && hits.length === 0 && (
              <p className="px-2.5 py-2 font-dm text-sm text-[#7A8FA6]">
                {t(allIndustries ? "toolkit.write.noMatch" : "toolkit.write.noMatchIndustry", { q: needle })}{" "}
                {!allIndustries && <button onClick={() => setAllIndustries(true)} className="text-[#2251A3] underline">{t("toolkit.write.searchAll")}</button>}
              </p>
            )}
            {[[t("toolkit.write.bestMatches"), exactHits], [t("toolkit.write.closeMatches"), closeHits]].map(([heading, group]) =>
              (group as SearchHit[]).length === 0 ? null : (
                <div key={heading as string}>
                  <p className="px-2.5 pt-2 pb-1 font-dm text-[11px] font-bold uppercase tracking-wider text-[#7A8FA6]">
                    {heading as string} ({(group as SearchHit[]).length})
                  </p>
                  <ul>
                    {(group as SearchHit[]).map((h) => (
                      <li key={h.id} className={`flex items-start gap-1 rounded-lg ${selected?.id === h.id ? "bg-[#FEF6EE]" : "hover:bg-[#F4F7FB]"}`}>
                        <button onClick={() => open(h.id)} className="flex-1 min-w-0 text-left px-2.5 py-2 font-dm">
                          <span className={`block text-sm ${selected?.id === h.id ? "font-semibold text-[#0D1B2A]" : "text-[#0D1B2A]"}`}>{h.title}</span>
                          <span className="block text-[11px] text-[#7A8FA6] mt-0.5">
                            {allIndustries ? `${labelOf(h.vertical)} · ` : ""}{catLabel(h.category)}
                          </span>
                          <span className="block text-xs text-[#3A4A5C] mt-0.5 line-clamp-2">{h.snippet}</span>
                        </button>
                        <button
                          onClick={() => quickCopy(h.id)}
                          title={t("toolkit.write.copyTitle")}
                          aria-label={t("toolkit.write.copyAria", { title: h.title })}
                          className="shrink-0 mt-1.5 mr-1 rounded-md p-1.5 text-[#7A8FA6] hover:bg-white hover:text-[#B8500A]"
                        >
                          {copiedId === h.id ? <Check size={14} className="text-green-600" /> : <ClipboardCopy size={14} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        ) : (
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
                title={t("toolkit.write.copyTitle")}
                aria-label={t("toolkit.write.copyAria", { title: p.title })}
                className="shrink-0 mt-1.5 mr-1 rounded-md p-1.5 text-[#7A8FA6] hover:bg-white hover:text-[#B8500A]"
              >
                {copiedId === p.id ? <Check size={14} className="text-green-600" /> : <ClipboardCopy size={14} />}
              </button>
            </li>
          ))}
        </ul>
        )}
      </aside>

      <section className="space-y-5 min-w-0">
        {!selected && !loadingPrompt && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center font-dm text-sm text-[#7A8FA6]">
            {t("toolkit.write.empty")}
          </div>
        )}
        {loadingPrompt && <div className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center"><Loader2 className="animate-spin inline text-[#7A8FA6]" /></div>}

        {selected && !loadingPrompt && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
            <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#B8500A]">{catLabel(selected.category)}</p>
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A] mt-1">{selected.title}</h2>
            {selectedPending && (
              <p className="mt-2 rounded-xl bg-[#F4F7FB] border border-[#D2DCE8] px-3 py-2 font-dm text-xs text-[#3A4A5C]">{t("toolkit.write.englishPrompt")}</p>
            )}
            <p className="font-dm text-sm text-[#3A4A5C] mt-2"><span className="font-semibold">{t("toolkit.write.useWhen")}</span> {selected.useWhen}</p>
            <div className="mt-4 rounded-xl border border-[#E6EBF1] bg-[#F8FAFD] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#7A8FA6]">{t("toolkit.write.thePrompt")}</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(filledPrompt).then(() => flash(`full:${selected.id}`)).catch(() => {})}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#D2DCE8] px-3 py-1.5 font-dm text-xs font-semibold text-[#0D1B2A] hover:border-[#B8500A]"
                >
                  {copiedId === `full:${selected.id}` ? <><Check size={13} className="text-green-600" /> {t("toolkit.write.copied")}</> : <><ClipboardCopy size={13} /> {t("toolkit.write.copyPrompt")}</>}
                </button>
              </div>
              <p className="font-dm text-sm text-[#0D1B2A] mt-2 whitespace-pre-wrap leading-relaxed">{filledPrompt}</p>
              <p className="font-dm text-xs text-[#7A8FA6] mt-2">{t("toolkit.write.copyHelp", { button: t("toolkit.write.run") })}</p>
            </div>
            {selected.fields.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                {selected.fields.map((f) => {
                  // "[AUDIENCE, e.g. first-time buyers]" shows as a label plus an example.
                  const [name, ...rest] = f.split(EXAMPLE_SPLIT);
                  const example = rest.join(", ");
                  return (
                    <label key={f} className="block">
                      <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{name.charAt(0) + name.slice(1).toLowerCase()}</span>
                      <input className={`${input} mt-1`} value={fields[f] ?? ""} onChange={(e) => setFields((prev) => ({ ...prev, [f]: e.target.value }))} placeholder={example ? t("toolkit.write.example", { x: example }) : t("toolkit.write.fieldPlaceholder")} />
                    </label>
                  );
                })}
              </div>
            )}
            <label className="block mt-4">
              <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{t("toolkit.write.extra")}</span>
              <textarea className={`${input} mt-1 min-h-[70px]`} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={t("toolkit.write.extraPlaceholder")} />
            </label>
            {selected.proTip && <p className="font-dm text-xs text-[#7A8FA6] mt-3"><span className="font-semibold">{t("toolkit.write.proTip")}</span> {selected.proTip}</p>}
            {error && <p className="font-dm text-sm text-red-600 mt-3">{error}</p>}
            <button onClick={run} disabled={busy} className="btn-primary mt-4 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {busy ? t("toolkit.write.running") : t("toolkit.write.run")}
            </button>
          </div>
        )}

        {output != null && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{t("toolkit.write.draft")}</h3>
              <button
                onClick={() => { navigator.clipboard.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
                className="btn-ghost text-sm"
              >
                {copied ? <Check size={15} /> : <ClipboardCopy size={15} />} {copied ? t("toolkit.write.copied") : t("toolkit.write.copy")}
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-[#F8FAFD] p-4"><Highlighted text={output} findings={findings} /></div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Compliance Guard</h3>
              <button onClick={deepCheck} disabled={deepBusy} className="btn-secondary text-sm !py-1.5 disabled:opacity-60">
                {deepBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} {t("toolkit.guard.deep")}
              </button>
            </div>
            {/* The instant rules read English. A draft in another language gets a pointer to the deep check instead of a misleading "nothing flagged". */}
            <div className="mt-3">
              {locale !== "en" && !deepDone && findings.length === 0 ? (
                <p className="flex items-start gap-2 font-dm text-sm text-[#3A4A5C]"><AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" /> {t("toolkit.guard.draftNote")}</p>
              ) : (
                <FindingList findings={findings} checked />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Compliance Guard ────────────────────────────────────────────────────────

function GuardTab({ defaultVertical, onRun }: { defaultVertical: string; onRun: (runsLeft: number | null) => void }) {
  const t = useT();
  const locale = useLocale();
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
    const { ok, data } = await post<{ findings?: Finding[]; runsLeft?: number | null }>("/api/toolkit/check", { text, vertical, deep }, t("toolkit.err.network"));
    setBusy(null);
    if (!ok && !data.findings) return setError(data.error ?? t("toolkit.guard.checkFailed"));
    if (!ok) setError(data.error ?? null);
    setFindings(data.findings ?? []);
    setCheckedText(text);
    setChecked(true);
    onRun(data.runsLeft ?? null);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
        <label htmlFor="guard-industry" className="font-dm text-xs font-semibold text-[#3A4A5C]">{t("toolkit.guard.industryRules")}</label>
        <select id="guard-industry" className={`${input} mt-1`} value={vertical} onChange={(e) => setVertical(e.target.value)}>
          {INDUSTRY_IDS.map((id) => <option key={id} value={id}>{t(industryKey(id))}</option>)}
        </select>
        <label htmlFor="guard-text" className="block mt-4 font-dm text-xs font-semibold text-[#3A4A5C]">{t("toolkit.guard.textLabel")}</label>
        <textarea id="guard-text" className={`${input} mt-1 min-h-[260px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("toolkit.guard.placeholder")} maxLength={12000} />
        <p className="font-dm text-xs text-[#7A8FA6] mt-1">{t("toolkit.guard.chars", { n: text.length.toLocaleString(locale), max: (12000).toLocaleString(locale) })}</p>
        {error && <p className="font-dm text-sm text-red-600 mt-3">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => check(false)} disabled={!text.trim() || !!busy} className="btn-primary disabled:opacity-60">
            {busy === "quick" ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} {t("toolkit.guard.checkNow")}
          </button>
          <button onClick={() => check(true)} disabled={!text.trim() || !!busy} className="btn-secondary disabled:opacity-60">
            {busy === "deep" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {t("toolkit.guard.deep")}
          </button>
        </div>
        <p className="font-dm text-xs text-[#7A8FA6] mt-4">{t("toolkit.guard.help", { check: t("toolkit.guard.checkNow") })}</p>
        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-[#F4F7FB] border border-[#D2DCE8] px-3 py-2 font-dm text-xs text-[#3A4A5C]">
          <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" /> {t("toolkit.guard.englishNote")}
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
  const t = useT();
  const [p, setP] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Profile, v: string) => setP((prev) => ({ ...prev, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { ok, data } = await post("/api/toolkit/profile", p, t("toolkit.err.network"), "PUT");
    setBusy(false);
    setMsg(ok ? { ok: true, text: t("toolkit.profile.saved") } : { ok: false, text: data.error ?? t("toolkit.profile.saveFailed") });
    if (ok) onSaved();
  }

  // Label and example come from toolkit.profile.<field> and toolkit.profile.<field>.hint.
  const field = (k: keyof Profile, area = false) => {
    const label = t(`toolkit.profile.${k}`);
    const hint = t(`toolkit.profile.${k}.hint`);
    return (
    <label className="block">
      <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{label}</span>
      {area ? (
        <textarea className={`${input} mt-1 min-h-[80px]`} value={p[k]} onChange={(e) => set(k, e.target.value)} placeholder={hint} />
      ) : (
        <input className={`${input} mt-1`} value={p[k]} onChange={(e) => set(k, e.target.value)} placeholder={hint} />
      )}
    </label>
    );
  };

  return (
    <form onSubmit={save} className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6 max-w-3xl space-y-4">
      <p className="font-dm text-sm text-[#3A4A5C]">
        {t("toolkit.profile.intro")}
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {field("businessName")}
        <label className="block">
          <span className="font-dm text-xs font-semibold text-[#3A4A5C]">{t("toolkit.profile.vertical")}</span>
          <select className={`${input} mt-1`} value={p.vertical} onChange={(e) => set("vertical", e.target.value)}>
            {INDUSTRY_IDS.map((id) => <option key={id} value={id}>{t(industryKey(id))}</option>)}
          </select>
        </label>
        {field("location")}
        {field("voice")}
      </div>
      {field("audience", true)}
      {field("offer", true)}
      {field("differentiators", true)}
      {field("compliance", true)}
      {msg && <p className={`font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
        {busy && <Loader2 size={15} className="animate-spin" />} {t("toolkit.profile.save")}
      </button>
    </form>
  );
}

// ── History ─────────────────────────────────────────────────────────────────

function HistoryTab({ items }: { items: HistoryItem[] }) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState<string | null>(null);
  if (items.length === 0) {
    return <p className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center font-dm text-sm text-[#7A8FA6]">{t("toolkit.history.empty")}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="bg-white border border-[#D2DCE8] rounded-2xl">
          <button onClick={() => setOpen(open === it.id ? null : it.id)} className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left">
            <span className="min-w-0">
              <span className="block font-dm text-sm font-semibold text-[#0D1B2A] truncate">{it.title}</span>
              <span className="block font-dm text-xs text-[#7A8FA6]">
                {new Date(it.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })} · {t(it.findings.length === 1 ? "toolkit.history.flags.one" : "toolkit.history.flags.other", { n: it.findings.length })}
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
