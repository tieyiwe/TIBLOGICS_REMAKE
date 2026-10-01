"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ElementType } from "react";
import {
  CalendarPlus,
  CornerDownLeft,
  ExternalLink,
  FilePlus2,
  FileText,
  GraduationCap,
  Link2,
  LoaderCircle,
  Megaphone,
  MessageSquareText,
  Package,
  Radio,
  Search,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  Upload,
  User,
  UserSearch,
  Users,
} from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/admin/ui";
import { canSee, flattenNav, type NavSection, type NavViewer } from "./nav";

export type QuickAction = { label: string; href: string; icon: ElementType; keywords?: string; external?: boolean };

/** Create / quick actions. Each links to an existing route and inherits that route's permission. */
export const QUICK_ACTIONS: QuickAction[] = [
  { label: "New appointment", href: "/admin_pro/appointments", icon: CalendarPlus, keywords: "booking meeting schedule" },
  { label: "New marketing kit", href: "/admin_pro/growth/content", icon: Sparkles, keywords: "content kit social campaign" },
  { label: "New campaign", href: "/admin_pro/growth/campaigns/new", icon: Megaphone, keywords: "marketing launch" },
  { label: "Import leads", href: "/admin_pro/growth/leads", icon: Upload, keywords: "csv upload crm" },
  { label: "New tracked link", href: "/admin_pro/growth/links", icon: Link2, keywords: "utm attribution short link" },
  { label: "New live session", href: "/admin_pro/learn/live", icon: Radio, keywords: "learn webinar arfa academy" },
  { label: "New blog post", href: "/admin_pro/blog", icon: FilePlus2, keywords: "ai times article write" },
  { label: "New promotion", href: "/admin_pro/promotions/new", icon: TicketPercent, keywords: "discount sale coupon promo code" },
  { label: "Message learners", href: "/admin_pro/communications", icon: MessageSquareText, keywords: "email broadcast arfa academy students" },
];

export function visibleQuickActions(viewer: NavViewer) {
  return QUICK_ACTIONS.filter((a) => canSee(a.href, viewer));
}

const RECENT_KEY = "tib.admin.recent";

/** Remember the last few admin pages visited (per browser, best effort). */
export function rememberRecent(href: string) {
  try {
    const cur = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
    const next = [href, ...cur.filter((h) => h !== href)].slice(0, 6);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

function readRecent(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

type Hit = { id: string; group: string; title: string; subtitle: string; href: string; badge?: string };

const GROUP_ICON: Record<string, ElementType> = {
  Learners: GraduationCap,
  Leads: UserSearch,
  Prospects: Users,
  Contacts: User,
  Orders: ShoppingBag,
  Products: Package,
  "Blog posts": FileText,
};

/** Debounced record search against /api/admin/search. */
function useRecordSearch(q: string, enabled: boolean) {
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const query = q.trim();
    if (!enabled || query.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    const ctl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, { signal: ctl.signal });
        if (res.ok) {
          const data = (await res.json()) as { hits?: Hit[] };
          setHits(data.hits ?? []);
        } else setHits([]);
      } catch {
        /* aborted or offline: keep the previous hits */
      } finally {
        if (!ctl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      ctl.abort();
      window.clearTimeout(t);
    };
  }, [q, enabled]);
  return { hits, loading };
}

type Entry = {
  kind: "action" | "page" | "record";
  label: string;
  href: string;
  icon: ElementType;
  hint: string;
  hay: string;
  external?: boolean;
  sub?: string;
  badge?: string;
  group?: string;
};

function score(hay: string, q: string): number {
  if (!q) return 1;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  let s = 0;
  for (const w of words) {
    const i = hay.indexOf(w);
    if (i < 0) return 0;
    s += i === 0 ? 3 : hay[i - 1] === " " ? 2 : 1;
  }
  return s;
}

export function CommandPalette({
  open,
  onClose,
  sections,
  viewer,
}: {
  open: boolean;
  onClose: () => void;
  sections: NavSection[];
  viewer: NavViewer;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  useFocusTrap(panelRef, open, { initialFocus: inputRef });

  const entries = useMemo<Entry[]>(() => {
    const actions: Entry[] = visibleQuickActions(viewer).map((a) => ({
      kind: "action",
      label: a.label,
      href: a.href,
      icon: a.icon,
      hint: "Quick action",
      hay: `${a.label} ${a.keywords ?? ""}`.toLowerCase(),
    }));
    const pages: Entry[] = flattenNav(sections).map((p) => ({
      kind: "page",
      label: p.label,
      href: p.href,
      icon: p.icon,
      hint: p.section,
      hay: `${p.label} ${p.section} ${p.keywords ?? ""} ${p.href.replace(/[/_-]/g, " ")}`.toLowerCase(),
    }));
    const site: Entry = {
      kind: "page",
      label: "View website",
      href: "/",
      icon: ExternalLink,
      hint: "Public site",
      hay: "view website public site home",
      external: true,
    };
    return [...actions, ...pages, site];
  }, [sections, viewer]);

  const { hits, loading } = useRecordSearch(q, open);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const nav = entries
      .map((e, i) => ({ e, s: score(e.hay, query), i }))
      .filter((x) => x.s > 0)
      .sort((a, b) => (query ? b.s - a.s || a.i - b.i : a.i - b.i))
      .map((x) => x.e);
    if (!query) {
      // Recently visited pages first (only ones still in this viewer's nav).
      const rec = recent
        .map((h) => nav.find((e) => e.kind === "page" && e.href === h))
        .filter((e): e is Entry => !!e)
        .slice(0, 4)
        .map((e) => ({ ...e, kind: "page" as const, group: "Recent" }));
      return [...rec, ...nav];
    }
    const records: Entry[] = hits.map((h) => ({
      kind: "record",
      label: h.title,
      sub: h.subtitle,
      badge: h.badge,
      href: h.href,
      icon: GROUP_ICON[h.group] ?? Search,
      hint: h.group,
      hay: "",
      group: h.group,
    }));
    // Jump targets first (they are instant), then records grouped by type.
    return [...nav.slice(0, 6), ...records];
  }, [entries, q, hits, recent]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
    }
  }, [open]);
  useEffect(() => setIdx(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  if (!open) return null;

  const go = (e: Entry | undefined) => {
    if (!e) return;
    onClose();
    if (e.external) window.open(e.href, "_blank", "noopener");
    else router.push(e.href);
  };

  const onKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (ev.key === "Home") {
      setIdx(0);
    } else if (ev.key === "End") {
      setIdx(results.length - 1);
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      go(results[idx]);
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <div className="a-anim-fade absolute inset-0 bg-[rgba(13,27,42,.45)]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="a-anim-pop relative flex max-h-[70vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[16px] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-pop)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--a-border)] px-4">
          <Search size={18} className="shrink-0 text-[var(--a-ink-3)]" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages, actions, learners, leads, orders"
            aria-label="Search pages, actions and records"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[idx] ? `${listId}-${idx}` : undefined}
            className="h-14 min-w-0 flex-1 bg-transparent font-dm text-[15px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {loading ? <LoaderCircle size={16} className="shrink-0 animate-spin text-[var(--a-ink-3)]" aria-label="Searching" /> : null}
          <Kbd className="hidden sm:inline-flex">Esc</Kbd>
        </div>
        <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="flex flex-col items-center px-3 py-10 text-center font-dm">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--a-surface-2)] text-[var(--a-ink-3)] ring-1 ring-inset ring-[var(--a-border)]">
                <Search size={18} aria-hidden />
              </span>
              <span className="text-[14px] font-semibold text-[var(--a-ink)]">{loading ? "Searching" : "No matches"}</span>
              <span className="mt-1 text-[13px] text-[var(--a-ink-3)]">
                {loading ? "Looking through records" : <>Nothing matches &ldquo;{q}&rdquo;. Try a name, email or order number.</>}
              </span>
            </li>
          ) : (
            results.map((e, i) => {
              const group =
                e.kind === "record"
                  ? (e.group ?? "Records")
                  : e.group === "Recent"
                    ? "Recent"
                    : q
                      ? "Jump to"
                      : e.kind === "action"
                        ? "Quick actions"
                        : "Pages";
              const showGroup = !!group && group !== lastGroup;
              lastGroup = group;
              const Icon = e.icon;
              const on = i === idx;
              return (
                <li key={`${e.kind}-${e.href}-${e.label}-${i}`} role="presentation">
                  {showGroup ? <p className="a-micro px-3 pb-1 pt-2">{group}</p> : null}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={on}
                    data-idx={i}
                    onMouseMove={() => setIdx(i)}
                    onClick={() => go(e)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 font-dm",
                      on ? "bg-[var(--a-info-bg)]" : "hover:bg-[var(--a-surface-2)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                        e.kind === "record"
                          ? "bg-[var(--a-info-bg)] text-[var(--a-info)] ring-[#d3def3]"
                          : e.kind === "action"
                          ? "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)] ring-[#f9d6b8]"
                          : "bg-[var(--a-surface-2)] text-[var(--a-ink-2)] ring-[var(--a-border)]",
                      )}
                    >
                      <Icon size={15} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[var(--a-ink)]">{e.label}</span>
                      {e.sub ? <span className="block truncate text-[12px] text-[var(--a-ink-3)]">{e.sub}</span> : null}
                    </span>
                    {e.badge ? (
                      <span className="hidden shrink-0 rounded-full bg-[var(--a-surface-2)] px-2 py-0.5 text-[11.5px] font-semibold capitalize text-[var(--a-ink-2)] ring-1 ring-inset ring-[var(--a-border)] sm:inline">
                        {e.badge.replace(/_/g, " ")}
                      </span>
                    ) : e.kind !== "record" ? (
                      <span className="hidden shrink-0 text-[12px] text-[var(--a-ink-3)] sm:inline">{e.hint}</span>
                    ) : null}
                    {on ? <CornerDownLeft size={14} className="shrink-0 text-[var(--a-ink-3)]" aria-hidden /> : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
        <div className="hidden items-center gap-4 border-t border-[var(--a-border)] bg-[var(--a-surface-2)] px-4 py-2 font-dm text-[12px] text-[var(--a-ink-3)] sm:flex">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to move
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Enter</Kbd> to open
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd> to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
