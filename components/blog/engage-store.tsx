"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EngageData, ReactionKind } from "@/lib/blog/engage/types";

// One copy of an article's engagement data (lib/blog/engage) for everything
// on the page that shows it: the sticky reading bar, the mid-article prompt
// and the discussion under the article. A reaction picked anywhere shows
// everywhere at once.

export async function postJson(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

interface EngageStore {
  slug: string;
  data: EngageData | null;
  failed: boolean;
  load: () => Promise<EngageData | null>;
  /** Picks a reaction, or clears it when it is the reader's current one. */
  react: (kind: ReactionKind) => Promise<void>;
}

const Ctx = createContext<EngageStore | null>(null);

export function useEngage(): EngageStore {
  const s = useContext(Ctx);
  if (!s) throw new Error("useEngage outside EngageProvider");
  return s;
}

export function EngageProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [data, setData] = useState<EngageData | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const latest = useRef<EngageData | null>(null);
  latest.current = data;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/engage/post/${slug}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as EngageData;
      setData(d);
      setFailed(false);
      return d;
    } catch {
      setFailed(true);
      return null;
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const react = useCallback(
    async (k: ReactionKind) => {
      const d = latest.current;
      if (!d || busy.current) return;
      const mine = d.reactions.mine;
      const next = mine === k ? null : k;
      // Shown at once; the server's counts replace the guess.
      const guess = { ...d.reactions.counts };
      if (mine) guess[mine] = Math.max(0, guess[mine] - 1);
      if (next) guess[next] += 1;
      const set = (counts: EngageData["reactions"]["counts"], m: ReactionKind | null) => setData((x) => (x ? { ...x, reactions: { counts, mine: m } } : x));
      set(guess, next);
      busy.current = true;
      const r = await postJson(`/api/blog/engage/post/${slug}/react`, { kind: next });
      busy.current = false;
      if (r.ok) set(r.data.counts as EngageData["reactions"]["counts"], (r.data.mine as ReactionKind | null) ?? null);
      else set(d.reactions.counts, mine);
    },
    [slug],
  );

  const value = useMemo(() => ({ slug, data, failed, load, react }), [slug, data, failed, load, react]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Scrolls to the comment box and puts the cursor in it. */
export function goToCommentBox(): void {
  const box = document.getElementById("c-body-root") as HTMLTextAreaElement | null;
  const target = box ?? document.getElementById("discussion");
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  if (box) window.setTimeout(() => box.focus({ preventScroll: true }), 450);
}
