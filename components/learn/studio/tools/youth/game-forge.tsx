"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Copy, ExternalLink, Gamepad2, Link2, Plus, RotateCcw, Settings2, Share2, Trash2, Wand2 } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import { fmtDate } from "@/lib/learn/format";
import { useStudioLayout } from "../../StudioFrame";
import { MissionBoard, SANDBOX, Y, YouthBar, YouthLocked, keys, useChallengeFlow, type T } from "./kit";
import GamePreview, { type GameEvent } from "./game-forge-preview";
import ChangePanel, { type Proposal } from "./game-forge-change";
import GameSettings, { issueText } from "./game-forge-settings";
import { CHALLENGES, CHALLENGE_TEMPLATE, EMPTY_LOG, missions, type ChallengeId, type PlayLog } from "@/lib/learn/game-forge/missions";
import { TEMPLATES, parseConfig, type GameConfig, type TemplateId } from "@/lib/learn/game-forge/schema";
import { TEMPLATE_ICON, starterConfig } from "@/lib/learn/game-forge/templates";
import { checkLevels } from "@/lib/learn/game-forge/reach";
import { engineLabels } from "@/lib/learn/game-forge/labels";
import type { ProjectSummary, ShareSummary, VersionSummary } from "@/lib/learn/game-forge/db";

// Game Forge (AI-Empowered Youth, flagship Studio tool). Pick a game
// template, change it by talking to the AI, with quick changes or with the
// controls, give adventure characters a personality, and share a playable
// link with family. Projects and versions are saved per learner
// (/api/learn/game-forge/*); when saving is unavailable the game still works
// in the tab. Phones: tabs Game / Change it / Settings. Wide screens: the
// game on the left, Change it / Settings on the right.

const TOOL = "game-forge";
const NS = `studio.${TOOL}`;
const IDS = [...CHALLENGES] as string[];
const ICONS: Record<string, string> = { "clicker-remix": "🍪", "quiz-maker": "❓", "platformer-levels": "🐸", "npc-friend": "🧙" };
const API = "/api/learn/game-forge";

type Tab = "game" | "change" | "settings";
type Store = "loading" | "ready" | "offline" | "blocked";
type SaveState = "idle" | "saving" | "saved" | "failed" | "local";
interface Open {
  id: string | null;
  template: TemplateId;
}

function useIsWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

async function api<R>(path: string, init?: { method?: string; body?: unknown }): Promise<{ ok: true; data: R } | { ok: false; status: number; error: string; code?: string }> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  }).catch(() => null);
  const d = res ? await res.json().catch(() => ({})) : {};
  if (!res || !res.ok) return { ok: false, status: res?.status ?? 0, error: typeof d.error === "string" ? d.error : "", code: d.code };
  return { ok: true, data: d as R };
}

function reduceLog(l: PlayLog, e: GameEvent): PlayLog {
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  switch (e.ev) {
    case "clicks":
      return { ...l, clicks: Math.max(l.clicks, n(e.data.clicks)) };
    case "buy":
      return { ...l, bought: true };
    case "win":
      return { ...l, won: true, allCoins: l.allCoins || e.data.allCoins === true };
    case "quiz":
      return { ...l, quiz: { score: n(e.data.score), total: n(e.data.total), answered: n(e.data.answered) } };
    case "level":
      return l.levels.includes(n(e.data.index)) ? l : { ...l, levels: [...l.levels, n(e.data.index)] };
    case "quest":
      return { ...l, quest: true, questAllItems: l.questAllItems || (n(e.data.total) > 0 && n(e.data.got) >= n(e.data.total)) };
    default:
      return l;
  }
}

export default function GameForge({ challengeId, embedded, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const locale = useLocale();
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const flow = useChallengeFlow({ tool: TOOL, ids: IDS, challengeId, progress, onComplete });
  const mode = flow.mode;
  const isChallenge = flow.isChallenge;
  const wantTemplate: TemplateId | null = isChallenge ? CHALLENGE_TEMPLATE[mode as ChallengeId] : null;
  const layout = useStudioLayout();
  const bigScreen = useIsWide();
  const wide = bigScreen && layout !== "embedded";

  const [store, setStore] = useState<Store>("loading");
  const [notice, setNotice] = useState("");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [shares, setShares] = useState<ShareSummary[]>([]);
  const [open, setOpen] = useState<Open | null>(null);
  const [working, setWorking] = useState<GameConfig | null>(null);
  const [lastValid, setLastValid] = useState<GameConfig | null>(null);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [tab, setTab] = useState<Tab>("game");
  const [rightTab, setRightTab] = useState<Exclude<Tab, "game">>("change");
  const [restart, setRestart] = useState(0);
  const [log, setLog] = useState<{ key: string; log: PlayLog }>({ key: "", log: EMPTY_LOG });
  const [claimed, setClaimed] = useState<{ stars: number; improved: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const savedJson = useRef("");
  const autoOpened = useRef<string>("");

  const dates = useCallback((iso: string) => fmtDate(iso, locale), [locale]);
  const labels = useMemo(() => engineLabels((key) => t(key)), [t]);

  // ── Load the learner's games ──────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    api<{ projects: ProjectSummary[]; shares: ShareSummary[] }>("/projects").then((r) => {
      if (!live) return;
      if (r.ok) {
        setProjects(r.data.projects);
        setShares(r.data.shares);
        setStore("ready");
      } else if (r.status === 401 || r.status === 402 || r.status === 403) {
        setNotice(r.error || k("api.blocked"));
        setStore("blocked");
      } else {
        setNotice(k("offline"));
        setStore("offline");
      }
    });
    return () => {
      live = false;
    };
  }, [k]);

  const show = useCallback((id: string | null, template: TemplateId, config: GameConfig, vs: VersionSummary[]) => {
    setOpen({ id, template });
    setWorking(config);
    setLastValid(config);
    setVersions(vs);
    setProposal(null);
    setClaimed(null);
    setShareOpen(false);
    savedJson.current = JSON.stringify(config);
    setSave(id ? "idle" : "local");
  }, []);

  const openProject = useCallback(
    async (id: string) => {
      setBusy(true);
      const r = await api<{ project: ProjectSummary & { config: GameConfig }; versions: VersionSummary[] }>(`/projects/${encodeURIComponent(id)}`);
      setBusy(false);
      if (!r.ok) {
        setNotice(r.error || k("api.store"));
        return;
      }
      const parsed = parseConfig(r.data.project.config);
      show(id, r.data.project.template, parsed.ok ? parsed.config : starterConfig(r.data.project.template), r.data.versions);
    },
    [k, show],
  );

  const startNew = useCallback(
    async (template: TemplateId) => {
      if (store !== "ready") {
        show(null, template, starterConfig(template), []);
        return;
      }
      setBusy(true);
      const r = await api<{ project: ProjectSummary & { config: GameConfig }; versions: VersionSummary[] }>("/projects", { method: "POST", body: { template } });
      setBusy(false);
      if (!r.ok) {
        setNotice(r.error || k("api.store"));
        if (r.code === "store") show(null, template, starterConfig(template), []);
        return;
      }
      const p = r.data.project;
      setProjects((l) => [{ id: p.id, template: p.template, title: p.title, version: p.version, updatedAt: p.updatedAt }, ...l]);
      show(p.id, p.template, p.config, r.data.versions);
    },
    [k, show, store],
  );

  // A challenge opens the learner's latest game of its template.
  useEffect(() => {
    if (store === "loading" || store === "blocked") return;
    if (!wantTemplate) return;
    if (open && open.template === wantTemplate) return;
    const key = `${mode}:${store}`;
    if (autoOpened.current === key) return;
    autoOpened.current = key;
    const mine = projects.find((p) => p.template === wantTemplate);
    if (mine) void openProject(mine.id);
    else {
      setOpen(null);
      setWorking(null);
    }
  }, [store, wantTemplate, open, projects, mode, openProject]);

  // ── The game on screen ───────────────────────────────────────────────────
  const parsed = useMemo(() => (working ? parseConfig(working) : null), [working]);
  useEffect(() => {
    if (parsed?.ok) setLastValid(parsed.config);
  }, [parsed]);
  const display = proposal?.config ?? (parsed?.ok ? parsed.config : lastValid);

  // The preview follows edits after a short pause (a slider drag is one reload).
  const [previewCfg, setPreviewCfg] = useState<GameConfig | null>(display);
  useEffect(() => {
    if (!display) return setPreviewCfg(null);
    const h = setTimeout(() => setPreviewCfg(display), proposal ? 0 : 350);
    return () => clearTimeout(h);
  }, [display, proposal]);
  const previewKey = useMemo(() => (previewCfg ? JSON.stringify(previewCfg) : ""), [previewCfg]);

  const onEvent = useCallback(
    (e: GameEvent) => setLog((l) => (l.key === previewKey ? { key: l.key, log: reduceLog(l.log, e) } : { key: previewKey, log: reduceLog(EMPTY_LOG, e) })),
    [previewKey],
  );

  // ── Saving ───────────────────────────────────────────────────────────────
  const persist = useCallback(
    async (config: GameConfig, snapshot: { source: Proposal["source"] | "manual"; note: string } | null): Promise<boolean> => {
      if (!open?.id) {
        setSave("local");
        return false;
      }
      setSave("saving");
      const r = await api<{ project: ProjectSummary; versions?: VersionSummary[] }>(`/projects/${encodeURIComponent(open.id)}`, {
        method: "PUT",
        body: { config, snapshot: snapshot ? { source: snapshot.source, note: snapshot.note.slice(0, 200) } : null },
      });
      if (!r.ok) {
        setSave("failed");
        if (r.error) setNotice(r.error);
        return false;
      }
      savedJson.current = JSON.stringify(config);
      setSave("saved");
      if (r.data.versions) setVersions(r.data.versions);
      setProjects((l) => [r.data.project, ...l.filter((p) => p.id !== r.data.project.id)]);
      return true;
    },
    [open],
  );

  // Autosave the working game (valid only, no proposal on screen).
  useEffect(() => {
    if (!open?.id || !parsed?.ok || proposal) return;
    const json = JSON.stringify(parsed.config);
    if (json === savedJson.current) return;
    const h = setTimeout(() => void persist(parsed.config, null), 1200);
    return () => clearTimeout(h);
  }, [open, parsed, proposal, persist]);

  const onProposal = useCallback(
    (p: Proposal) => {
      setProposal(p);
      if (!wide) setTab("game");
    },
    [wide],
  );

  const apply = async () => {
    if (!proposal) return;
    const p = proposal;
    setWorking(p.config);
    setLastValid(p.config);
    setProposal(null);
    await persist(p.config, { source: p.source, note: p.note });
  };

  const previewVersion = async (n: number) => {
    if (!open?.id) return;
    const r = await api<{ config: GameConfig }>(`/projects/${encodeURIComponent(open.id)}/versions/${n}`);
    if (!r.ok) return setNotice(r.error || k("api.store"));
    const v = parseConfig(r.data.config);
    if (!v.ok) return setNotice(k("api.invalid"));
    onProposal({ config: v.config, say: k("history.previewing", { n }), source: "restore", note: k("history.restored", { n }) });
  };

  const removeProject = async (id: string) => {
    if (!window.confirm(k("picker.deleteConfirm"))) return;
    const r = await api(`/projects/${encodeURIComponent(id)}`, { method: "DELETE", body: {} });
    if (!r.ok) return setNotice(r.error || k("api.store"));
    setProjects((l) => l.filter((p) => p.id !== id));
    setShares((l) => l.filter((s) => s.projectId !== id));
    if (open?.id === id) {
      setOpen(null);
      setWorking(null);
    }
  };

  // ── Missions ─────────────────────────────────────────────────────────────
  const workingJson = useMemo(() => (parsed?.ok ? JSON.stringify(parsed.config) : ""), [parsed]);
  const curLog = log.key === previewKey ? log.log : EMPTY_LOG;
  const mission = useMemo(() => {
    if (!isChallenge || !parsed?.ok || proposal) return [];
    return missions(mode as ChallengeId, parsed.config, workingJson === previewKey ? curLog : EMPTY_LOG);
  }, [isChallenge, parsed, proposal, mode, workingJson, previewKey, curLog]);

  const reach = useMemo(() => (display?.template === "platformer" ? checkLevels(display) : null), [display]);

  const pick = (id: string) => {
    flow.setMode(id);
    setClaimed(null);
    setTab("game");
    const tpl = IDS.includes(id) ? CHALLENGE_TEMPLATE[id as ChallengeId] : null;
    if (tpl && open && open.template !== tpl) {
      setOpen(null);
      setWorking(null);
    }
    autoOpened.current = "";
  };

  // ── Pieces ───────────────────────────────────────────────────────────────
  const toolbar = <YouthBar t={t} ns={NS} ids={IDS} icons={ICONS} flow={flow} onPick={pick} />;
  const noticeBox = notice ? (
    <p role="status" className="flex items-start justify-between gap-2 rounded-xl bg-[#FFF4E6] px-3 py-2 text-sm text-[#8A4B00]" data-testid="gf-notice">
      <span>{notice}</span>
      <button type="button" className="shrink-0 text-xs font-bold underline" onClick={() => setNotice("")}>
        {k("dismiss")}
      </button>
    </p>
  ) : null;

  const frame = (body: ReactNode) => (
    <div className="space-y-3" data-testid="gf-root">
      {toolbar}
      {noticeBox}
      {body}
    </div>
  );

  if (flow.lockedBy) return frame(<YouthLocked t={t} ns={NS} flow={flow} onGo={pick} />);

  if (store === "loading") return frame(<div className="h-64 animate-pulse rounded-2xl bg-[var(--s2)]" aria-label={k("loading")} />);

  if (store === "blocked")
    return frame(
      <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-5 text-center" data-testid="gf-blocked">
        <p className="text-4xl" aria-hidden="true">🎮</p>
        <p className="mt-2 text-sm text-[var(--ink2)]">{notice || k("api.blocked")}</p>
      </section>,
    );

  const brief = isChallenge ? (
    <details className="group rounded-2xl border-2 border-[#F9D3B0] bg-[#FFF8F1] p-3" open={!working} data-testid="gf-brief">
      <summary className="cursor-pointer list-none text-sm font-black text-[#8A3B00]">
        <span aria-hidden="true">{ICONS[mode]}</span> {k(`ch.${mode}.title`)} · <span className="font-semibold">{k(`ch.${mode}.goal`)}</span>
      </summary>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#5C2E07]">
        {keys(t, `${NS}.ch.${mode}.s`).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </details>
  ) : null;

  // No game open: a challenge offers its template, free play the picker.
  if (!open || !working || !display) {
    const list = wantTemplate ? projects.filter((p) => p.template === wantTemplate) : projects;
    return frame(
      <>
        {brief}
        {store === "offline" && <OfflineNote k={k} />}
        {wantTemplate ? (
          <section className="rounded-3xl border-2 border-[#D2DCE8] bg-gradient-to-br from-[#0D1B2A] to-[#1B3A6B] p-6 text-center text-white" data-testid="gf-start-card">
            <p className="text-5xl" aria-hidden="true">{TEMPLATE_ICON[wantTemplate]}</p>
            <h2 className="mt-2 text-xl font-black">{k(`tpl.${wantTemplate}.name`)}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/80">{k(`tpl.${wantTemplate}.desc`)}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => startNew(wantTemplate)}
              className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#F47C20] px-6 py-2.5 text-base font-black text-white shadow hover:bg-[#E05F00] focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
              data-testid="gf-start"
            >
              ▶ {k("picker.start")}
            </button>
          </section>
        ) : (
          <section aria-label={k("picker.title")} data-testid="gf-picker">
            <h2 className="text-base font-black text-[var(--ink)]">🎮 {k("picker.title")}</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  disabled={busy}
                  onClick={() => startNew(tpl)}
                  className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#D2DCE8] bg-white p-3 text-center hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:opacity-60"
                  data-testid={`gf-template-${tpl}`}
                >
                  <span className="text-4xl" aria-hidden="true">{TEMPLATE_ICON[tpl]}</span>
                  <span className="text-sm font-black text-[var(--ink)]">{k(`tpl.${tpl}.name`)}</span>
                  <span className="text-[11px] leading-snug text-[var(--ink3)]">{k(`tpl.${tpl}.short`)}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        {list.length > 0 && (
          <section className="rounded-2xl border-2 border-[#D2DCE8] bg-white p-3" data-testid="gf-my-games">
            <h3 className="text-sm font-black text-[var(--ink)]">{k("picker.mine")}</h3>
            <ul className="mt-2 divide-y divide-[var(--border)]">
              {list.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <button type="button" className="min-w-0 flex-1 text-left text-sm font-bold text-[var(--ink)] hover:underline" onClick={() => openProject(p.id)} data-testid="gf-open-game">
                    <span aria-hidden="true">{TEMPLATE_ICON[p.template]}</span> {p.title}
                    <span className="block text-[11px] font-normal text-[var(--ink3)]">{k("picker.updated", { date: dates(p.updatedAt) })}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProject(p.id)}
                    aria-label={k("picker.delete", { name: p.title })}
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border-2 border-[#F5C2C7] text-[#B02A37] hover:bg-[#FFF5F5]"
                    data-testid="gf-delete-game"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>,
    );
  }

  // ── A game is open ───────────────────────────────────────────────────────
  const valid = !!parsed?.ok;
  const myShares = shares.filter((s) => s.projectId === open.id && !s.revokedAt);
  const sameTemplate = projects.filter((p) => (wantTemplate ? p.template === wantTemplate : true));
  const stars = mission.reduce((n, m, i) => (n === i && m.done ? n + 1 : n), 0);
  const nextId = isChallenge ? flow.nextOf(mode) : null;
  const nextOpen = nextId && !flow.unlocks.lockedBy(nextId) ? nextId : null;

  const header = (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-[#D2DCE8] bg-white p-2" data-testid="gf-header">
      <span className="text-2xl" aria-hidden="true">{TEMPLATE_ICON[open.template]}</span>
      <label className="sr-only" htmlFor="gf-project-select">{k("picker.switch")}</label>
      <select
        id="gf-project-select"
        value={open.id ?? ""}
        onChange={(e) => (e.target.value === "__new" ? startNew(open.template) : e.target.value ? openProject(e.target.value) : undefined)}
        className="min-h-[40px] min-w-0 flex-1 basis-[60%] truncate rounded-xl sm:basis-auto border-2 border-[#D2DCE8] bg-white px-2 text-sm font-bold text-[var(--ink)]"
        data-testid="gf-project-select"
      >
        {!open.id && <option value="">{working.title}</option>}
        {sameTemplate.map((p) => (
          <option key={p.id} value={p.id}>{`${TEMPLATE_ICON[p.template]} ${p.title}`}</option>
        ))}
        {store === "ready" && <option value="__new">＋ {k("picker.newOf", { name: k(`tpl.${open.template}.name`) })}</option>}
      </select>
      {!isChallenge && (
        <button
          type="button"
          onClick={() => {
            setOpen(null);
            setWorking(null);
          }}
          className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 border-[#D2DCE8] px-2.5 text-xs font-bold text-[var(--ink)] hover:border-[#F47C20]"
          data-testid="gf-new-game"
        >
          <Plus size={14} aria-hidden="true" /> {k("picker.other")}
        </button>
      )}
      <span className="text-[11px] font-semibold text-[var(--ink3)]" role="status" data-testid="gf-save-status" data-state={save}>
        {k(`save.${save}`)}
      </span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={() => setShareOpen((o) => !o)}
        aria-expanded={shareOpen}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0F7B45] px-3 text-xs font-black text-white hover:bg-[#0B5A33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F7B45] focus-visible:ring-offset-2"
        data-testid="gf-share-toggle"
      >
        <Share2 size={14} aria-hidden="true" /> {k("share.button")}
        {myShares.length > 0 && <span className="rounded-full bg-white/25 px-1.5">{myShares.length}</span>}
      </button>
    </div>
  );

  const proposalBar = proposal && (
    <div className="rounded-2xl border-2 border-[#B197FC] bg-[#F3F0FF] p-3" role="status" aria-live="polite" data-testid="gf-proposal" data-source={proposal.source}>
      <p className="text-sm font-bold text-[#3B2A7A]">
        ✨ {k("proposal.title")} <span className="font-semibold">{proposal.say}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={apply}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#7048E8] px-4 py-2 text-sm font-black text-white hover:bg-[#5F3DC4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7048E8] focus-visible:ring-offset-2"
          data-testid="gf-apply"
        >
          ✓ {k("proposal.apply")}
        </button>
        <button
          type="button"
          onClick={() => setProposal(null)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#B197FC] bg-white px-4 py-2 text-sm font-bold text-[#3B2A7A] hover:bg-[#F8F6FF]"
          data-testid="gf-undo"
        >
          ↩︎ {k("proposal.undo")}
        </button>
      </div>
    </div>
  );

  const gameCol = (
    <div className="space-y-3">
      {proposalBar}
      {!valid && !proposal && (
        <p role="alert" className="rounded-xl bg-[#FFF5F5] px-3 py-2 text-sm text-[#842029]" data-testid="gf-invalid">
          ⚠️ {k("set.showingLast")}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border-2 border-[#0D1B2A] bg-[#0D1B2A] shadow-lg">
        {previewCfg && (
          <GamePreview
            config={previewCfg}
            labels={labels}
            lang={locale}
            restartKey={restart}
            onEvent={onEvent}
            title={k("previewTitle", { name: previewCfg.title })}
            className={`block w-full bg-white ${wide ? "h-[560px]" : embedded ? "h-[440px]" : "h-[min(68vh,540px)] min-h-[400px]"}`}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setRestart((n) => n + 1)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#D2DCE8] bg-white px-3 text-sm font-bold text-[var(--ink)] hover:border-[#F47C20]"
          data-testid="gf-restart"
        >
          <RotateCcw size={15} aria-hidden="true" /> {k("restart")}
        </button>
        {!proposal && versions.length >= 2 && (
          <button
            type="button"
            onClick={() => previewVersion(versions[1].n)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#D2DCE8] bg-white px-3 text-sm font-bold text-[var(--ink)] hover:border-[#F47C20]"
            data-testid="gf-undo-last"
          >
            ↩︎ {k("undoLast")}
          </button>
        )}
        <span className="text-xs text-[var(--ink3)]">{k(`controls.${open.template}`)}</span>
      </div>
      {reach && (
        <ul className="flex flex-wrap gap-1.5" aria-label={k("reach.title")} data-testid="gf-reach">
          {reach.map((r, i) => (
            <li key={i} className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.ok ? "bg-[#E8F7EF] text-[#0B5A33]" : "bg-[#FFF4E6] text-[#8A4B00]"}`} data-ok={r.ok ? "true" : "false"}>
              {r.ok ? "✅" : "⚠️"} {k("set.plat.levelN", { n: i + 1 })}
              {curLog.levels.includes(i) && workingJson === previewKey ? ` · ${k("reach.beaten")}` : ""}
            </li>
          ))}
        </ul>
      )}
      {isChallenge && mission.length > 0 && (
        <MissionBoard
          t={t}
          missions={mission.map((m) => ({ id: m.id, done: m.done, label: k(`ch.${mode}.${m.id}`) }))}
          claimed={claimed}
          insight={k(`ch.${mode}.insight`)}
          onClaim={() => setClaimed({ stars, improved: flow.claim(mode, stars) })}
          nextLabel={nextOpen ? t(`${Y}.goTo`, { name: k(`ch.${nextOpen}.title`) }) : null}
          onNext={nextOpen ? () => pick(nextOpen) : undefined}
        />
      )}
    </div>
  );

  const changeCol = (
    <ChangePanel
      config={parsed?.ok ? parsed.config : display}
      k={k}
      onProposal={onProposal}
      pending={!!proposal}
      versions={versions}
      onPreviewVersion={previewVersion}
      onSaveVersion={() => parsed?.ok && void persist(parsed.config, { source: "manual", note: k("history.manualNote") })}
      canSave={!!open.id && valid}
      dates={dates}
    />
  );

  const settingsCol = (
    <GameSettings
      config={working}
      onChange={(c) => {
        if (proposal) setProposal(null);
        setWorking(c);
      }}
      issues={parsed && !parsed.ok ? parsed.issues : []}
      reach={reach}
      k={k}
    />
  );

  const shareBox = shareOpen && (
    <ShareBox
      k={k}
      projectId={open.id}
      canShare={store === "ready" && !!open.id && valid && !proposal}
      dirty={workingJson !== savedJson.current}
      flush={async () => (parsed?.ok ? persist(parsed.config, null) : false)}
      shares={myShares}
      setShares={setShares}
      dates={dates}
    />
  );

  const tabBtn = (id: Tab, label: string, icon: ReactNode, active: boolean, onClick: () => void) => (
    <button
      key={id}
      role="tab"
      type="button"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition-colors ${
        active ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--ink3)] hover:text-[var(--ink)]"
      }`}
      data-testid={`gf-tab-${id}`}
    >
      {icon} {label}
      {id === "game" && proposal && !active && <span className="h-2 w-2 rounded-full bg-[#7048E8]" aria-hidden="true" />}
    </button>
  );

  const issues = parsed && !parsed.ok ? parsed.issues : [];

  if (wide) {
    return frame(
      <>
        {brief}
        {store === "offline" && <OfflineNote k={k} />}
        {header}
        {shareBox}
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4">
          <div className="min-w-0">{gameCol}</div>
          <div className="min-w-0 space-y-3">
            <div role="tablist" aria-label={k("tabs")} className="flex rounded-xl bg-[var(--s2)] p-1">
              {tabBtn("change", k("tab.change"), <Wand2 size={14} aria-hidden="true" />, rightTab === "change", () => setRightTab("change"))}
              {tabBtn("settings", k("tab.settings"), <Settings2 size={14} aria-hidden="true" />, rightTab === "settings", () => setRightTab("settings"))}
            </div>
            <div role="tabpanel" hidden={rightTab !== "change"}>{changeCol}</div>
            <div role="tabpanel" hidden={rightTab !== "settings"}>{settingsCol}</div>
          </div>
        </div>
      </>,
    );
  }

  return frame(
    <>
      {brief}
      {store === "offline" && <OfflineNote k={k} />}
      {header}
      {shareBox}
      <div role="tablist" aria-label={k("tabs")} className="sticky top-0 z-10 flex rounded-xl bg-[var(--s2)] p-1">
        {tabBtn("game", k("tab.game"), <Gamepad2 size={14} aria-hidden="true" />, tab === "game", () => setTab("game"))}
        {tabBtn("change", k("tab.change"), <Wand2 size={14} aria-hidden="true" />, tab === "change", () => setTab("change"))}
        {tabBtn("settings", k("tab.settings"), <Settings2 size={14} aria-hidden="true" />, tab === "settings", () => setTab("settings"))}
      </div>
      {issues.length > 0 && tab !== "settings" && (
        <p role="alert" className="rounded-xl bg-[#FFF5F5] px-3 py-2 text-xs text-[#842029]">
          ⚠️ {issueText(k, issues[0])}
        </p>
      )}
      {/* All three stay mounted (the chat, the running game and the editors keep their state). */}
      <div role="tabpanel" hidden={tab !== "game"}>{gameCol}</div>
      <div role="tabpanel" hidden={tab !== "change"}>{changeCol}</div>
      <div role="tabpanel" hidden={tab !== "settings"}>{settingsCol}</div>
    </>,
  );
}

function OfflineNote({ k }: { k: (s: string) => string }) {
  return (
    <p className="rounded-xl bg-[#EBF0FA] px-3 py-2 text-xs text-[#1B3A6B]" data-testid="gf-offline">
      💾 {k("offline")}
    </p>
  );
}

function ShareBox({
  k,
  projectId,
  canShare,
  dirty,
  flush,
  shares,
  setShares,
  dates,
}: {
  k: (s: string, v?: Record<string, string | number>) => string;
  projectId: string | null;
  canShare: boolean;
  dirty: boolean;
  flush: () => Promise<boolean>;
  shares: ShareSummary[];
  setShares: (f: (l: ShareSummary[]) => ShareSummary[]) => void;
  dates: (iso: string) => string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState("");
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const create = async () => {
    if (!projectId || busy) return;
    setBusy(true);
    setMsg(null);
    if (dirty) await flush();
    const r = await api<{ share: ShareSummary; path: string }>("/share", { method: "POST", body: { projectId } });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error || k("share.failed") });
    setShares((l) => [r.data.share, ...l]);
    setMsg({ ok: true, text: k("share.made") });
  };
  const revoke = async (token: string) => {
    setBusy(true);
    const r = await api<{ shares: ShareSummary[] }>("/share", { method: "DELETE", body: { token } });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error || k("share.failed") });
    setShares(() => r.data.shares);
    setMsg({ ok: true, text: k("share.revoked") });
  };
  const copy = async (url: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setMsg({ ok: false, text: k("share.copyFailed") });
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border-2 border-[#8CE99A] bg-[#F1FBF3] p-3" data-testid="gf-share">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-black text-[#0B5A33]">
          <Link2 size={16} aria-hidden="true" /> {k("share.title")}
        </h3>
        <p className="mt-1 text-xs text-[#1E4D2B]">{k("share.intro")}</p>
      </div>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-white text-[#0B5A33]" : "bg-[#FFF5F5] text-[#842029]"}`} data-testid="gf-share-msg">
          {msg.text}
        </p>
      )}
      <button
        type="button"
        onClick={create}
        disabled={!canShare || busy}
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F7B45] px-4 py-2 text-sm font-black text-white hover:bg-[#0B5A33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F7B45] focus-visible:ring-offset-2 disabled:opacity-50"
        data-testid="gf-share-create"
      >
        <Link2 size={16} aria-hidden="true" /> {busy ? k("share.working") : k("share.create")}
      </button>
      {!canShare && <p className="text-xs text-[#1E4D2B]">{k(projectId ? "share.cannot" : "share.local")}</p>}
      {shares.length > 0 && (
        <ul className="space-y-2">
          {shares.map((s) => {
            const url = `${origin}/play/${s.token}`;
            return (
              <li key={s.token} className="rounded-xl border border-[#B2F2BB] bg-white p-2.5" data-testid="gf-share-link">
                <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label={k("share.linkLabel")} className="w-full rounded-lg bg-[var(--s2)] px-2 py-1.5 font-mono text-xs text-[var(--ink)]" data-testid="gf-share-url" />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => copy(url, s.token)} className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 border-[#D2DCE8] px-3 text-xs font-bold" data-testid="gf-share-copy">
                    <Copy size={14} aria-hidden="true" /> {copied === s.token ? k("share.copied") : k("share.copy")}
                  </button>
                  <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 border-[#D2DCE8] px-3 text-xs font-bold" data-testid="gf-share-open">
                    <ExternalLink size={14} aria-hidden="true" /> {k("share.open")}
                  </a>
                  <button type="button" disabled={busy} onClick={() => revoke(s.token)} className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border-2 border-[#F5C2C7] px-3 text-xs font-bold text-[#B02A37]" data-testid="gf-share-revoke">
                    <Trash2 size={14} aria-hidden="true" /> {k("share.revoke")}
                  </button>
                  <span className="text-[11px] text-[var(--ink3)]">{k("share.meta", { date: dates(s.createdAt), n: s.views })}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-[#1E4D2B]">{k("share.frozen")}</p>
    </section>
  );
}
